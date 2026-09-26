import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IBusinessProfile,
  IBusinessOpportunity,
} from '../../domain/business/business.entity';

@Injectable()
export class BusinessAIService {
  private readonly logger = new Logger(BusinessAIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  private buildBusinessContext(profile: IBusinessProfile, opportunities?: IBusinessOpportunity[]): string {
    const productsStr = profile.productsOrServices && profile.productsOrServices.length > 0
      ? profile.productsOrServices
          .map((p) => `- ${p.name}${p.category ? ` (${p.category})` : ''}: ${p.description || 'Sin descripción'}${p.price ? ` [Precio: ${p.price}]` : ''}`)
          .join('\n')
      : 'No se han registrado productos o servicios específicos todavía.';

    const socialsStr = profile.socialLinks
      ? Object.entries(profile.socialLinks)
          .filter(([_, val]) => !!val)
          .map(([k, val]) => `${k}: ${val}`)
          .join(', ')
      : 'No especificadas';

    let oppsStr = '';
    if (opportunities && opportunities.length > 0) {
      oppsStr = `\nOPORTUNIDADES DE MEJORA IDENTIFICADAS:\n` +
        opportunities
          .map((o, idx) => `${idx + 1}. [${o.status.toUpperCase()}] ${o.title}: ${o.description} | Acción sugerida: ${o.suggestedAction}`)
          .join('\n');
    }

    return `
INFORMACIÓN AUTORIZADA DEL NEGOCIO:
- Nombre: ${profile.name || 'Sin nombre definido'}
- Rubro / Industria: ${profile.industry || 'No especificado'}
- Ubicación: ${profile.location || 'No especificada'}
- Descripción del negocio: ${profile.description || 'No especificada'}
- Email de contacto: ${profile.contactEmail || 'No especificado'}
- Teléfono / WhatsApp: ${profile.contactPhone || 'No especificado'}
- Sitio Web: ${profile.website || 'No especificado'}
- Redes sociales: ${socialsStr}

PRODUCTOS Y SERVICIOS DISPONIBLES:
${productsStr}
${oppsStr}
    `.trim();
  }

  async runDiagnostic(
    profile: IBusinessProfile,
  ): Promise<Array<{ title: string; description: string; reason: string; suggestedAction: string; impact: 'high' | 'medium' | 'low'; category: string }>> {
    const context = this.buildBusinessContext(profile);

    const prompt = `
Eres el motor de diagnóstico de inteligencia de negocio de RIS3.
Analiza exhaustivamente la información disponible del siguiente negocio para detectar oportunidades de mejora reales y accionables.

${context}

REGLAS DE DIAGNÓSTICO:
1. NO inventes datos que contradigan la información proporcionada.
2. Identifica entre 3 y 6 oportunidades de mejora concretas en áreas como:
   - Ventas y conversión comercial.
   - Posicionamiento y presencia digital / canales de contacto.
   - Oferta de productos/servicios y estrategia de precios.
   - Estrategia de contenidos y captación de clientes.
   - Operaciones o seguimiento de clientes.
3. Para cada oportunidad provee:
   - title: Título corto y claro de la oportunidad.
   - description: Descripción concisa del aspecto detectado.
   - reason: Motivo por el cual esto representa una oportunidad o punto de mejora.
   - suggestedAction: Acción sugerida inmediata y ejecutable por el dueño del negocio.
   - impact: "high" | "medium" | "low".
   - category: Categoría (ej: "ventas", "marketing", "presencia_digital", "fidelizacion", "operaciones").

Devuelve ÚNICAMENTE un JSON válido (sin Markdown delimitador ni texto extra) con el siguiente formato:
[
  {
    "title": "Optimización del catálogo digital",
    "description": "...",
    "reason": "...",
    "suggestedAction": "...",
    "impact": "high",
    "category": "marketing"
  }
]
    `.trim();

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text().trim();
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (err) {
      this.logger.error(`Error generating business diagnosis: ${err}`);
      // Return structured fallback diagnostic based on profile data
      return [
        {
          title: 'Activación de canales de captación digital',
          description: `El negocio ${profile.name || ''} cuenta con oferta en el rubro ${profile.industry || 'comercial'} pero requiere fortalecer la conversión activa.`,
          reason: 'Mejorar los puntos de contacto directos incrementa la tasa de cierre comercial con nuevos clientes.',
          suggestedAction: 'Configurar una secuencia de mensajes comerciales y ofertas directas para los productos destacados.',
          impact: 'high',
          category: 'ventas',
        },
        {
          title: 'Estrategia de contenidos segmentada',
          description: 'Promocionar periódicamente los productos o servicios principales en canales digitales.',
          reason: 'Genera visibilidad constante ante el público objetivo del rubro.',
          suggestedAction: 'Utilizar el Asistente RIS3 para programar 3 publicaciones semanales enfocadas en beneficios clave.',
          impact: 'medium',
          category: 'marketing',
        },
      ];
    }
  }

  async assistantChat(
    profile: IBusinessProfile,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    opportunities: IBusinessOpportunity[] = [],
  ): Promise<{ reply: string; suggestedFollowUps: string[] }> {
    const businessContext = this.buildBusinessContext(profile, opportunities);

    const systemPrompt = `
Eres el "Asistente RIS3", un asesor de inteligencia de negocio integrado en la plataforma RIS3.
Tu misión es guiar, asesorar y potenciar el negocio del usuario basándote EXCLUSIVAMENTE en el contexto autorizado de su negocio.

${businessContext}

PRINCIPIOS CLAVE:
- NO actúes como un ChatGPT genérico descontextualizado.
- Habla en español rioplatense/latino profesional, claro, empático y orientado a resultados de negocio.
- Cuando te pregunten sobre ventas, mejoras, promociones, o productos, haz referencia exacta a los productos, servicios y datos de este negocio.
- Si el usuario pide generar una publicación, promoción o mensaje comercial, redactalo de inmediato listo para usar, adaptado al tono y rubro del negocio.
- Si detectas una oportunidad clave, proponé una acción concreta y preguntá si el usuario desea ejecutarla o registrarla en RIS3.
- No uses divisores markdown ruidosos (no uses '###' ni '***' ni '---'). Usa formato limpio, negritas bien ubicadas y listas legibles.
    `.trim();

    const formattedHistory = history.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    const conversationPrompt = `
${systemPrompt}

HISTORIAL DE CONVERSACIÓN:
${history.map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente RIS3'}: ${h.content}`).join('\n')}

Usuario: ${message}
Asistente RIS3:
    `.trim();

    try {
      const result = await this.model.generateContent(conversationPrompt);
      const reply = result.response.text().trim();

      // Generate suggested follow up chips
      const followUpsPrompt = `
Basado en esta última respuesta del Asistente RIS3 para el negocio ${profile.name}:
"${reply.slice(0, 300)}..."

Genera exactamente 3 preguntas o acciones cortas de seguimiento que el usuario podría querer hacer a continuación (máximo 6 palabras por sugerencia).
Responde ÚNICAMENTE con un JSON array de strings: ["Sugerencia 1", "Sugerencia 2", "Sugerencia 3"]
      `.trim();

      let suggestedFollowUps: string[] = [
        '¿Cómo aumento mis ventas?',
        'Generar publicación para Instagram',
        'Analizar oportunidades pendientes',
      ];

      try {
        const fRes = await this.model.generateContent(followUpsPrompt);
        const fText = fRes.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(fText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestedFollowUps = parsed.slice(0, 4);
        }
      } catch {}

      return { reply, suggestedFollowUps };
    } catch (err) {
      this.logger.error(`Error in assistant chat: ${err}`);
      return {
        reply: `Hola, estoy analizando la información de ${profile.name || 'tu negocio'}. En este momento puedo ayudarte a optimizar tus productos, generar contenido comercial o revisar las oportunidades de mejora de tu negocio. ¿En qué aspecto te gustaría enfocarte hoy?`,
        suggestedFollowUps: [
          '¿Cómo mejorar mis ventas?',
          'Crear una promoción',
          'Analizar mi negocio',
        ],
      };
    }
  }

  async generateCommercialContent(
    profile: IBusinessProfile,
    options: {
      type: 'post' | 'promotion' | 'description' | 'commercial_message' | 'ideas';
      topic?: string;
      targetAudience?: string;
      channel?: string;
      tone?: string;
      language?: string;
    },
  ): Promise<{
    title: string;
    content: string;
    callToAction?: string;
    hashtags?: string[];
    marketingTips?: string[];
  }> {
    const businessContext = this.buildBusinessContext(profile);

    const typeDescriptions: Record<string, string> = {
      post: 'Publicación atractiva para redes sociales (Instagram, Facebook o LinkedIn)',
      promotion: 'Oferta o promoción comercial atractiva con sentido de urgencia y valor claro',
      description: 'Descripción persuasiva de producto, servicio o presentación del negocio',
      commercial_message: 'Mensaje comercial directo para WhatsApp, email o prospección a clientes',
      ideas: 'Ideas estratégicas para atraer nuevos clientes y aumentar la visibilidad',
    };

    const typeDesc = typeDescriptions[options.type] || 'Contenido comercial de alto impacto';

    const prompt = `
Eres un especialista en copywriting y marketing comercial para la plataforma RIS3.
Tu tarea es generar contenido comercial altamente efectivo basado ESTRICTAMENTE en la información disponible del negocio.

${businessContext}

SOLICITUD:
- Tipo de contenido: ${typeDesc} (${options.type})
- Tema o enfoque específico: ${options.topic || 'General sobre los productos o servicios principales'}
- Público objetivo: ${options.targetAudience || 'Clientes potenciales interesados en el rubro'}
- Canal de difusión: ${options.channel || 'Redes sociales / WhatsApp'}
- Tono: ${options.tone || 'Profesional, persuasivo y cercano'}
- Idioma: ${options.language || 'Español'}

REGLAS:
1. No inventes precios o características que no figuren en los datos del negocio a menos que sean genéricas.
2. Asegura un Llamado a la Acción (CTA) directo y efectivo.
3. Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin Markdown wrappers):
{
  "title": "Título sugerido para la pieza o campaña",
  "content": "Cuerpo completo del texto listo para copiar y pegar con emojis si corresponde...",
  "callToAction": "Llamado a la acción específico...",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "marketingTips": ["Consejo 1 para publicar", "Consejo 2 para mejor rendimiento"]
}
    `.trim();

    try {
      const response = await this.model.generateContent(prompt);
      const text = response.response.text().trim();
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      this.logger.error(`Error in generateCommercialContent: ${err}`);
      return {
        title: `Promoción Especial - ${profile.name || 'Tu Negocio'}`,
        content: `¡Descubrí todo lo que tenemos para ofrecerte en ${profile.name || 'nuestro negocio'}! Conoce nuestra propuesta pensada para brindarte la mejor calidad y atención en ${profile.location || 'tu zona'}.\n\nConsultanos hoy mismo y accedé a beneficios exclusivos.`,
        callToAction: `Escribinos por WhatsApp al ${profile.contactPhone || 'nuestro contacto'} para más información.`,
        hashtags: ['#Emprendimiento', `#${(profile.industry || 'Negocio').replace(/\s+/g, '')}`, '#Oportunidad'],
        marketingTips: ['Publicar en horarios pico (12:00 a 14:00 y 19:00 a 21:00)', 'Acompañar con foto real de alta calidad'],
      };
    }
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<{
    translatedText: string;
    detectedLanguage: string;
    phoneticOrNotes?: string;
  }> {
    const prompt = `
Eres el módulo de traducción e interpretación lingüística de RIS3 para comunicaciones comerciales internacionales.

Texto a traducir:
"""${text}"""

Idioma de destino: ${targetLanguage}
Idioma de origen (si se especificó): ${sourceLanguage || 'Detectar automáticamente'}

INSTRUCCIONES:
1. Detecta con precisión el idioma de origen del texto (ej: "Español", "Inglés", "Portugués", "Francés", "Alemán", "Italiano", "Chino", etc.).
2. Traduce el texto manteniendo la naturalidad comercial, el tono y la precisión contextual.
3. Provee una nota o pronunciación fonética breve si es relevante para lectura en voz alta.

Devuelve ÚNICAMENTE un JSON válido (sin Markdown tags adicionales):
{
  "detectedLanguage": "Nombre del idioma de origen detectado",
  "translatedText": "Texto traducido de manera fluida y profesional",
  "phoneticOrNotes": "Guía breve opcional"
}
    `.trim();

    try {
      const response = await this.model.generateContent(prompt);
      const resText = response.response.text().trim();
      const cleanJson = resText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      this.logger.error(`Error translating text: ${err}`);
      return {
        detectedLanguage: sourceLanguage || 'Español',
        translatedText: text,
        phoneticOrNotes: 'Traducción directa procesada.',
      };
    }
  }
}
