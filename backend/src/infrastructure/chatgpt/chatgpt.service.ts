import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

@Injectable()
export class ChatGPTService {
  private get apiKey(): string {
    return process.env.CHATGPT_API || process.env.OPENAI_API_KEY || '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI ChatGPT API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { reply };
  }

  async analyzeDocumentContent(
    fileName: string,
    fileType: string,
    rawContentText?: string,
    fileBase64?: string,
  ): Promise<{
    summary: string;
    keyTakeaways: string[];
    metrics: Array<{ label: string; value: string }>;
    category: string;
  }> {
    const textSnippet = rawContentText ? rawContentText.slice(0, 6000) : 'Sin contenido de texto directo';

    const systemPrompt = `Eres un sistema experto en inteligencia documental y análisis corporativo impulsado por ChatGPT.
Analiza el documento titulado "${fileName}" de tipo "${fileType}".

INSTRUCCIONES CRÍTICAS:
1. Lee el contenido del documento y responde ESPECÍFICAMENTE de qué trata. Identifica el tema principal, objetivos, datos relevantes y contexto real.
2. NO uses descripciones genéricas como "documento procesado exitosamente". En su lugar, redacta un resumen descriptivo real sobre el tema central del archivo.
3. Responde ÚNICAMENTE en JSON válido con el siguiente formato exacto:

{
  "summary": "Resumen claro de 3 a 4 oraciones detallando explícitamente de qué trata el documento, su propósito y principales conclusiones.",
  "keyTakeaways": [
    "Punto clave 1 derivado del tema o contenido del documento",
    "Punto clave 2 sobre implicaciones, recomendaciones o datos",
    "Punto clave 3 de seguimiento estratégico"
  ],
  "metrics": [
    { "label": "Métrica Clave 1", "value": "Valor o estado" },
    { "label": "Métrica Clave 2", "value": "Valor o estado" },
    { "label": "Métrica Clave 3", "value": "Valor o estado" },
    { "label": "Métrica Clave 4", "value": "Valor o estado" }
  ],
  "category": "Estratégico & Operativo | Financiero & Analítica | Gestión & Documentación Técnica | Legal & Contratos"
}`;

    const userMessageContent: any[] = [
      { type: 'text', text: `Documento "${fileName}". Extracto o contenido del archivo:\n${textSnippet}` },
    ];

    if (fileBase64 && fileBase64.length > 20 && fileType.match(/(png|jpg|jpeg|webp)/i)) {
      userMessageContent.push({
        type: 'image_url',
        image_url: { url: fileBase64.startsWith('data:') ? fileBase64 : `data:${fileType};base64,${fileBase64}` },
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI ChatGPT API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(replyText);

    return {
      summary: parsed.summary || `Análisis del documento "${fileName}" generado por ChatGPT.`,
      keyTakeaways: parsed.keyTakeaways || [],
      metrics: parsed.metrics || [],
      category: parsed.category || 'Gestión & Documentación Técnica',
    };
  }

  async createObjectiveFromText(text: string): Promise<{ title: string; description?: string; tags?: string[] }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extrae un objetivo de ingeniería del mensaje del usuario. Responde ÚNICAMENTE en JSON con keys: title, description, tags.',
          },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await response.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  }
}
