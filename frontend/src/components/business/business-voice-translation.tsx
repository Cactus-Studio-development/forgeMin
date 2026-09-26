'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ArrowRightLeft,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Square,
  User,
  Headphones,
  Trash2,
} from 'lucide-react';
import { BusinessProfile } from '@/types';
import { api } from '@/lib/api';

interface BusinessVoiceTranslationProps {
  profile: BusinessProfile;
}

interface ConversationTurn {
  id: string;
  speaker: 'client' | 'user';
  originalText: string;
  originalLang: string;
  translatedText: string;
  targetLang: string;
  timestamp: string;
}

export function BusinessVoiceTranslation({ profile }: BusinessVoiceTranslationProps) {
  const [activeTab, setActiveTab] = useState<'translate' | 'conversation'>('translate');

  // Translator state
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('Inglés');
  const [inputText, setInputText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    translatedText: string;
    detectedLanguage: string;
    phoneticOrNotes?: string;
  } | null>(null);

  // Audio / Speech recognition for standard translator
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingOriginal, setIsSpeakingOriginal] = useState(false);
  const [isSpeakingTranslated, setIsSpeakingTranslated] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);

  // Live Conversation Mode state
  const [clientLang, setClientLang] = useState('Inglés');
  const [userLang, setUserLang] = useState('Español');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [activeRecordingSpeaker, setActiveRecordingSpeaker] = useState<'client' | 'user' | null>(
    null
  );
  const [processingTurn, setProcessingTurn] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (activeTab === 'translate') {
            setInputText(transcript);
            setIsRecording(false);
            // Auto translate after speech
            handleTranslateText(transcript);
          } else if (activeRecordingSpeaker) {
            handleProcessConversationTurn(transcript, activeRecordingSpeaker);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
          setActiveRecordingSpeaker(null);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech error:', e.error);
          setIsRecording(false);
          setActiveRecordingSpeaker(null);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab, activeRecordingSpeaker, sourceLang, targetLang, clientLang, userLang]);

  const speakText = (text: string, langName: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Map language names to BCP-47 codes
    const langCodeMap: Record<string, string> = {
      Español: 'es-ES',
      Inglés: 'en-US',
      Portugués: 'pt-BR',
      Francés: 'fr-FR',
      Alemán: 'de-DE',
      Italiano: 'it-IT',
      Chino: 'zh-CN',
    };

    utterance.lang = langCodeMap[langName] || 'es-ES';
    utterance.rate = 0.95;

    utterance.onend = () => {
      onEnd?.();
    };
    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTranslateText = async (textToUse?: string) => {
    const text = textToUse || inputText;
    if (!text.trim()) return;

    setTranslating(true);
    try {
      const res = await api.businessBoost.translate({
        text: text.trim(),
        targetLanguage: targetLang,
        sourceLanguage: sourceLang === 'auto' ? undefined : sourceLang,
      });
      setTranslationResult(res);
    } catch (err: any) {
      alert(`Error al traducir: ${err.message}`);
    } finally {
      setTranslating(false);
    }
  };

  const handleVoiceTranslate = () => {
    if (!recognitionRef.current) {
      alert('Reconocimiento de voz no soportado en tu navegador.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      const langCodeMap: Record<string, string> = {
        auto: 'es-AR',
        Español: 'es-AR',
        Inglés: 'en-US',
        Portugués: 'pt-BR',
        Francés: 'fr-FR',
        Alemán: 'de-DE',
        Italiano: 'it-IT',
      };
      recognitionRef.current.lang = langCodeMap[sourceLang] || 'es-AR';
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleStartConversationSpeech = (speaker: 'client' | 'user') => {
    if (!recognitionRef.current) {
      alert('Reconocimiento de voz no soportado.');
      return;
    }

    if (activeRecordingSpeaker === speaker) {
      recognitionRef.current.stop();
      setActiveRecordingSpeaker(null);
    } else {
      const langCodeMap: Record<string, string> = {
        Español: 'es-AR',
        Inglés: 'en-US',
        Portugués: 'pt-BR',
        Francés: 'fr-FR',
        Alemán: 'de-DE',
        Italiano: 'it-IT',
      };
      const chosenLang = speaker === 'client' ? clientLang : userLang;
      recognitionRef.current.lang = langCodeMap[chosenLang] || 'es-AR';

      try {
        setActiveRecordingSpeaker(speaker);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start conversation speech:', err);
      }
    }
  };

  const handleProcessConversationTurn = async (
    transcript: string,
    speaker: 'client' | 'user'
  ) => {
    if (!transcript.trim()) return;

    setProcessingTurn(true);
    const sourceL = speaker === 'client' ? clientLang : userLang;
    const targetL = speaker === 'client' ? userLang : clientLang;

    try {
      const res = await api.businessBoost.translate({
        text: transcript,
        targetLanguage: targetL,
        sourceLanguage: sourceL,
      });

      const newTurn: ConversationTurn = {
        id: `turn_${Date.now()}`,
        speaker,
        originalText: transcript,
        originalLang: sourceL,
        translatedText: res.translatedText,
        targetLang: targetL,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversationHistory((prev) => [...prev, newTurn]);

      // Speak translated output in real time
      speakText(res.translatedText, targetL);
    } catch (err: any) {
      console.error('Error in conversation turn:', err);
    } finally {
      setProcessingTurn(false);
      setActiveRecordingSpeaker(null);
    }
  };

  const languagesList = [
    'Inglés',
    'Español',
    'Portugués',
    'Francés',
    'Alemán',
    'Italiano',
    'Chino',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Globe size={14} />
              Traducción Comercial & Interacción por Voz
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Comunicación Internacional para tu Negocio
            </h2>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Traducí textos comerciales, hablá por micrófono para convertir voz a texto y activá el modo de conversación en tiempo real con clientes del exterior.
            </p>
          </div>

          {/* Mode Tabs Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('translate')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'translate'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe size={14} />
              Traductor Comercial
            </button>
            <button
              onClick={() => setActiveTab('conversation')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'conversation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              Modo Conversación en Vivo
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'translate' ? (
        /* Standard Translator with Voice */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Input Box */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Idioma de Origen
                </span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="auto">🌎 Detección Automática</option>
                  {languagesList.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={7}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí aquí el texto que querés traducir o presioná el micrófono para hablar..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceTranslate}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
                  }`}
                >
                  <Mic size={14} />
                  <span>{isRecording ? 'Escuchando...' : '🎙️ Hablar'}</span>
                </button>

                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSpeakingOriginal(true);
                      speakText(inputText, sourceLang === 'auto' ? 'Español' : sourceLang, () =>
                        setIsSpeakingOriginal(false)
                      );
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
                    title="Escuchar texto original"
                  >
                    <Volume2 size={15} />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleTranslateText()}
                disabled={!inputText.trim() || translating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-950/40 disabled:opacity-50"
              >
                <RefreshCw size={14} className={translating ? 'animate-spin' : ''} />
                <span>{translating ? 'Traduciendo...' : 'Traducir Texto'}</span>
              </button>
            </div>
          </div>

          {/* Translation Output Box */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Idioma de Destino
                  </span>
                  {translationResult?.detectedLanguage && (
                    <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                      Detectado: {translationResult.detectedLanguage}
                    </span>
                  )}
                </div>

                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  {languagesList.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-[188px] rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-200 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {translating ? (
                  <div className="flex items-center justify-center h-full text-xs text-zinc-500 gap-2">
                    <RefreshCw size={16} className="animate-spin text-blue-400" />
                    <span>Traduciendo con IA de RIS3...</span>
                  </div>
                ) : translationResult ? (
                  translationResult.translatedText
                ) : (
                  <span className="text-zinc-600 italic">
                    La traducción procesada aparecerá aquí...
                  </span>
                )}
              </div>
            </div>

            {translationResult && (
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeakingTranslated(true);
                    speakText(translationResult.translatedText, targetLang, () =>
                      setIsSpeakingTranslated(false)
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition-colors"
                >
                  <Volume2 size={14} className={isSpeakingTranslated ? 'text-blue-400 animate-pulse' : ''} />
                  <span>🔊 Escuchar Traducción</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(translationResult.translatedText);
                    setCopiedTranslated(true);
                    setTimeout(() => setCopiedTranslated(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
                >
                  {copiedTranslated ? (
                    <>
                      <Check size={13} />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Real-time Conversation Mode (Modo Conversación) */
        <div className="space-y-6">
          {/* Controls Bar for Dual Languages */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              {/* Client Lang */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-400">Cliente Habla:</span>
                <select
                  value={clientLang}
                  onChange={(e) => setClientLang(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-white"
                >
                  {languagesList.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <ArrowRightLeft size={16} className="text-zinc-500" />

              {/* User Lang */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">Vos Hablás:</span>
                <select
                  value={userLang}
                  onChange={(e) => setUserLang(e.target.value)}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-white"
                >
                  {languagesList.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {conversationHistory.length > 0 && (
              <button
                onClick={() => setConversationHistory([])}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} /> Limpiar Diálogo
              </button>
            )}
          </div>

          {/* Interactive Bilateral Microphone Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Button: Client speaks */}
            <button
              onClick={() => handleStartConversationSpeech('client')}
              disabled={processingTurn}
              className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer ${
                activeRecordingSpeaker === 'client'
                  ? 'bg-purple-500/20 border-purple-500 text-white shadow-xl shadow-purple-950/50 animate-pulse'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-purple-500/50 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  activeRecordingSpeaker === 'client'
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-800 text-purple-400'
                }`}
              >
                <Mic size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {activeRecordingSpeaker === 'client'
                    ? `🎙️ Escuchando al Cliente (${clientLang})...`
                    : `Cliente: Hablar en ${clientLang}`}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  RIS3 transcribirá y reproducirá automáticamente en {userLang}
                </p>
              </div>
            </button>

            {/* Right Button: User speaks */}
            <button
              onClick={() => handleStartConversationSpeech('user')}
              disabled={processingTurn}
              className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center text-center space-y-3 cursor-pointer ${
                activeRecordingSpeaker === 'user'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-xl shadow-emerald-950/50 animate-pulse'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  activeRecordingSpeaker === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-emerald-400'
                }`}
              >
                <Mic size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {activeRecordingSpeaker === 'user'
                    ? `🎙️ Escuchando tu respuesta (${userLang})...`
                    : `Vos: Responder en ${userLang}`}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  RIS3 traducirá y reproducirá automáticamente en {clientLang}
                </p>
              </div>
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 space-y-4 min-h-[300px]">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Registro del Diálogo en Tiempo Real
            </h4>

            {conversationHistory.length > 0 ? (
              <div className="space-y-4">
                {conversationHistory.map((turn) => {
                  const isClient = turn.speaker === 'client';

                  return (
                    <motion.div
                      key={turn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-2 border ${
                          isClient
                            ? 'bg-purple-950/20 border-purple-500/30 text-zinc-200'
                            : 'bg-emerald-950/20 border-emerald-500/30 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] pb-1 border-b border-zinc-800/50">
                          <span
                            className={`font-bold ${isClient ? 'text-purple-400' : 'text-emerald-400'}`}
                          >
                            {isClient ? `👤 Cliente (${turn.originalLang})` : `💼 Vos (${turn.originalLang})`}
                          </span>
                          <span className="text-zinc-500">{turn.timestamp}</span>
                        </div>

                        {/* Original */}
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block">Original</span>
                          <p className="text-xs text-zinc-300 font-sans mt-0.5">{turn.originalText}</p>
                        </div>

                        {/* Translated */}
                        <div className="pt-2 border-t border-zinc-800/50 flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-blue-400 uppercase font-semibold block">
                              Traducción ({turn.targetLang})
                            </span>
                            <p className="text-xs text-white font-medium mt-0.5">
                              {turn.translatedText}
                            </p>
                          </div>

                          <button
                            onClick={() => speakText(turn.translatedText, turn.targetLang)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white shrink-0 mt-2"
                            title="Re-reproducir audio"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-600 text-xs">
                Iniciá la conversación presionando el micrófono del Cliente o de tu Negocio.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
