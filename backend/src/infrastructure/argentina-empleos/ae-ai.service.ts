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

  async generateJob(prompt: string): Promise<AIGeneratedJobPayload> {
    const systemPrompt = `Sos un redactor experto de ofertas de empleo profesionales en Argentina para la plataforma corporativa 'Argentina Empleos'.
Generá una publicación de empleo realista, profesional, atractiva y estructurada basada en la siguiente instrucción: "${prompt}".

Respondé EXCLUSIVAMENTE con un JSON válido con la siguiente estructura (sin markdown adicional, solo el json):
{
  "title": "Título del puesto",
  "description": "Descripción detallada del puesto, responsabilidades y contexto",
  "company": "Nombre de la empresa u organización empleadora",
  "categoryId": "tecnologia | diseno | marketing | administracion | recursos_humanos | ingenieria | salud | educacion | logistica | atencion_cliente | legales | oficios",
  "categoryName": "Nombre legible de la categoría",
  "provinceId": "id en minúscula con guion bajo (ej: misiones, caba, buenos_aires, cordoba, santa_fe, mendoza, corrientes)",
  "provinceName": "Nombre de la provincia en Argentina (ej: Misiones, Córdoba, etc.)",
  "cityId": "id de la ciudad (ej: posadas, caba_palermo, rosario, cordoba_capital)",
  "cityName": "Nombre de la ciudad (ej: Posadas, Rosario, etc.)",
  "modality": "Presencial | Híbrido | Remoto",
  "employmentType": "Relación de dependencia | Contrato freelance | Pasantía | Por proyecto",
  "workingDay": "Jornada completa (9 a 18 hs) | Media jornada | Flexible",
  "requirements": ["Requisito 1", "Requisito 2", "Requisito 3"],
  "skills": ["Habilidad 1", "Habilidad 2", "Habilidad 3"],
  "experienceLevel": "Junior (1-2 años) | Semi Senior (2-4 años) | Senior (5+ años) | Sin experiencia requerida",
  "educationLevel": "Sin estudios formales / No requerido | Primario | Secundario | Terciario | Universitario | Cursos / Certificaciones",
  "salary": "Rango salarial estimado en ARS (ej: $ 850.000 - $ 1.200.000 ARS brutos)",
  "contactInfo": "empleos@empresa.com.ar o formulario institucional"
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
                  'Sos el asistente de generación de ofertas de Argentina Empleos. Respondé siempre en formato JSON puro estructurado.',
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
            this.logger.log('Job generated successfully via OpenAI (gpt-4o-mini)');
            return JSON.parse(content) as AIGeneratedJobPayload;
          }
        } else {
          const errBody = await response.text();
          this.logger.warn(`OpenAI generation error: ${response.status} - ${errBody}`);
        }
      } catch (err: any) {
        this.logger.warn('OpenAI call failed, falling back to Gemini:', err.message);
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
          this.logger.log('Job generated successfully via Google Gemini');
          return JSON.parse(jsonMatch[0]) as AIGeneratedJobPayload;
        }
      } catch (e: any) {
        this.logger.warn('Gemini generation failed, fallback to structured generator:', e.message);
      }
    }

    // 3. Fallback template when neither provider is reachable
    return this.fallbackJobGenerator(prompt);
  }

  private fallbackJobGenerator(prompt: string): AIGeneratedJobPayload {
    const isMisiones = /misiones|posadas|obera/i.test(prompt);
    const isDev = /frontend|backend|developer|programador|software|react|node/i.test(prompt);

    return {
      title: isDev ? 'Desarrollador Frontend React / TypeScript' : 'Especialista Profesional de Operaciones',
      description: `Buscamos un profesional proactivo y orientado a resultados para sumarse a nuestro equipo en constante crecimiento. La posición ofrece oportunidades de desarrollo y trabajo en proyectos de impacto nacional.`,
      company: 'Innovación & Tecnología Argentina S.A.',
      categoryId: isDev ? 'tecnologia' : 'administracion',
      categoryName: isDev ? 'Tecnología y Software' : 'Administración y Finanzas',
      provinceId: isMisiones ? 'misiones' : 'buenos_aires',
      provinceName: isMisiones ? 'Misiones' : 'Buenos Aires',
      cityId: isMisiones ? 'posadas' : 'la_plata',
      cityName: isMisiones ? 'Posadas' : 'La Plata',
      modality: 'Híbrido',
      employmentType: 'Relación de dependencia',
      workingDay: 'Jornada completa (9 a 18 hs)',
      requirements: [
        'Experiencia comprobable mínima de 2 años en puestos similares',
        'Capacidad de trabajo en equipo y comunicación efectiva',
        'Conocimiento de metodologías ágiles',
      ],
      skills: isDev ? ['React', 'TypeScript', 'TailwindCSS', 'Git', 'Next.js'] : ['Gestión', 'Excel Avanzado', 'Comunicación'],
      experienceLevel: 'Semi Senior (2-4 años)',
      educationLevel: 'Terciario / Universitario',
      salary: '$ 950.000 - $ 1.350.000 ARS',
      contactInfo: 'rrhh@talentoargentina.com.ar',
    };
  }
}
