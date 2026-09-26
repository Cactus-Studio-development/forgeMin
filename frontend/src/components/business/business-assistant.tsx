'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Copy,
  Check,
  Building2,
  Zap,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  MessageSquare,
  AlertCircle,
  FileText,
  Play,
  Square,
} from 'lucide-react';
import { BusinessProfile, BusinessOpportunity } from '@/types';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedFollowUps?: string[];
}

interface BusinessAssistantProps {
  profile: BusinessProfile;
  opportunities?: BusinessOpportunity[];
  initialQuery?: string;
  onOpenContentGenerator?: () => void;
  onOpenDiagnostic?: () => void;
  onOpenTranslation?: () => void;
}

export function BusinessAssistant({
  profile,
  opportunities = [],
  initialQuery,
  onOpenContentGenerator,
  onOpenDiagnostic,
  onOpenTranslation,
}: BusinessAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hola. Soy el **Asistente RIS3**, tu copiloto de inteligencia de negocio para **${profile.name || 'tu empresa'}**.\n\nHe cargado los datos de tu rubro (*${profile.industry || 'General'}*), tus ${profile.productsOrServices?.length || 0} productos o servicios registrados y ${opportunities.length} oportunidades de diagnóstico.\n\n¿En qué aspecto comercial te gustaría que trabajemos hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        '¿Cómo puedo aumentar mis ventas?',
        'Analizá mi negocio',
        '¿Qué debería mejorar?',
        '¿Qué productos debería promocionar?',
        'Creame una promoción',
        'Generame una publicación',
        '¿Qué oportunidades encontrás?',
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Speech to Text (STT) state
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Text to Speech (TTS) state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Initialize Web Speech API for voice capture (STT)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-AR';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputMessage(transcript);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz por micrófono no está soportado en este navegador.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSpeakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('La síntesis de voz no está soportada en tu navegador.');
      return;
    }

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural TTS
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/#/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.businessBoost.chatAssistant(textToSend.trim(), historyPayload);

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'He procesado tu consulta sobre tu negocio.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: res.suggestedFollowUps || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Disculpa, ocurrió un error al consultar al Asistente RIS3: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const promptSuggestions = [
    '¿Cómo puedo aumentar mis ventas?',
    'Analizá mi negocio.',
    '¿Qué debería mejorar?',
    '¿Qué productos debería promocionar?',
    'Creame una promoción.',
    'Generame una publicación.',
    '¿Qué oportunidades encontrás?',
  ];

  return (
    <div className="flex flex-col h-[760px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <Sparkles size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-950 ring-1 ring-emerald-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Asistente RIS3</h3>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Contexto Autorizado
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Conectado a: <span className="text-zinc-200 font-medium">{profile.name || 'Mi Negocio'}</span> •{' '}
              {profile.industry || 'Comercio'}
            </p>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-2">
          {onOpenContentGenerator && (
            <button
              onClick={onOpenContentGenerator}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-all"
              title="Generar piezas de contenido comercial"
            >
              <FileText size={13} className="text-emerald-400" />
              Generar
            </button>
          )}

          {onOpenDiagnostic && (
            <button
              onClick={onOpenDiagnostic}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-all"
              title="Analizar oportunidades de negocio"
            >
              <Zap size={13} className="text-amber-400" />
              Analizar
            </button>
          )}

          {onOpenTranslation && (
            <button
              onClick={onOpenTranslation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/60 transition-all"
              title="Traductor y Modo Conversación"
            >
              <Globe size={13} className="text-blue-400" />
              Traducir
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          const isThisSpeaking = isSpeaking && speakingMsgId === msg.id;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-sm shadow-md ${
                  isAssistant
                    ? 'bg-zinc-900/90 border border-zinc-800 text-zinc-200'
                    : 'bg-emerald-600 text-white font-medium rounded-br-xs'
                }`}
              >
                {/* Assistant header inside bubble */}
                {isAssistant && (
                  <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-zinc-800/60 text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      Asistente RIS3
                    </span>
                    <span className="text-[11px] text-zinc-500">{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                  {msg.content}
                </div>

                {/* Bubble Footer with Audio & Copy */}
                {isAssistant && (
                  <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakText(msg.content, msg.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                          isThisSpeaking
                            ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                            : 'hover:text-white hover:bg-zinc-800'
                        }`}
                        title={isThisSpeaking ? 'Detener lectura' : 'Escuchar respuesta con voz'}
                      >
                        {isThisSpeaking ? (
                          <>
                            <Square size={12} className="animate-pulse" />
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
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {!isAssistant && <span className="text-[11px] text-emerald-200">{msg.timestamp}</span>}
                  </div>
                )}
              </div>

              {/* Follow up chips if provided */}
              {isAssistant && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.suggestedFollowUps.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 border border-zinc-800 px-3 py-1 text-xs transition-all shadow-xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 max-w-[60%] text-xs text-zinc-400">
            <RefreshCw size={15} className="animate-spin text-emerald-400 shrink-0" />
            <span>Asistente RIS3 razonando con los datos de tu negocio...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick prompt chips bar */}
      <div className="px-6 py-2 border-t border-zinc-900 bg-zinc-950/60 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
          Sugerencias:
        </span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 px-2.5 py-1 text-xs transition-all shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input controls area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
        {/* Active recording visualizer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-semibold">🎙️ Escuchando tu voz... Hablá con libertad.</span>
              </div>
              <button
                onClick={toggleVoiceRecording}
                className="px-2.5 py-1 rounded-lg bg-red-500 text-white font-semibold text-xs hover:bg-red-600 transition-colors"
              >
                Finalizar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* 🎙️ Hablar Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-3 rounded-xl border transition-all shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-950/40 animate-pulse'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'
            }`}
            title={isRecording ? 'Detener grabación de voz' : 'Hablar por micrófono (Voz a Texto)'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribí tu consulta sobre tu negocio o hablá por micrófono..."
            disabled={loading}
            className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="flex items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-40 shadow-lg shadow-emerald-950/40 shrink-0 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
