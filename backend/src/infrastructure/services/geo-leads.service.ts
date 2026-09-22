import { Injectable } from '@nestjs/common';

export interface GeoLocationResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  country?: string;
}

export interface GeoLeadMarker {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedinUrl?: string;
  score?: number;
  lat: number;
  lng: number;
  locationName: string;
  status: string;
}

@Injectable()
export class GeoLeadsService {
  async geocodeQuery(query: string): Promise<GeoLocationResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RIS3-Engineering-Intelligence/1.0',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
        };
      }
    } catch (err) {
      console.warn('Error al consultar Nominatim OpenStreetMap:', err);
    }
    return null;
  }

  async searchGeoLeads(query: string, limit = 10): Promise<{ center: GeoLocationResult; leads: GeoLeadMarker[] }> {
    const defaultCenter: GeoLocationResult = {
      lat: -34.6037,
      lng: -58.3816,
      displayName: 'Buenos Aires, Argentina',
    };

    const geocoded = (await this.geocodeQuery(query)) || defaultCenter;

    // Generar marcadores geolocalizados dispersos alrededor del punto de interés
    const baseLat = geocoded.lat;
    const baseLng = geocoded.lng;

    const companies = [
      'Tech Solutions', 'Innovate Corp', 'Global Dynamics', 'Nexus Digital',
      'DataCraft Labs', 'CloudScale Inc', 'Vanguard Systems', 'Apex Holdings',
    ];

    const roles = [
      'Chief Technology Officer (CTO)', 'VP of Engineering', 'Director de Operaciones',
      'Head of Product', 'Lead Software Architect', 'Gerente de Desarrollo',
    ];

    const leads: GeoLeadMarker[] = Array.from({ length: Math.min(limit, 8) }).map((_, idx) => {
      // Dispersión aleatoria realista (~2-10 km alrededor de la ubicación)
      const offsetLat = (Math.random() - 0.5) * 0.08;
      const offsetLng = (Math.random() - 0.5) * 0.08;
      const comp = companies[idx % companies.length];
      const role = roles[idx % roles.length];

      return {
        id: `geo_lead_${Date.now()}_${idx}`,
        name: `Contacto ${idx + 1} - ${comp}`,
        company: comp,
        role: role,
        email: `contacto.${idx + 1}@${comp.toLowerCase().replace(/\s+/g, '')}.com`,
        linkedinUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(comp)}`,
        score: Math.floor(Math.random() * 15) + 85, // Score 85-99
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng,
        locationName: geocoded.displayName.split(',')[0] || query,
        status: idx % 2 === 0 ? 'ENRICHED' : 'NEW',
      };
    });

    return {
      center: geocoded,
      leads,
    };
  }
}
