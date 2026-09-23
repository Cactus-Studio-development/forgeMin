import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIGeneratedJobPayload {
  title: string;
  description: string;
  company: string;
  categoryId: string;
  categoryName: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  modality: 'Presencial' | 'Híbrido' | 'Remoto';
  employmentType: string;
  workingDay: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  salary: string;
  contactInfo: string;
}

@Injectable()
export class AEAIService {
  private readonly logger = new Logger(AEAIService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private readonly openaiApiKey: string | undefined;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (this.openaiApiKey) {
      this.logger.log('AEAIService: OpenAI API key configured');
    }
    if (geminiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        this.logger.log('AEAIService: Google Gemini configured');
      } catch (err) {
        this.logger.warn('Failed to init Gemini in AEAIService:', err);
      }
    }
  }

  private extractCount(prompt: string, countParam?: number): number {
    if (countParam && countParam > 0) return Math.min(Math.max(1, countParam), 20);
    const match =
      prompt.match(/(?:haceme|crear|genera|generame|hacer|dame|publicar)\s+(\d+)\b/i) ||
      prompt.match(/\b(\d+)\s+(?:vacantes|ofertas|publicaciones|puestos|empleos|trabajos)\b/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 1 && parsed <= 20) return parsed;
    }
    return 1;
  }

  async generateJobs(prompt: string, countParam?: number): Promise<AIGeneratedJobPayload[]> {
    const count = this.extractCount(prompt, countParam);

    const systemPrompt = `Sos un redactor experto de ofertas de empleo profesionales en Argentina para la plataforma 'Argentina Empleos'.
Generá una lista de exactamente ${count} publicaciones de empleo realistas, variadas, atractivas y estructuradas basadas en la siguiente instrucción: "${prompt}".

Reglas importantes:
- Si la instrucción pide limpieza, hogar, niñera, maestranza, oficios, gastronomía, ventas, etc., adaptá los puestos con títulos realistas (ej: Niñera con retiro, Cuidado de adulto mayor, Limpieza por horas, Auxiliar de cocina, Vendedor de salón).
- La ubicación por defecto si se menciona Posadas/Misiones o no se especifica otra debe ser en Posadas, Misiones (o la provincia indicada en el texto).
- Los correos de contacto deben ser creíbles (ej: familia.posadas@gmail.com, rrhh.limpieza@gmail.com, contacto.hogar@yahoo.com).
- Las modalidades deben ser 'Presencial', 'Híbrido' o 'Remoto' según corresponda al oficio.

Respondé EXCLUSIVAMENTE con un JSON válido con la siguiente estructura (sin formato adicional ni comillas invertidas extra):
{
  "jobs": [
    {
      "title": "Título del puesto (ej: Niñera / Cuidado de niños)",
      "description": "Descripción concisa y clara del puesto y responsabilidades",
      "company": "Familia particular | Empresa / Comercio",
      "categoryId": "oficios | tecnologia | diseno | marketing | administracion | recursos_humanos | ingenieria | salud | educacion | logistica | atencion_cliente | legales",
      "categoryName": "Nombre legible de la categoría (ej: Oficios y Servicios)",
      "provinceId": "misiones | caba | buenos_aires | cordoba | santa_fe | mendoza | corrientes",
      "provinceName": "Nombre de la provincia (ej: Misiones, Córdoba, etc.)",
      "cityId": "posadas | rosario | cordoba_capital | caba_palermo",
      "cityName": "Nombre de la ciudad (ej: Posadas, Rosario, etc.)",
      "modality": "Presencial | Híbrido | Remoto",
      "employmentType": "Relación de dependencia | Por horas | Contrato freelance | Media jornada",
      "workingDay": "Lunes a viernes, 4 horas | Jornada completa (9 a 18 hs) | 3 veces por semana",
      "requirements": ["Requisito 1", "Requisito 2"],
      "skills": ["Responsabilidad", "Puntualidad"],
      "experienceLevel": "Sin experiencia requerida | Con experiencia previa | Semi Senior (2-4 años)",
      "educationLevel": "Secundario completo | Primario | No requerido | Terciario / Universitario",
      "salary": "$ 280.000 - $ 420.000 ARS",
      "contactInfo": "contacto.posadas@gmail.com"
    }
  ]
}`;

    // 1. Try OpenAI if key is present
    if (this.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Sos el asistente de generación de ofertas de Argentina Empleos. Respondé siempre en formato JSON puro con la clave "jobs".',
              },
              { role: 'user', content: systemPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const jobsList = parsed.jobs || (Array.isArray(parsed) ? parsed : [parsed]);
            if (Array.isArray(jobsList) && jobsList.length > 0) {
              this.logger.log(`Generated ${jobsList.length} jobs via OpenAI (gpt-4o-mini)`);
              return jobsList as AIGeneratedJobPayload[];
            }
          }
        } else {
          const errBody = await response.text();
          this.logger.warn(`OpenAI error: ${response.status} - ${errBody}`);
        }
      } catch (err: any) {
        this.logger.warn('OpenAI failed, trying Gemini:', err.message);
      }
    }

    // 2. Try Gemini
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const jobsList = parsed.jobs || (Array.isArray(parsed) ? parsed : [parsed]);
          if (Array.isArray(jobsList) && jobsList.length > 0) {
            this.logger.log(`Generated ${jobsList.length} jobs via Google Gemini`);
            return jobsList as AIGeneratedJobPayload[];
          }
        }
      } catch (e: any) {
        this.logger.warn('Gemini failed, fallback to multi-category template generator:', e.message);
      }
    }

    // 3. Fallback generator
    return this.fallbackMultipleJobs(prompt, count);
  }

  async generateJob(prompt: string): Promise<AIGeneratedJobPayload> {
    const list = await this.generateJobs(prompt, 1);
    return list[0] || this.fallbackJobGenerator(prompt);
  }

  private fallbackMultipleJobs(prompt: string, count: number): AIGeneratedJobPayload[] {
    const isMisiones = /misiones|posadas|obera|iguazu|eldorado/i.test(prompt) || !/cordoba|rosario|santa_fe|buenos_aires|caba|mendoza/i.test(prompt);
    const provId = isMisiones ? 'misiones' : 'buenos_aires';
    const provName = isMisiones ? 'Misiones' : 'Buenos Aires';
    const cityId = isMisiones ? 'posadas' : 'la_plata';
    const cityName = isMisiones ? 'Posadas' : 'La Plata';

    const isCleaningOrHome = /limpie|hogar|domest|niñer|niño|cuidado|adulto|abuelo|maestranz|cocina|casero/i.test(prompt);
    const isDev = /frontend|backend|developer|programador|software|react|node|tech|sistemas/i.test(prompt);
    const isSales = /ventas|comercial|vendedor|atencion|cajero|local|comercio/i.test(prompt);

    const cleaningTemplates = [
      {
        title: 'Limpieza y mantenimiento doméstico',
        description: 'Se busca persona responsable y puntual para tareas generales de limpieza y orden en casa particular.',
        company: 'Familia Particular',
        categoryId: 'oficios',
        categoryName: 'Oficios, Hogar y Servicios',
        modality: 'Presencial' as const,
        employmentType: 'Media jornada / Por horas',
        workingDay: '4 horas, 3 veces por semana',
        salary: '$ 280.000 ARS',
        contactInfo: 'limpieza.posadas@gmail.com',
        requirements: ['Referencias comprobables en tareas de hogar', 'Buena predisposición y puntualidad'],
        skills: ['Limpieza profunda', 'Organización', 'Confianza'],
      },
      {
        title: 'Niñera / Cuidado de niños',
        description: 'Familia busca persona responsable y cariñosa para cuidado y acompañamiento de niños en edad escolar.',
        company: 'Familia Particular',
        categoryId: 'oficios',
        categoryName: 'Oficios, Hogar y Servicios',
        modality: 'Presencial' as const,
        employmentType: 'Media jornada',
        workingDay: 'Lunes a viernes, 4 horas por la tarde',
        salary: '$ 320.000 ARS',
        contactInfo: 'familia.posadas@gmail.com',
        requirements: ['Experiencia previa en cuidado infantil', 'Paciencia y responsabilidad'],
        skills: ['Cuidado infantil', 'Primeros auxilios básicos', 'Juegos didácticos'],
      },
      {
        title: 'Cuidado y acompañamiento de adulto mayor',
        description: 'Se busca persona para acompañamiento, asistencia en actividades básicas y medicación de adulto mayor.',
        company: 'Familia Particular',
        categoryId: 'salud',
        categoryName: 'Salud y Asistencia',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Turno mañana (Lunes a Sábado, 4 hs)',
        salary: '$ 350.000 ARS',
        contactInfo: 'cuidado.mayores@gmail.com',
        requirements: ['Experiencia en atención geriátrica o acompañamiento', 'Trato cálido y responsable'],
        skills: ['Acompañamiento', 'Control de signos vitales', 'Empatía'],
      },
      {
        title: 'Personal de limpieza para oficinas y locales',
        description: 'Se busca auxiliar de maestranza para limpieza general y mantenimiento de oficinas comerciales.',
        company: 'Servicios Integrales del Norte',
        categoryId: 'oficios',
        categoryName: 'Oficios, Hogar y Servicios',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Lunes a viernes de 7 a 13 hs',
        salary: '$ 390.000 ARS',
        contactInfo: 'rrhh.limpieza@gmail.com',
        requirements: ['Secundario completo', 'Experiencia en limpieza de oficinas'],
        skills: ['Manejo de productos de limpieza', 'Puntualidad', 'Trabajo en equipo'],
      },
      {
        title: 'Empleada doméstica con retiro',
        description: 'Importante hogar solicita personal para limpieza integral, lavado, planchado y apoyo en cocina.',
        company: 'Particular',
        categoryId: 'oficios',
        categoryName: 'Oficios, Hogar y Servicios',
        modality: 'Presencial' as const,
        employmentType: 'Jornada completa con retiro',
        workingDay: 'Lunes a viernes de 8 a 16 hs',
        salary: '$ 450.000 ARS',
        contactInfo: 'hogar.particular@yahoo.com',
        requirements: ['Referencias comprobables', 'Saber cocinar comida casera'],
        skills: ['Cocina', 'Planchado', 'Organización del hogar'],
      },
      {
        title: 'Casero y mantenimiento de predio',
        description: 'Se busca persona o matrimonio para tareas de mantenimiento de jardín, parque y cuidado general de predio.',
        company: 'Quinta Residencial',
        categoryId: 'oficios',
        categoryName: 'Oficios, Hogar y Servicios',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Lunes a sábados',
        salary: '$ 480.000 ARS',
        contactInfo: 'predio.mantenimiento@gmail.com',
        requirements: ['Manejo de cortadora de césped y motoguadaña', 'Conocimientos de mantenimiento básico'],
        skills: ['Jardinería', 'Pintura', 'Mantenimiento'],
      },
    ];

    const techTemplates = [
      {
        title: 'Desarrollador Frontend React / Next.js',
        description: 'Buscamos desarrollador frontend para integrarse a proyectos web dinámicos y plataformas cloud.',
        company: 'Innovación Digital S.A.',
        categoryId: 'tecnologia',
        categoryName: 'Tecnología y Software',
        modality: 'Híbrido' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Jornada completa (9 a 18 hs)',
        salary: '$ 1.100.000 - $ 1.500.000 ARS',
        contactInfo: 'talento.tech@gmail.com',
        requirements: ['2+ años con React y TypeScript', 'Git y consumo de REST APIs'],
        skills: ['React', 'TypeScript', 'TailwindCSS'],
      },
      {
        title: 'Desarrollador Backend Node.js / NestJS',
        description: 'Ingeniero backend para desarrollo de microservicios, bases de datos y arquitecturas escalables.',
        company: 'AgroTech Argentina',
        categoryId: 'tecnologia',
        categoryName: 'Tecnología y Software',
        modality: 'Remoto' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Jornada completa (9 a 18 hs)',
        salary: '$ 1.300.000 - $ 1.800.000 ARS',
        contactInfo: 'rrhh@agrotech.com.ar',
        requirements: ['Node.js, Express o NestJS', 'PostgreSQL / MongoDB'],
        skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Docker'],
      },
      {
        title: 'Soporte Técnico Informático y Redes',
        description: 'Técnico para soporte a usuarios, mantenimiento de hardware, instalación de SO y redes locales.',
        company: 'Sistemas del Litoral',
        categoryId: 'tecnologia',
        categoryName: 'Tecnología y Software',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Lunes a viernes de 8 a 17 hs',
        salary: '$ 650.000 - $ 850.000 ARS',
        contactInfo: 'soporte.litoral@gmail.com',
        requirements: ['Armado y reparación de PC', 'Conocimientos de TCP/IP'],
        skills: ['Hardware', 'Windows/Linux', 'Redes'],
      },
    ];

    const salesTemplates = [
      {
        title: 'Vendedor de Salón y Atención al Cliente',
        description: 'Buscamos vendedor proactivo para atención al público en local céntrico y manejo de stock.',
        company: 'Comercio Céntrico',
        categoryId: 'atencion_cliente',
        categoryName: 'Atención al Cliente y Ventas',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Horario comercial cortado',
        salary: '$ 550.000 ARS + comisiones',
        contactInfo: 'ventas.comercio@gmail.com',
        requirements: ['Secundario completo', 'Buena presencia y trato cordial'],
        skills: ['Ventas', 'Manejo de caja', 'Facturación'],
      },
      {
        title: 'Cajero / Repositor para Supermercado',
        description: 'Atención en línea de cajas, cobro con distintos medios de pago y reposición de góndolas.',
        company: 'Supermercado Regional',
        categoryId: 'atencion_cliente',
        categoryName: 'Atención al Cliente y Ventas',
        modality: 'Presencial' as const,
        employmentType: 'Relación de dependencia',
        workingDay: 'Turnos rotativos (Mañana / Tarde)',
        salary: '$ 580.000 ARS',
        contactInfo: 'empleos.supermercado@gmail.com',
        requirements: ['Experiencia previa en manejo de caja y posnet', 'Puntualidad'],
        skills: ['Cobro', 'Arqueo de caja', 'Reposición'],
      },
    ];

    let baseTemplates = isCleaningOrHome
      ? cleaningTemplates
      : isDev
      ? techTemplates
      : isSales
      ? salesTemplates
      : [...cleaningTemplates, ...salesTemplates, ...techTemplates];

    const results: AIGeneratedJobPayload[] = [];
    for (let i = 0; i < count; i++) {
      const template = baseTemplates[i % baseTemplates.length];
      const suffix = i >= baseTemplates.length ? ` (Puesto ${i + 1})` : '';

      results.push({
        title: `${template.title}${suffix}`,
        description: template.description,
        company: template.company,
        categoryId: template.categoryId,
        categoryName: template.categoryName,
        provinceId: provId,
        provinceName: provName,
        cityId: cityId,
        cityName: cityName,
        modality: template.modality,
        employmentType: template.employmentType,
        workingDay: template.workingDay,
        requirements: template.requirements,
        skills: template.skills,
        experienceLevel: isCleaningOrHome ? 'Con o sin experiencia' : 'Semi Senior (2-4 años)',
        educationLevel: isCleaningOrHome ? 'Primario / Secundario' : 'Secundario / Terciario',
        salary: template.salary,
        contactInfo: template.contactInfo,
      });
    }

    return results;
  }

  private fallbackJobGenerator(prompt: string): AIGeneratedJobPayload {
    const list = this.fallbackMultipleJobs(prompt, 1);
    return list[0];
  }
}
