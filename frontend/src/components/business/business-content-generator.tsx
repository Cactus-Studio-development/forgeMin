'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Send,
  Share2,
  Tag,
  Volume2,
  VolumeX,
  Lightbulb,
  CheckCircle2,
  Layers,
  ArrowRight,
  Square,
} from 'lucide-react';
import { BusinessProfile, CommercialContentResult } from '@/types';
import { api } from '@/lib/api';

interface BusinessContentGeneratorProps {
  profile: BusinessProfile;
  onSendToAssistant?: (content: string) => void;
}

export function BusinessContentGenerator({
  profile,
  onSendToAssistant,
}: BusinessContentGeneratorProps) {
  const [contentType, setContentType] = useState<
    'post' | 'promotion' | 'description' | 'commercial_message' | 'ideas'
  >('post');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [channel, setChannel] = useState('Instagram / Redes Sociales');
  const [tone, setTone] = useState('Persuasivo y profesional');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CommercialContentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setResult(null);

    let specificTopic = topic.trim();
    if (selectedProduct !== 'all') {
      const prod = profile.productsOrServices?.find((p) => p.id === selectedProduct);
      if (prod) {
        specificTopic = specificTopic
          ? `${specificTopic} (Enfocado en: ${prod.name})`
          : `Destacar el producto/servicio: ${prod.name} - ${prod.description || ''} ${prod.price ? `[Precio: ${prod.price}]` : ''}`;
      }
    }

    try {
      const res = await api.businessBoost.generateContent({
        type: contentType,
        topic: specificTopic,
        targetAudience: targetAudience.trim() || undefined,
        channel,
        tone,
        language: 'Español',
      });
      setResult(res);
    } catch (err: any) {
      alert(`Error al generar contenido: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('La síntesis de voz no está disponible.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/#/g, '').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const typePresets = [
    {
      type: 'post',
      label: 'Publicación',
      desc: 'Para Instagram, Facebook o LinkedIn',
      icon: Share2,
    },
    {
      type: 'promotion',
      label: 'Promoción u Oferta',
      desc: 'Descuento, combo o beneficio especial',
      icon: Tag,
    },
    {
      type: 'description',
      label: 'Descripción Comercial',
      desc: 'Para catálogo, bio o sitio web',
      icon: FileText,
    },
    {
      type: 'commercial_message',
      label: 'Mensaje Directo',
      desc: 'Para WhatsApp o contacto directo',
      icon: Send,
    },
    {
      type: 'ideas',
      label: 'Ideas de Atracción',
      desc: 'Estrategias para captar clientes',
      icon: Lightbulb,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">
            <Sparkles size={14} />
            Generador de Contenido Comercial
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Creá Piezas de Alto Impacto para tu Negocio
          </h2>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Generá publicaciones, promociones y mensajes comerciales listos para compartir, basados 100% en los productos y datos reales de {profile.name || 'tu negocio'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              1. Tipo de Contenido
            </h3>

            {/* Type selector cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {typePresets.map((preset) => {
                const Icon = preset.icon;
                const active = contentType === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => setContentType(preset.type as any)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-violet-500/15 border-violet-500/40 text-white shadow-xs'
                        : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                        active ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{preset.label}</span>
                      <span className="text-[11px] text-zinc-500 block">{preset.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                2. Parámetros de Personalización
              </h3>

              {/* Product selector */}
              {profile.productsOrServices && profile.productsOrServices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Producto o Servicio a Promocionar
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-violet-500"
                  >
                    <option value="all">Todos los productos / Visión general</option>
                    {profile.productsOrServices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.price ? `(${p.price})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Tema o Enfoque Específico (Opcional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Promo de fin de semana, beneficio por tiempo limitado..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              {/* Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Canal de Difusión</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-violet-500"
                >
                  <option value="Instagram / Redes Sociales">Instagram / Feed & Stories</option>
                  <option value="WhatsApp / Mensajes">WhatsApp Directo / Difusión</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn (Profesional)</option>
                  <option value="Email Comercial">Email Comercial / Newsletter</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Tono del Mensaje</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-violet-500"
                >
                  <option value="Persuasivo y profesional">Persuasivo y profesional</option>
                  <option value="Cálido y cercano">Cálido y cercano</option>
                  <option value="Urgente con llamada a la acción clara">Urgente con llamada a la acción clara</option>
                  <option value="Educativo y de valor">Educativo y de valor</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 text-xs transition-all shadow-lg shadow-violet-950/40 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Generando contenido con IA...' : 'Generar Contenido Comercial'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm min-h-[520px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-violet-400" />
                  <h3 className="text-sm font-bold text-white">Resultado Generado</h3>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeak(result.content)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                      title="Escuchar locución del contenido"
                    >
                      {isSpeaking ? (
                        <>
                          <Square size={12} className="text-violet-400 animate-pulse" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>Escuchar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(result.content)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check size={13} />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {generating ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-3">
                  <RefreshCw size={32} className="animate-spin text-violet-400" />
                  <p className="text-sm font-semibold text-zinc-200">Redactando pieza comercial...</p>
                  <p className="text-xs text-zinc-500 max-w-xs text-center">
                    Analizando los datos de {profile.name} y optimizando para el canal seleccionado.
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider block">
                      Campaña / Título sugerido
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{result.title}</h4>
                  </div>

                  {/* Main text */}
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 whitespace-pre-wrap text-sm text-zinc-200 leading-relaxed font-sans shadow-inner">
                    {result.content}
                  </div>

                  {/* Call to action */}
                  {result.callToAction && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                        Llamado a la Acción (CTA)
                      </span>
                      <p className="text-xs font-semibold text-emerald-200 mt-0.5">
                        {result.callToAction}
                      </p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {result.hashtags && result.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {result.hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-violet-300 border border-zinc-700/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Marketing tips */}
                  {result.marketingTips && result.marketingTips.length > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                      <span className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1.5">
                        <Lightbulb size={13} /> Consejos de publicación RIS3
                      </span>
                      <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                        {result.marketingTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">
                    Elige el tipo de contenido y presiona "Generar"
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    El asistente redactará automáticamente una pieza comercial adaptada al rubro y oferta de tu negocio.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom shortcut */}
            {result && onSendToAssistant && (
              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => onSendToAssistant(result.content)}
                  className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-xl border border-emerald-500/20 transition-all"
                >
                  <Sparkles size={13} />
                  Llevar al Asistente para ajustar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
