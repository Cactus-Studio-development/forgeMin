import { Injectable } from '@nestjs/common';
import { ContactType, ConfidenceLevel } from '../../domain/opportunity/opportunity.entity';

export interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  type: ContactType;
  sourceUrl: string;
  confidence: ConfidenceLevel;
  linkedinUrl?: string;
}

@Injectable()
export class ContactExtractorService {
  extractContacts(rawText: string, html: string, sourceUrl: string): {
    contacts: ExtractedContact[];
    contactMethods: Array<{ type: string; value: string; label?: string }>;
  } {
    const contacts: ExtractedContact[] = [];
    const contactMethods: Array<{ type: string; value: string; label?: string }> = [];

    // 1. Email extraction regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const foundEmails = new Set<string>();
    let emailMatch;

    const combinedSource = `${rawText} ${html}`;
    while ((emailMatch = emailRegex.exec(combinedSource)) !== null) {
      const email = emailMatch[0].toLowerCase();
      // Filter out static assets or false positives
      if (
        !email.endsWith('.png') &&
        !email.endsWith('.jpg') &&
        !email.endsWith('.webp') &&
        !email.endsWith('.svg') &&
        !email.endsWith('.js') &&
        !email.endsWith('.css') &&
        !email.includes('example.com') &&
        !email.includes('sentry.io') &&
        !foundEmails.has(email)
      ) {
        foundEmails.add(email);
        const classification = this.classifyEmail(email);
        contacts.push({
          name: this.formatNameFromEmail(email),
          email,
          role: classification.suggestedRole,
          type: classification.type,
          sourceUrl,
          confidence: classification.confidence,
        });

        contactMethods.push({
          type: 'email',
          value: email,
          label: classification.suggestedRole,
        });
      }
    }

    // 2. Phone number extraction regex
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
    const foundPhones = new Set<string>();
    let phoneMatch;
    while ((phoneMatch = phoneRegex.exec(rawText)) !== null) {
      const phone = phoneMatch[0].trim();
      if (phone.length >= 8 && phone.length <= 20 && !foundPhones.has(phone)) {
        foundPhones.add(phone);
        contactMethods.push({
          type: 'phone',
          value: phone,
          label: 'Teléfono de contacto',
        });
      }
    }

    // 3. Contact Form / Careers URL detection in HTML
    if (/form\b[^>]*action|form\b[^>]*method|<form/i.test(html)) {
      contactMethods.push({
        type: 'form',
        value: sourceUrl,
        label: 'Formulario de contacto web',
      });
    }

    return { contacts, contactMethods };
  }

  classifyEmail(email: string): { type: ContactType; suggestedRole: string; confidence: ConfidenceLevel } {
    const local = email.split('@')[0].toLowerCase();

    if (/^(sales|ventas|comercial|negocios|deals|cotizaciones)/.test(local)) {
      return { type: ContactType.SALES, suggestedRole: 'Equipo de Ventas / Comercial', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(bizdev|partnerships|alianzas|growth)/.test(local)) {
      return { type: ContactType.BUSINESS_DEVELOPMENT, suggestedRole: 'Desarrollo de Negocios / Alianzas', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(careers|jobs|talento|recruiting|rrhh|talent|people|hiring)/.test(local)) {
      return { type: ContactType.RECRUITMENT, suggestedRole: 'Selección de Talento / Reclutamiento', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(hr|recursoshumanos)/.test(local)) {
      return { type: ContactType.HR, suggestedRole: 'Recursos Humanos', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(ceo|founder|fundador|director|presidente)/.test(local)) {
      return { type: ContactType.FOUNDER, suggestedRole: 'Dirección General / Founder', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(cto|tech|engineering|dev|soporte.tecnico)/.test(local)) {
      return { type: ContactType.CTO, suggestedRole: 'Tecnología / Ingeniería', confidence: ConfidenceLevel.HIGH };
    }
    if (/^(marketing|press|prensa|comunicacion)/.test(local)) {
      return { type: ContactType.MARKETING, suggestedRole: 'Marketing y Comunicación', confidence: ConfidenceLevel.MEDIUM };
    }
    if (/^(support|soporte|help|ayuda|atencion)/.test(local)) {
      return { type: ContactType.SUPPORT, suggestedRole: 'Soporte al Cliente', confidence: ConfidenceLevel.MEDIUM };
    }
    if (/^(info|contacto|contact|hola|hello|general|office|admin|mesa|mesadeentrada|recepcion|secretaria|consultas|institucional|despacho|tramites)/.test(local)) {
      return { type: ContactType.GENERAL, suggestedRole: 'Mesa de Entrada / Contacto General', confidence: ConfidenceLevel.MEDIUM };
    }

    // If it looks like a person's name (e.g. john.doe, maria)
    if (local.includes('.') || local.includes('_') || local.length > 3) {
      return { type: ContactType.GENERAL, suggestedRole: 'Contacto Directo', confidence: ConfidenceLevel.MEDIUM };
    }

    return { type: ContactType.GENERAL, suggestedRole: 'Contacto Corporativo', confidence: ConfidenceLevel.LOW };
  }

  private formatNameFromEmail(email: string): string {
    const local = email.split('@')[0].toLowerCase();
    if (local === 'mesadeentrada' || local === 'mesa_de_entrada' || local === 'mesa.de.entrada') {
      return 'Mesa de Entrada';
    }
    if (local === 'rrhh' || local === 'recursoshumanos') {
      return 'Recursos Humanos';
    }
    if (local === 'ventas' || local === 'sales') {
      return 'Equipo Comercial / Ventas';
    }
    if (local.includes('.') || local.includes('_') || local.includes('-')) {
      return local
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
}
