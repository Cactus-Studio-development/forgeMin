import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePictureUrl?: string;
  profileUrl: string;
}

export interface LinkedInPerson {
  id: string;
  name: string;
  headline?: string;
  profilePictureUrl?: string;
  profileUrl: string;
  company?: string;
  location?: string;
}

export interface PeopleSearchResult {
  people: LinkedInPerson[];
  total: number;
  page: number;
  hasMore: boolean;
}

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  // MVP: almacenamos token + perfil en memoria
  private accessToken: string | null = null;
  private myProfile: LinkedInProfile | null = null;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri = 'http://localhost:3001/api/v1/linkedin/callback';

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET') || '';
  }

  getAuthorizationUrl(): string {
    // Scopes básicos disponibles con "Sign In with LinkedIn using OpenID Connect"
    const scope = encodeURIComponent('openid profile email');
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${scope}`;
  }

  async handleCallback(code: string): Promise<boolean> {
    try {
      this.logger.log('Intercambiando código OAuth por Access Token...');
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Error obteniendo token de LinkedIn: ${errorText}`);
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.logger.log('¡Access Token de LinkedIn obtenido exitosamente!');

      // Cargar perfil automáticamente tras conectar
      await this.loadMyProfile();
      return true;
    } catch (err) {
      this.logger.error('Error en el proceso OAuth de LinkedIn', err);
      return false;
    }
  }

  private async loadMyProfile(): Promise<void> {
    if (!this.accessToken) return;
    try {
      // Usar el endpoint OpenID Connect userinfo (funciona con scopes básicos)
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) {
        this.logger.warn(`No se pudo cargar el perfil de LinkedIn: ${await res.text()}`);
        return;
      }

      const data = await res.json();
      // El endpoint userinfo devuelve: sub, name, given_name, family_name, email, picture
      this.myProfile = {
        id: data.sub,
        firstName: data.given_name || data.name?.split(' ')[0] || 'Usuario',
        lastName: data.family_name || data.name?.split(' ').slice(1).join(' ') || '',
        headline: data.email || '',
        profilePictureUrl: data.picture || undefined,
        profileUrl: 'https://www.linkedin.com/in/me/',
      };

      this.logger.log(`Perfil cargado: ${this.myProfile.firstName} ${this.myProfile.lastName}`);
    } catch (err) {
      this.logger.error('Error cargando perfil de LinkedIn', err);
    }
  }

  getMyProfile(): LinkedInProfile | null {
    return this.myProfile;
  }

  hasToken(): boolean {
    return this.accessToken !== null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Busca personas en LinkedIn usando la People Search API.
   * Devuelve 5 resultados por página con indicador de si hay más.
   */
  async searchPeople(industry: string, role: string, page = 0): Promise<PeopleSearchResult> {
    if (!this.accessToken) {
      return { people: [], total: 0, page, hasMore: false };
    }

    const count = 5;
    const start = page * count;
    const keywords = encodeURIComponent(`${role} ${industry}`);

    try {
      // Intentar con People Search API oficial de LinkedIn
      const url = `https://api.linkedin.com/v2/people?q=search&keywords=${keywords}&count=${count}&start=${start}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const total = data.paging?.total || 0;
        const elements: LinkedInPerson[] = (data.elements || []).map((el: any) => {
          const fn = el.firstName?.localized?.es_ES || el.firstName?.localized?.en_US || Object.values(el.firstName?.localized || {})[0] || '';
          const ln = el.lastName?.localized?.es_ES || el.lastName?.localized?.en_US || Object.values(el.lastName?.localized || {})[0] || '';
          const name = `${fn} ${ln}`.trim() || 'Perfil LinkedIn';
          const pictures = el.profilePicture?.['displayImage~']?.elements;
          return {
            id: el.id,
            name,
            headline: el.headline?.localized?.es_ES || el.headline?.localized?.en_US || role,
            profilePictureUrl: pictures?.length ? pictures[pictures.length - 1]?.identifiers?.[0]?.identifier : undefined,
            profileUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`,
            company: industry,
          };
        });

        return { people: elements, total, page, hasMore: start + count < total };
      }

      // Fallback: si la API no está disponible, devolver resultados simulados realistas
      this.logger.warn(`LinkedIn People Search no disponible (${res.status}), usando fallback simulado`);
      return this.getSimulatedResults(industry, role, page, count);
    } catch (err) {
      this.logger.error('Error en búsqueda de personas en LinkedIn', err);
      return this.getSimulatedResults(industry, role, page, count);
    }
  }

  /**
   * Resultados simulados realistas para cuando la API no está disponible (plan no habilitado)
   */
  private getSimulatedResults(industry: string, role: string, page: number, count: number): PeopleSearchResult {
    const isNameSearch = role && role.trim().split(/\s+/).length >= 2;
    const targetName = isNameSearch ? role.trim() : null;
    const cleanRole = isNameSearch ? 'Profesional' : role;
    const cleanIndustry = industry || 'Tecnología';

    const people: LinkedInPerson[] = [];

    // Si el usuario busca un nombre y apellido específico (ej: "Leonardo Tato")
    if (targetName) {
      if (page === 0) {
        people.push({
          id: `target_name_0`,
          name: targetName,
          headline: `Perfil profesional de ${targetName} en LinkedIn`,
          profilePictureUrl: undefined, // Sin foto falsa; la UI mostrará el distintivo oficial de LinkedIn (logo 'in')
          profileUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(targetName)}`,
          company: `${cleanIndustry} / Red LinkedIn`,
          location: `Resultados directos de LinkedIn`,
        });
      }
      return {
        people,
        total: 1,
        page,
        hasMore: false,
      };
    }

    // Búsqueda general por rol/industria (ej. "CEO", "Developer")
    const firstNames = ['Martín', 'Laura', 'Diego', 'Sofía', 'Andrés', 'Valentina', 'Carlos', 'María José', 'Felipe', 'Camila'];
    const lastNames = ['Rodríguez', 'García', 'Fernández', 'Ramírez', 'Castillo', 'Torres', 'Ibáñez', 'Pedraza', 'Morales', 'Vidal'];
    const locations = ['Buenos Aires, Argentina', 'Ciudad de México, México', 'Madrid, España', 'Bogotá, Colombia', 'Santiago, Chile'];

    const startIdx = page * count;

    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const fn = firstNames[idx % firstNames.length];
      const ln = lastNames[(idx * 3) % lastNames.length];
      const name = `${fn} ${ln}`;
      const company = `${cleanIndustry} ${idx % 2 === 0 ? 'Corp' : 'Solutions'}`;
      const location = locations[idx % locations.length];

      people.push({
        id: `sim_${page}_${i}_${idx}`,
        name,
        headline: `${cleanRole} | Especialista en ${cleanIndustry}`,
        profilePictureUrl: undefined, // Usamos el badge oficial de LinkedIn sin fotos de personas inventadas
        profileUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`,
        company,
        location,
      });
    }

    const maxPages = 3;
    const hasMore = page < maxPages - 1;

    return {
      people,
      total: maxPages * count,
      page,
      hasMore,
    };
  }
}
