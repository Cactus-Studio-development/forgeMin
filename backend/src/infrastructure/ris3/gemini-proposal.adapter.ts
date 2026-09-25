import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import {
  GenerateProposalInput,
  ILeadProposalService,
} from '../../domain/ris3/repositories/territory-repository.interface';
import { CommercialProposal } from '../../domain/ris3/entities/territory.entity';

@Injectable()
export class GeminiProposalAdapter implements ILeadProposalService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateProposal(input: GenerateProposalInput): Promise<CommercialProposal> {
    const prompt = `Eres un Director de Desarrollo de Negocios y Consultor Estratégico Senior en RIS3 (Estrategia de Innovación Inteligente y Transformación Digital).
Tu objetivo es redactar una propuesta comercial y técnica de alto impacto, hiperpersonalizada y orientada a resultados para un negocio o empresa.

INFORMACIÓN DEL CLIENTE PROSPECTO:
- Nombre: ${input.leadName}
- Categoría/Rubro: ${input.leadCategory}
- Ubicación: ${input.leadLocation || 'No especificada'}
- Contacto: Teléfono: ${input.leadContact?.phone || 'A coordinar'}, Email: ${input.leadContact?.email || 'A coordinar'}, Web: ${input.leadContact?.website || 'N/A'}
- Objetivo Comercial Solicitado: ${input.objective}
- Notas adicionales / Enfoque del usuario: ${input.customNotes || 'Ninguna especificada'}
- Organización Emisora: ${input.senderOrganization || 'RIS3 Intelligence & Consulting Platform'}

INSTRUCCIONES DE FORMATO:
1. Responde ÚNICAMENTE con un objeto JSON válido con los campos exactos descritos abajo.
2. No agregues bloques de código innecesarios ni texto fuera del JSON.
3. El tono debe ser profesional, ejecutivo, persuasivo y convincente.
4. En "fullMarkdownProposal", genera una propuesta formal completa en formato Markdown lista para enviar al cliente o imprimir en PDF (incluyendo encabezado, propuesta de valor, metodología, fases, inversión estimada y llamado a la acción).

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Título atractivo y profesional de la propuesta",
  "executiveSummary": "Resumen ejecutivo de 2-3 párrafos explicando el diagnóstico y la oportunidad de transformación para el cliente",
  "painPointsIdentified": [
    "Punto de dolor o cuello de botella 1 que enfrenta el sector del cliente",
    "Punto de dolor o cuello de botella 2",
    "Punto de dolor o cuello de botella 3"
  ],
  "proposedSolutions": [
    {
      "name": "Módulo o Solución 1",
      "description": "Descripción clara de la solución propuesta y alcance",
      "impact": "Beneficio tangible o ROI esperado para el cliente"
    },
    {
      "name": "Módulo o Solución 2",
      "description": "Descripción clara",
      "impact": "Beneficio tangible"
    }
  ],
  "deliverables": [
    "Entregable 1",
    "Entregable 2",
    "Entregable 3"
  ],
  "estimatedTimeline": "Tiempo estimado de ejecución (ej. 4 a 6 semanas)",
  "estimatedBudgetRange": "Rango sugerido de inversión (ej. $1.500 - $3.500 USD según alcance)",
  "callToAction": "Mensaje directo para agendar una reunión ejecutiva de 20 minutos y validar requerimientos",
  "fullMarkdownProposal": "Documento completo de la propuesta en Markdown profesional..."
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = this.parseJson(responseText);

      return {
        id: 'prop-' + uuidv4().slice(0, 8),
        leadId: input.leadId,
        leadName: input.leadName,
        leadCategory: input.leadCategory,
        leadLocation: input.leadLocation,
        leadContact: {
          phone: input.leadContact?.phone,
          email: input.leadContact?.email,
          website: input.leadContact?.website,
          verified: !!input.leadContact?.phone || !!input.leadContact?.email,
        },
        objective: input.objective,
        customNotes: input.customNotes,
        title: parsed.title || `Propuesta Estratégica para ${input.leadName}`,
        executiveSummary: parsed.executiveSummary || 'Propuesta de modernización y optimización operativa.',
        painPointsIdentified: Array.isArray(parsed.painPointsIdentified) ? parsed.painPointsIdentified : [],
        proposedSolutions: Array.isArray(parsed.proposedSolutions) ? parsed.proposedSolutions : [],
        deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
        estimatedTimeline: parsed.estimatedTimeline || '4 a 8 semanas',
        estimatedBudgetRange: parsed.estimatedBudgetRange || 'Consultar cotización a medida',
        callToAction: parsed.callToAction || 'Agendar sesión de descubrimiento técnico.',
        fullMarkdownProposal: parsed.fullMarkdownProposal || parsed.executiveSummary || '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Fallback proposal in case of network/key unavailability
      return this.buildFallbackProposal(input);
    }
  }

  private parseJson(text: string): any {
    let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    if (start === -1) throw new Error('No JSON found');

    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) throw new Error('Malformed JSON');
    return JSON.parse(cleaned.slice(start, end + 1));
  }

  private buildFallbackProposal(input: GenerateProposalInput): CommercialProposal {
    const id = 'prop-' + uuidv4().slice(0, 8);
    const title = `Propuesta de Transformación y Crecimiento para ${input.leadName}`;
    const summary = `Presentamos esta propuesta personalizada orientada a optimizar la presencia, operativa y captación comercial de ${input.leadName} en su zona de influencia.`;

    return {
      id,
      leadId: input.leadId,
      leadName: input.leadName,
      leadCategory: input.leadCategory,
      leadLocation: input.leadLocation,
      leadContact: {
        phone: input.leadContact?.phone,
        email: input.leadContact?.email,
        website: input.leadContact?.website,
        verified: !!input.leadContact?.phone,
      },
      objective: input.objective,
      customNotes: input.customNotes,
      title,
      executiveSummary: summary,
      painPointsIdentified: [
        'Necesidad de optimización en la captación digital de clientes en la zona geográfica.',
        'Automatización de procesos de atención y gestión de pedidos/consultas.',
        'Consolidación de métricas de rendimiento comercial.',
      ],
      proposedSolutions: [
        {
          name: 'Modernización y Digitalización de Canales',
          description: 'Implementación de catálogo digital interactivo, pasarela y canal directo WhatsApp Business API.',
          impact: 'Incremento del 35% en conversión de consultas a ventas locales.',
        },
        {
          name: 'Automatización y Gestión de Stock / Turnos',
          description: 'Sistema centralizado en la nube para disponibilidad y respuesta en tiempo real.',
          impact: 'Ahorro de más de 15 horas operativas semanales.',
        },
      ],
      deliverables: [
        'Diagnóstico territorial y benchmarking de competencia local.',
        'Implementación de la infraestructura digital personalizada.',
        'Capacitación al equipo y soporte técnico durante 60 días.',
      ],
      estimatedTimeline: '3 a 5 semanas',
      estimatedBudgetRange: '$1.200 - $2.800 USD',
      callToAction: 'Coordinar una llamada de 15 minutos para ajustar las prioridades del cronograma.',
      fullMarkdownProposal: `# ${title}
## Resumen Ejecutivo
${summary}

## Diagnóstico y Oportunidades Clave
Identificamos un potencial de crecimiento significativo en el sector de ${input.leadCategory} para ${input.leadName}.

## Soluciones Propuestas
1. **Modernización y Digitalización**: Despliegue de herramientas cloud y canales de atención inmediata.
2. **Automatización Operativa**: Flujos continuos de gestión e inteligencia comercial.

## Próximos Pasos
Agendar reunión de presentación técnica y definición de entregables.`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
