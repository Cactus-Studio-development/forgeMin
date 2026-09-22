'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Users,
  Mail,
  ArrowUp,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Code2,
  UserCheck,
  ShieldCheck,
  Plus,
  Trash2,
  Paperclip,
  X,
  RefreshCw,
  Send,
  Zap,
  Layers,
  ChevronRight,
  TrendingUp,
  Edit3,
  Wand2,
  Upload,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { OpportunityIcon } from '@/components/ui/opportunity-icon';
import { api } from '@/lib/api';
import {
  Opportunity,
  Company,
  CompanyAnalysis,
  Contact,
  Job,
  JobAnalysis,
  Message as OutreachMessage,
  UserProfile,
  UserCv,
} from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type?: 'text' | 'company_analyzed' | 'job_analyzed' | 'contacts_list' | 'proposal_generated' | 'draft_created';
  payload?: any;
  attachedCv?: {
    id: string;
    name: string;
    language: string;
  };
}

export interface OpportunitySession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  companyId?: string;
  companyName?: string;
  companyDomain?: string;
  messages: ChatMessage[];
}

const WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    content: `¡Hola! Soy tu asistente de Opportunity Intelligence. Aquí tienes las herramientas empresariales a tu disposición:

• **Análisis de Empresas & B2B**: Audita tecnologías web, infraestructura digital y brechas operativas ingresando cualquier URL corporativa.
• **Matching de Empleo (Jobs)**: Evalúa descripciones de vacantes frente a tus CVs para calcular el porcentaje de afinidad semántica y habilidades clave.
• **Descubrimiento de Contactos**: Identifica correos públicos y perfiles clasificados (RRHH, Ventas, Directores) de la organización objetivo.
• **Redacción & Despacho con Gmail**: Genera y personaliza propuestas comerciales con el redactor asistido y despáchalas directamente desde tu cuenta autorizada.

¿Qué empresa, enlace o vacante deseas explorar hoy?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'text',
  },
];

export default function OpportunityIntelligencePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCv, setSelectedCv] = useState<UserCv | null>(null);
  const [cvs, setCvs] = useState<UserCv[]>([]);
  const [showCvModal, setShowCvModal] = useState(false);
  const [showDirectoryDrawer, setShowDirectoryDrawer] = useState(false);
  const [directoryTab, setDirectoryTab] = useState<'chats' | 'companies'>('chats');
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [sessions, setSessions] = useState<OpportunitySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => 'opp_session_' + Date.now());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Gmail Connection State
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);

  // Proposal Editing & AI Refine Bubble State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [showAiBubble, setShowAiBubble] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [refiningAi, setRefiningAi] = useState(false);

  // Send Confirmation Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendModalData, setSendModalData] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // CV Delete Confirmation Modal State
  const [cvToDelete, setCvToDelete] = useState<UserCv | null>(null);
  const [deletingCv, setDeletingCv] = useState(false);

  // New CV form state
  const [newCvName, setNewCvName] = useState('');
  const [newCvLang, setNewCvLang] = useState('es');
  const [newCvFile, setNewCvFile] = useState('CV_Professional.pdf');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper to persist sessions to local storage
  const saveSessionsToStorage = (updatedSessions: OpportunitySession[]) => {
    setSessions(updatedSessions);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('forgemind_opportunity_sessions', JSON.stringify(updatedSessions));
        setTimeout(() => {
          window.dispatchEvent(new Event('forgemind:opportunity-sessions-updated'));
        }, 0);
      } catch (err) {
        console.error('Error saving opportunity sessions:', err);
      }
    }
  };

  // Handle active session switching via URL query parameter ?session=<id>
  useEffect(() => {
    if (!sessionParam || sessionParam === 'new') {
      const freshId = 'opp_session_' + Date.now();
      setCurrentSessionId(freshId);
      setMessages(WELCOME_MESSAGES);
      return;
    }

    setCurrentSessionId(sessionParam);
    try {
      const local = localStorage.getItem('forgemind_opportunity_sessions');
      if (local) {
        const parsed: OpportunitySession[] = JSON.parse(local);
        const match = parsed.find((s) => s.id === sessionParam);
        if (match && Array.isArray(match.messages) && match.messages.length > 0) {
          setMessages(match.messages);
        } else {
          setMessages(WELCOME_MESSAGES);
        }
      } else {
        setMessages(WELCOME_MESSAGES);
      }
    } catch {
      setMessages(WELCOME_MESSAGES);
    }
  }, [sessionParam]);

  useEffect(() => {
    const handleNewOppChat = () => {
      const freshId = 'opp_session_' + Date.now();
      setCurrentSessionId(freshId);
      setMessages(WELCOME_MESSAGES);
      setInput('');
    };
    window.addEventListener('forgemind:new-opportunity-chat', handleNewOppChat);
    return () => window.removeEventListener('forgemind:new-opportunity-chat', handleNewOppChat);
  }, []);

  // Load Sessions and Initial Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('access_token');
      const urlEmail = urlParams.get('email');
      if (urlToken && urlEmail) {
        localStorage.setItem('gmail_access_token', urlToken);
        localStorage.setItem('gmail_email', urlEmail);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const storedToken = localStorage.getItem('gmail_access_token');
      const storedEmail = localStorage.getItem('gmail_email');
      if (storedToken) {
        setGmailConnected(true);
        setGmailAccessToken(storedToken);
        setGmailEmail(storedEmail || 'Conectado');
      }

      const localSessions = localStorage.getItem('forgemind_opportunity_sessions');
      if (localSessions) {
        try {
          const parsed: OpportunitySession[] = JSON.parse(localSessions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
          }
        } catch (e) {
          console.error('Error loading opportunity sessions:', e);
        }
      }
    }

    async function loadInitialData() {
      try {
        const [cvsRes, compRes] = await Promise.all([
          api.opportunity.getCvs().catch(() => []),
          api.opportunity.getCompanies().catch(() => []),
        ]);
        if (Array.isArray(cvsRes) && cvsRes.length > 0) {
          setCvs(cvsRes);
          const defaultCv = cvsRes.find((c) => c.isDefault) || cvsRes[0];
          setSelectedCv(defaultCv);
        }
        if (Array.isArray(compRes)) setCompanies(compRes);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync current conversation with sessions list
  const syncSessionMessages = (
    newMessages: ChatMessage[],
    companyMeta?: { id?: string; name?: string; domain?: string }
  ) => {
    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      let title = 'Nueva Conversación';

      const firstUserMsg = newMessages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        const clean = firstUserMsg.content.trim();
        const domainMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
        if (companyMeta?.name) {
          title = `Análisis de ${companyMeta.name}`;
        } else if (domainMatch && domainMatch[1]) {
          title = `Análisis de ${domainMatch[1]}`;
        } else if (clean.toLowerCase().includes('job') || clean.toLowerCase().includes('empleo') || clean.toLowerCase().includes('vacante')) {
          title = clean.length > 30 ? clean.slice(0, 30) + '...' : clean;
        } else {
          title = clean.length > 32 ? clean.slice(0, 32) + '...' : clean;
        }
      }

      let reordered: OpportunitySession[];

      if (existingIdx >= 0) {
        const current = prev[existingIdx];
        const updatedSession: OpportunitySession = {
          ...current,
          title: current.title === 'Nueva Conversación' && title !== 'Nueva Conversación' ? title : current.title,
          updatedAt: new Date().toISOString(),
          companyId: companyMeta?.id || current.companyId,
          companyName: companyMeta?.name || current.companyName,
          companyDomain: companyMeta?.domain || current.companyDomain,
          messages: newMessages,
        };
        const next = [...prev];
        next.splice(existingIdx, 1);
        reordered = [updatedSession, ...next];
      } else {
        const updatedSession: OpportunitySession = {
          id: currentSessionId,
          title: title || 'Conversación de Oportunidades',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          companyId: companyMeta?.id,
          companyName: companyMeta?.name,
          companyDomain: companyMeta?.domain,
          messages: newMessages,
        };
        reordered = [updatedSession, ...prev];
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('forgemind_opportunity_sessions', JSON.stringify(reordered));
        } catch (e) {
          console.error('Error storing opportunity session:', e);
        }
      }

      return reordered;
    });

    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new Event('forgemind:opportunity-sessions-updated'));
      }, 50);
    }
  };

  // Start a brand new separate chat
  const handleNewChat = () => {
    const newId = 'opp_session_' + Date.now();
    setCurrentSessionId(newId);
    setMessages(WELCOME_MESSAGES);
    setInput('');
    setShowDirectoryDrawer(false);
    router.push(`/opportunities?session=${newId}`);
    showToast('✓ Nueva investigación iniciada.');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Select an existing chat session from Directory drawer
  const handleSelectSession = (session: OpportunitySession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages && session.messages.length > 0 ? session.messages : WELCOME_MESSAGES);
    setShowDirectoryDrawer(false);
    router.push(`/opportunities?session=${session.id}`);
    showToast(`✓ Directorio "${session.title}" cargado.`);
  };

  // Delete a chat session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = sessions.filter((s) => s.id !== sessionId);
    saveSessionsToStorage(next);
    if (currentSessionId === sessionId) {
      if (next.length > 0) {
        setCurrentSessionId(next[0].id);
        setMessages(next[0].messages);
        router.push(`/opportunities?session=${next[0].id}`);
      } else {
        const newId = 'opp_session_' + Date.now();
        setCurrentSessionId(newId);
        setMessages(WELCOME_MESSAGES);
        router.push(`/opportunities?session=new`);
      }
    }
    showToast('✓ Conversación eliminada.');
  };

  // Clear all chat sessions
  const handleClearAllSessions = () => {
    saveSessionsToStorage([]);
    const newId = 'opp_session_' + Date.now();
    setCurrentSessionId(newId);
    setMessages(WELCOME_MESSAGES);
    router.push(`/opportunities?session=new`);
    showToast('✓ Todas las conversaciones han sido eliminadas.');
  };

  const handleConnectGmail = async () => {
    try {
      const res = await api.gmail.getAuthUrl();
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      showToast(`Error al iniciar conexión con Gmail: ${err.message}`);
    }
  };

  const handleDisconnectGmail = () => {
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_email');
    setGmailConnected(false);
    setGmailAccessToken(null);
    setGmailEmail(null);
    showToast('Gmail desconectado.');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsgId = `user_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedCv: selectedCv ? { id: selectedCv.id, name: selectedCv.name, language: selectedCv.language } : undefined,
    };

    const updatedAfterUser = [...messages, newMsg];
    setMessages(updatedAfterUser);
    syncSessionMessages(updatedAfterUser);
    setInput('');
    setLoading(true);

    try {
      const lower = text.toLowerCase();
      const isUrl = /(https?:\/\/[^\s]+)/g.test(text);

      if (isUrl && (lower.includes('job') || lower.includes('empleo') || lower.includes('careers') || lower.includes('work'))) {
        const res = await api.opportunity.analyzeJob(text, undefined, selectedCv?.id);
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `He analizado la oferta para "${res.job.title}" en ${res.job.companyName}. Match calculado con tu CV: ${res.analysis.heuristicScore}%.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'job_analyzed',
          payload: res,
        };
        const nextMsgs = [...updatedAfterUser, aiMsg];
        setMessages(nextMsgs);
        syncSessionMessages(nextMsgs, { name: res.job.companyName });
      } else if (isUrl) {
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/g)?.[0] || text;
        const res = await api.opportunity.analyzeCompany(urlMatch);
        setCompanies((prev) => {
          const exists = prev.some((c) => c.id === res.company.id);
          return exists ? prev : [res.company, ...prev];
        });
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `He analizado la empresa **${res.company.name}** (${res.company.domain}). Se detectaron ${res.company.technologies?.length || 0} tecnologías y ${res.contacts?.length || 0} contactos públicos.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'company_analyzed',
          payload: res,
        };
        const nextMsgs = [...updatedAfterUser, aiMsg];
        setMessages(nextMsgs);
        syncSessionMessages(nextMsgs, { id: res.company.id, name: res.company.name, domain: res.company.domain });
      } else if (lower.includes('propuesta') || lower.includes('mensaje') || lower.includes('carta') || lower.includes('pitch')) {
        const res = await api.opportunity.generateMessage({
          type: lower.includes('postul') ? 'JOB_APPLICATION' : 'BUSINESS_OUTREACH',
          tone: 'Profesional, ejecutivo y persuasivo',
          language: selectedCv?.language || 'es',
        });
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `He redactado la siguiente propuesta personalizada adaptada a tu perfil activo. Puedes editar el texto directamente o refinarlo con el mini agente:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'proposal_generated',
          payload: { message: res },
        };
        const nextMsgs = [...updatedAfterUser, aiMsg];
        setMessages(nextMsgs);
        syncSessionMessages(nextMsgs);
      } else if (lower.includes('contacto') || lower.includes('email') || lower.includes('correo')) {
        const contacts = await api.opportunity.getContacts();
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `Aquí tienes los contactos descubiertos recientemente en tus análisis:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'contacts_list',
          payload: { contacts },
        };
        const nextMsgs = [...updatedAfterUser, aiMsg];
        setMessages(nextMsgs);
        syncSessionMessages(nextMsgs);
      } else {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `Entendido. Puedo auditar cualquier empresa ingresando su enlace (ej: \`https://empresa.com\`), evaluar una vacante laboral o redactar una propuesta personalizada. ¿Qué deseas analizar?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
        };
        const nextMsgs = [...updatedAfterUser, aiMsg];
        setMessages(nextMsgs);
        syncSessionMessages(nextMsgs);
      }
    } catch (err: any) {
      const errMsgs: ChatMessage[] = [
        ...updatedAfterUser,
        {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: `Ocurrió un error al procesar la solicitud: ${err.message || 'Error de conexión'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
        },
      ];
      setMessages(errMsgs);
      syncSessionMessages(errMsgs);
    } finally {
      setLoading(false);
    }
  };

  // Create Draft Action (requires Gmail OAuth)
  const handleCreateDraftAction = async (subject: string, bodyText: string, toEmail: string) => {
    if (!gmailConnected || !gmailAccessToken) {
      showToast('Debes conectar tu cuenta de Gmail primero para crear borradores.');
      handleConnectGmail();
      return;
    }

    try {
      await api.opportunity.createDraft({
        accessToken: gmailAccessToken,
        to: toEmail || 'contacto@empresa.com',
        subject,
        body: bodyText,
      });
      showToast(`✓ Borrador creado en Gmail para ${toEmail || 'destinatario'}.`);
    } catch (err: any) {
      showToast(`Error al crear borrador: ${err.message}`);
    }
  };

  // Open Send Confirmation Modal
  const openSendModal = (subject: string, bodyText: string, toEmail: string) => {
    if (!gmailConnected || !gmailAccessToken) {
      showToast('Debes conectar tu cuenta de Gmail primero para enviar correos.');
      handleConnectGmail();
      return;
    }
    setSendModalData({
      to: toEmail || 'contacto@empresa.com',
      subject,
      body: bodyText,
    });
    setShowSendModal(true);
  };

  // Confirm Send Email
  const handleConfirmSendEmail = async () => {
    if (!sendModalData || !gmailAccessToken) return;
    setSendingEmail(true);
    try {
      await api.opportunity.sendEmail({
        accessToken: gmailAccessToken,
        to: sendModalData.to,
        subject: sendModalData.subject,
        body: sendModalData.body,
      });
      setShowSendModal(false);
      showToast(`✓ Correo enviado exitosamente a ${sendModalData.to}.`);
    } catch (err: any) {
      showToast(`Error al enviar correo: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // AI Refine Agent Bubble trigger
  const handleRefineWithAi = async (instruction: string) => {
    if (!editedBody && !editingMessageId) return;
    setRefiningAi(true);
    try {
      const res = await api.opportunity.refineText({
        originalText: editedBody,
        instruction,
      });
      if (res && res.refinedText) {
        setEditedBody(res.refinedText);
        showToast('✓ Texto modificado por el Agente IA.');
      }
    } catch (err: any) {
      showToast(`Error al modificar texto: ${err.message}`);
    } finally {
      setRefiningAi(false);
      setAiPromptInput('');
    }
  };

  const handleAddCvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCvName.trim()) return;
    try {
      const newCv: UserCv = {
        id: `cv_${Date.now()}`,
        userId: 'user-default',
        name: newCvName.trim(),
        language: newCvLang,
        fileName: newCvFile || 'CV_Uploaded.pdf',
        isDefault: cvs.length === 0,
      };
      await api.opportunity.saveCv(newCv);
      setCvs((prev) => [...prev, newCv]);
      setSelectedCv(newCv);
      setNewCvName('');
      setShowCvModal(false);
      showToast(`✓ CV "${newCv.name}" cargado y seleccionado.`);
    } catch (err: any) {
      showToast(`Error al cargar CV: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCvFile(file.name);
      setNewCvName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      setShowCvModal(true);
    }
  };

  const handleConfirmDeleteCv = async () => {
    if (!cvToDelete) return;
    setDeletingCv(true);
    try {
      await api.opportunity.deleteCv(cvToDelete.id).catch(() => {});
      const updated = cvs.filter((c) => c.id !== cvToDelete.id);
      setCvs(updated);
      if (selectedCv?.id === cvToDelete.id) {
        setSelectedCv(updated.length > 0 ? updated[0] : null);
      }
      showToast(`✓ CV "${cvToDelete.name}" eliminado.`);
      setCvToDelete(null);
    } catch (err: any) {
      showToast(`Error al eliminar CV: ${err.message}`);
    } finally {
      setDeletingCv(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.opportunity.deleteCompany(companyId).catch(() => {});
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      showToast('✓ Empresa eliminada del historial.');
    } catch (err: any) {
      showToast(`Error al eliminar: ${err.message}`);
    }
  };

  const handleClearAllCompanies = async () => {
    if (companies.length === 0) return;
    try {
      await api.opportunity.clearCompanies().catch(() => {});
      setCompanies([]);
      showToast('✓ Historial de empresas vaciado.');
    } catch (err: any) {
      showToast(`Error al vaciar historial: ${err.message}`);
    }
  };

  const quickPrompts = [
    { label: 'Analizar Stripe', prompt: 'Analiza https://stripe.com' },
    { label: 'Analizar Vercel', prompt: 'Analiza https://vercel.com' },
    { label: 'Buscar Empleos Next.js', prompt: 'Buscame vacantes remotas de Full Stack Next.js' },
    { label: 'Ver Contactos', prompt: 'Mostrame mis contactos de ventas descubiertos' },
    { label: 'Generar Propuesta', prompt: 'Prepará una propuesta de automatización con IA' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto p-3 md:p-5">
      {/* Top Header Bar - Minimalist ChatGPT & Subtle SAP Enterprise Style */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0070F2] text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs">
            OI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 tracking-tight">Opportunity Intelligence</h1>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#ebf3fc] text-[#0064d9] border border-[#cbe0fc]">
                Enterprise Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Análisis empresarial, evaluación de vacantes y despacho de propuestas.
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0070F2] hover:bg-[#005bb7] text-white text-xs font-medium transition-colors shadow-2xs"
            title="Iniciar nueva conversación"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Chat</span>
          </button>

          {/* Gmail Connection Status */}
          {gmailConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f9f5] text-emerald-800 text-xs font-medium border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[130px] truncate">{gmailEmail}</span>
              <button
                onClick={handleDisconnectGmail}
                className="text-[10px] text-slate-400 hover:text-red-600 ml-1"
                title="Desconectar"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGmail}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium border border-[#d8e6f8] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#0070F2]" />
              <span>Conectar Gmail</span>
            </button>
          )}

          {/* Active CV Selector */}
          <button
            onClick={() => setShowCvModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium border border-[#d8e6f8] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#0070F2]" />
            <span className="max-w-[120px] truncate">{selectedCv ? selectedCv.name : 'Gestionar CVs'}</span>
          </button>

          {/* Directory & Sessions Drawer Button */}
          <button
            onClick={() => setShowDirectoryDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium border border-[#d8e6f8] transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-[#0070F2]" />
            <span>Directorio ({sessions.length + companies.length})</span>
          </button>
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#0070F2] text-white flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0 shadow-2xs mt-0.5">
                OI
              </div>
            )}

            <div className={`max-w-2xl space-y-2.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* User Bubble */}
              {msg.role === 'user' ? (
                <div className="bg-[#f0f4f9] text-slate-900 px-4 py-2.5 rounded-2xl rounded-tr-xs text-sm leading-relaxed space-y-1 border border-slate-200/60">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachedCv && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#0064d9] font-medium pt-1 border-t border-slate-200/70">
                      <Paperclip className="w-3 h-3 text-[#0070F2]" />
                      <span>CV: {msg.attachedCv.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Assistant Bubble */
                <div className="bg-[#fcfdfe] border border-slate-200/90 text-slate-800 px-4 py-3.5 rounded-2xl rounded-tl-xs text-sm leading-relaxed space-y-3">
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-normal">
                    {msg.content}
                  </div>

                  {/* Widget: Company Analyzed */}
                  {msg.type === 'company_analyzed' && msg.payload && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 mt-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{msg.payload.company.name}</h4>
                          <span className="text-xs text-[#0070F2] font-medium">{msg.payload.company.domain}</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#ebf3fc] text-[#0064d9] border border-[#cbe0fc]">
                          {msg.payload.analysis?.confidence || 'High'} Confidence
                        </span>
                      </div>

                      {msg.payload.company.technologies && msg.payload.company.technologies.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-600 block mb-1">Tecnologías Detectadas:</span>
                          <div className="flex flex-wrap gap-1">
                            {msg.payload.company.technologies.map((t: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-[#f4f8fd] text-[#1c2d42] border border-[#d8e6f8] text-xs font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.payload.analysis?.observedSignals && (
                        <div className="space-y-1 text-xs text-slate-700 bg-[#f8fbfe] p-2.5 rounded-lg border border-[#dbe7f6]">
                          <span className="font-semibold text-slate-900 block mb-0.5">Hechos Observados:</span>
                          {msg.payload.analysis.observedSignals.map((s: string, i: number) => (
                            <div key={i} className="flex items-start gap-1.5 text-slate-600">
                              <span className="text-[#0070F2]">•</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.payload.opportunities && msg.payload.opportunities.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-semibold text-slate-900 block">Oportunidades & Soluciones:</span>
                          {msg.payload.opportunities.map((opp: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-[#f8fbfe] border border-[#dbe7f6] space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-800">{opp.title}</span>
                                <span className="text-[10px] font-medium text-[#0064d9] bg-[#ebf3fc] px-1.5 py-0.2 rounded border border-[#cbe0fc]">{opp.confidence}</span>
                              </div>
                              <p className="text-[11px] text-slate-600">{opp.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleSendMessage(`Prepará una propuesta de valor para ${msg.payload.company.name}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0070F2] hover:bg-[#005bb7] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Generar Propuesta</span>
                        </button>
                        <button
                          onClick={() => handleSendMessage(`Mostrame los contactos de ${msg.payload.company.name}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] border border-[#d8e6f8] text-xs font-medium transition-colors"
                        >
                          <span>Ver Contactos ({msg.payload.contacts?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Widget: Job Analyzed */}
                  {msg.type === 'job_analyzed' && msg.payload && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs mt-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{msg.payload.job.title}</h4>
                          <span className="text-xs text-[#0070F2] font-medium">{msg.payload.job.companyName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold text-[#0070F2]">{msg.payload.analysis?.heuristicScore || 85}%</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Match</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#f8fbfe] border border-[#dbe7f6] text-slate-800 space-y-0.5">
                          <span className="font-semibold block text-slate-900">Coincidencias:</span>
                          <p className="text-slate-600">{msg.payload.analysis?.matchedSkills?.join(', ') || 'Stack afín'}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#f8fbfe] border border-[#dbe7f6] text-slate-800 space-y-0.5">
                          <span className="font-semibold block text-slate-900">A reforzar:</span>
                          <p className="text-slate-600">{msg.payload.analysis?.missingSkills?.join(', ') || 'Ninguna crítica'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 bg-[#f8fbfe] p-2 rounded-lg border border-[#dbe7f6]">
                        <span>CV Recomendado: <strong className="text-slate-800">{msg.payload.analysis?.recommendedCvName || selectedCv?.name || 'CV Principal'}</strong></span>
                        <span>Idioma: <strong className="text-slate-800">{msg.payload.job.language === 'en' ? 'Inglés' : 'Español'}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleSendMessage(`Redactá mi mensaje de postulación para el puesto ${msg.payload.job.title} en ${msg.payload.job.companyName}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0070F2] hover:bg-[#005bb7] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Redactar Postulación</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Widget: Proposal Generated */}
                  {msg.type === 'proposal_generated' && msg.payload?.message && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs mt-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#0070F2]" /> Borrador de Propuesta
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (editingMessageId === msg.id) {
                                setEditingMessageId(null);
                              } else {
                                setEditingMessageId(msg.id);
                                setEditedSubject(msg.payload.message.subject);
                                setEditedBody(msg.payload.message.body);
                                setSelectedRecipient(msg.payload.message.contactEmail || 'contacto@empresa.com');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium border border-[#d8e6f8] flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{editingMessageId === msg.id ? 'Cerrar' : 'Editar'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditedSubject(msg.payload.message.subject);
                              setEditedBody(msg.payload.message.body);
                              setShowAiBubble(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#ebf3fc] hover:bg-[#dbe9fa] text-[#0064d9] text-xs font-medium border border-[#cbe0fc] flex items-center gap-1 transition-colors"
                          >
                            <Wand2 className="w-3 h-3 text-[#0070F2]" />
                            <span>Redactor IA</span>
                          </button>
                        </div>
                      </div>

                      {/* Recipient Selector */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs text-slate-700 bg-[#f8fbfe] p-2 rounded-lg border border-[#dbe7f6]">
                        <span className="font-medium shrink-0 flex items-center gap-1 text-slate-700">
                          Destinatario:
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="email"
                            placeholder="correo@empresa.com"
                            value={editingMessageId === msg.id ? selectedRecipient : (msg.payload.message.contactEmail || selectedRecipient || 'contacto@empresa.com')}
                            onChange={(e) => {
                              setSelectedRecipient(e.target.value);
                              if (editingMessageId !== msg.id) setEditingMessageId(msg.id);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#0070F2]"
                          />
                          {msg.payload.contacts && msg.payload.contacts.length > 0 && (
                            <select
                              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none font-medium"
                              onChange={(e) => {
                                if (e.target.value) {
                                  setSelectedRecipient(e.target.value);
                                  if (editingMessageId !== msg.id) setEditingMessageId(msg.id);
                                }
                              }}
                              value={selectedRecipient}
                            >
                              <option value="">Contactos descubiertos...</option>
                              {msg.payload.contacts.map((ct: Contact) => (
                                <option key={ct.id} value={ct.email}>
                                  {ct.name} ({ct.type}) - {ct.email}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Proposal Content Area */}
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editedSubject}
                            onChange={(e) => setEditedSubject(e.target.value)}
                            className="w-full bg-[#f8fbfe] border border-[#dbe7f6] rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0070F2]"
                            placeholder="Asunto del correo"
                          />
                          <textarea
                            rows={7}
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            onMouseUp={() => {
                              const selection = window.getSelection()?.toString();
                              if (selection && selection.length > 2) {
                                setShowAiBubble(true);
                              }
                            }}
                            className="w-full bg-[#f8fbfe] border border-[#dbe7f6] rounded-lg p-3 text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:border-[#0070F2] font-sans"
                            placeholder="Cuerpo del mensaje..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-900">
                            Asunto: <span className="font-normal text-slate-700">{msg.payload.message.subject}</span>
                          </p>
                          <div 
                            onMouseUp={() => {
                              const selection = window.getSelection()?.toString();
                              setEditingMessageId(msg.id);
                              setEditedSubject(msg.payload.message.subject);
                              setEditedBody(msg.payload.message.body);
                              setSelectedRecipient(msg.payload.message.contactEmail || 'contacto@empresa.com');
                              if (selection && selection.length > 2) {
                                setShowAiBubble(true);
                              }
                            }}
                            className="text-xs text-slate-700 bg-[#f8fbfe] p-3 rounded-lg border border-[#dbe7f6] whitespace-pre-wrap leading-relaxed select-text cursor-text relative group"
                          >
                            {msg.payload.message.body}
                          </div>
                        </div>
                      )}

                      {/* Mini AI Agent Writing Bubble */}
                      <AnimatePresence>
                        {showAiBubble && editingMessageId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="p-3 rounded-xl bg-[#f8fbfe] border border-[#cbe0fc] shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#0064d9] flex items-center gap-1.5">
                                <Wand2 className="w-3.5 h-3.5 text-[#0070F2]" /> Redactor Asistido
                              </span>
                              <button onClick={() => setShowAiBubble(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { label: 'Completar mis datos ([Tu Nombre], etc.)', prompt: 'Reemplaza los placeholders [Tu Nombre], [Tu Puesto] con mis datos del perfil real' },
                                { label: 'Tono formal', prompt: 'Haz que el mensaje tenga un tono más formal y persuasivo' },
                                { label: 'Más conciso', prompt: 'Resume el correo para que sea directo y breve' },
                                { label: 'Traducir a inglés', prompt: 'Traduce este correo a un inglés profesional de negocios' },
                              ].map((chip, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleRefineWithAi(chip.prompt)}
                                  disabled={refiningAi}
                                  className="text-[11px] font-medium bg-white hover:bg-[#ebf3fc] text-[#1c2d42] border border-[#d8e6f8] px-2.5 py-1 rounded-md transition-colors"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Escribe una instrucción (ej: cambia el saludo, resalta experiencia)..."
                                value={aiPromptInput}
                                onChange={(e) => setAiPromptInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && aiPromptInput.trim()) {
                                    handleRefineWithAi(aiPromptInput.trim());
                                  }
                                }}
                                className="flex-1 bg-white border border-[#d8e6f8] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0070F2]"
                              />
                              <button
                                onClick={() => aiPromptInput.trim() && handleRefineWithAi(aiPromptInput.trim())}
                                disabled={refiningAi || !aiPromptInput.trim()}
                                className="px-3 py-1.5 rounded-lg bg-[#0070F2] hover:bg-[#005bb7] disabled:opacity-50 text-white text-xs font-medium transition-all shrink-0 shadow-2xs"
                              >
                                {refiningAi ? 'Aplicando...' : 'Aplicar'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            const sub = editingMessageId === msg.id ? editedSubject : msg.payload.message.subject;
                            const bod = editingMessageId === msg.id ? editedBody : msg.payload.message.body;
                            navigator.clipboard.writeText(`${sub}\n\n${bod}`);
                            showToast('✓ Texto copiado al portapapeles.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium border border-[#d8e6f8] flex items-center gap-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#0070F2]" />
                          <span>Copiar</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const sub = editingMessageId === msg.id ? editedSubject : msg.payload.message.subject;
                              const bod = editingMessageId === msg.id ? editedBody : msg.payload.message.body;
                              const to = editingMessageId === msg.id ? selectedRecipient : (msg.payload.message.contactEmail || 'contacto@empresa.com');
                              handleCreateDraftAction(sub, bod, to);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] text-xs font-medium flex items-center gap-1.5 border border-[#d8e6f8] transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#0070F2]" />
                            <span>Crear Borrador</span>
                          </button>

                          <button
                            onClick={() => {
                              const sub = editingMessageId === msg.id ? editedSubject : msg.payload.message.subject;
                              const bod = editingMessageId === msg.id ? editedBody : msg.payload.message.body;
                              const to = editingMessageId === msg.id ? selectedRecipient : (msg.payload.message.contactEmail || 'contacto@empresa.com');
                              openSendModal(sub, bod, to);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0070F2] hover:bg-[#005bb7] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar Correo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Widget: Contacts List */}
                  {msg.type === 'contacts_list' && msg.payload?.contacts && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {msg.payload.contacts.slice(0, 6).map((c: Contact) => {
                        const rawType = (c.type || '').toUpperCase();
                        const displayType =
                          !rawType || rawType === 'UNKNOWN' || rawType === 'UNDEFINED'
                            ? 'GENERAL'
                            : rawType;
                        const displayName =
                          c.name === 'Mesadeentrada' || c.name.toLowerCase() === 'mesadeentrada'
                            ? 'Mesa de Entrada'
                            : c.name;
                        return (
                          <div key={c.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">{displayName}</span>
                              <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-[#ebf3fc] text-[#0064d9] border border-[#cbe0fc]">
                                {displayType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate">{c.email}</p>
                            <button
                              onClick={() => handleSendMessage(`Prepará un correo para ${displayName} (${c.email}) de ${c.companyName || 'la empresa'}`)}
                              className="mt-1 text-[11px] font-medium text-[#0070F2] hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" /> Escribir Mensaje
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-[#0070F2] text-white flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0 shadow-2xs">
              OI
            </div>
            <div className="text-xs text-slate-500 font-normal py-1.5 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0070F2] animate-ping" />
              <span>Analizando datos y procesando respuesta...</span>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2">
        <span className="text-[11px] text-slate-400 font-medium shrink-0">Sugerencias:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            className="px-3 py-1 rounded-full bg-[#f4f8fd] hover:bg-[#e8f2fc] text-[#1c2d42] hover:text-[#0070F2] border border-[#d8e6f8] hover:border-[#b8d6f9] text-xs font-normal whitespace-nowrap transition-all shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Chat Prompt Input Box - Minimalist ChatGPT Style */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 space-y-2 focus-within:border-[#0070F2]/60 transition-all">
        {selectedCv && (
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3 h-3 text-[#0070F2]" />
              <span>CV activo: <strong className="text-slate-800 font-semibold">{selectedCv.name}</strong></span>
            </span>
            <button
              onClick={() => setShowCvModal(true)}
              className="text-[#0070F2] hover:underline text-[11px] font-medium"
            >
              Cambiar CV
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pregúntame algo, introduce una URL (https://empresa.com) o vacante laboral..."
            className="flex-1 px-3 py-2 bg-transparent border-0 text-slate-900 placeholder-slate-400 text-sm focus:outline-none resize-none max-h-32"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-[#0070F2] hover:bg-[#005bb7] disabled:opacity-30 text-white flex items-center justify-center transition-all shrink-0 shadow-2xs mb-0.5"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal: Confirm Send Email */}
      <AnimatePresence>
        {showSendModal && sendModalData && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#0070F2]" />
                  <h3 className="text-base font-bold text-slate-900">Confirmación de Envío Directo</h3>
                </div>
                <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Estás a punto de enviar este correo desde tu cuenta vinculada de Gmail (<strong>{gmailEmail}</strong>). Por favor revisa los detalles antes de confirmar:
              </p>

              <div className="space-y-2 p-3.5 rounded-xl bg-[#f8fbfe] border border-[#dbe7f6] text-xs">
                <div>
                  <span className="font-bold text-slate-700">Para:</span>{' '}
                  <span className="text-[#0070F2] font-semibold">{sendModalData.to}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Asunto:</span>{' '}
                  <span className="text-slate-900">{sendModalData.subject}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="font-bold text-slate-700 block mb-1">Vista Previa:</span>
                  <div className="max-h-36 overflow-y-auto whitespace-pre-wrap text-slate-600 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                    {sendModalData.body}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSendEmail}
                  disabled={sendingEmail}
                  className="px-5 py-2 rounded-xl bg-[#0070F2] hover:bg-[#005bb7] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? 'Despachando Correo...' : 'Confirmar y Enviar'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Multi-CV Management */}
      <AnimatePresence>
        {showCvModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0070F2]" />
                  <h3 className="text-base font-bold text-slate-900">Gestión & Carga de CVs</h3>
                </div>
                <button onClick={() => setShowCvModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload CV Dropzone & Form */}
              <form onSubmit={handleAddCvSubmit} className="space-y-3.5 p-4 rounded-xl bg-[#f8fbfe] border border-[#dbe7f6]">
                <span className="text-xs font-bold text-slate-800 block">Subir y Registrar Nuevo CV</span>

                {/* Drag and Drop File Picker Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setNewCvFile(file.name);
                      setNewCvName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    newCvFile && newCvFile !== 'CV_Professional.pdf'
                      ? 'border-[#0070F2] bg-[#eff6ff]'
                      : 'border-slate-300 hover:border-[#0070F2] bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.doc,.txt"
                    className="hidden"
                  />
                  {newCvFile && newCvFile !== 'CV_Professional.pdf' ? (
                    <div className="flex items-center justify-center gap-2 text-[#0064d9]">
                      <FileText className="w-5 h-5 text-[#0070F2]" />
                      <div className="text-left">
                        <span className="text-xs font-bold block truncate max-w-[280px]">{newCvFile}</span>
                        <span className="text-[10px] text-[#0070F2]">Clic para cambiar archivo</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-8 h-8 mx-auto rounded-full bg-[#ebf3fc] text-[#0070F2] flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Haz clic o arrastra tu archivo CV aquí
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Soporta PDF, DOCX o TXT (máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Nombre identificador del CV:</label>
                  <input
                    type="text"
                    placeholder="ej. Brian Alexis Galli - Full Stack Dev"
                    value={newCvName}
                    onChange={(e) => setNewCvName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-[#0070F2] font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-1/3">
                    <select
                      value={newCvLang}
                      onChange={(e) => setNewCvLang(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0070F2]"
                    >
                      <option value="es">Español (ES)</option>
                      <option value="en">Inglés (EN)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={!newCvName.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#0070F2] hover:bg-[#005bb7] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Guardar y Activar CV</span>
                  </button>
                </div>
              </form>

              {/* Available CVs */}
              <div className="space-y-2 max-h-52 overflow-y-auto pt-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tus CVs Disponibles:</span>
                {cvs.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCv(c);
                      showToast(`✓ CV activo cambiado a "${c.name}"`);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedCv?.id === c.id
                        ? 'bg-[#eff6ff] border-[#b9d6f8] shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#ebf3fc] text-[#0064d9] border border-[#cbe0fc]">
                          {c.language}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{c.fileName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedCv?.id === c.id && (
                        <span className="text-xs font-bold text-[#0064d9] bg-[#ebf3fc] px-2 py-0.5 rounded-full border border-[#cbe0fc]">
                          Activo
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCvToDelete(c);
                        }}
                        title="Eliminar este CV"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Custom Delete CV Confirmation */}
      <AnimatePresence>
        {cvToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">¿Eliminar este CV?</h3>
                  <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">{cvToDelete.name}</span>
                <span className="text-slate-500 block">{cvToDelete.fileName} ({cvToDelete.language.toUpperCase()})</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                El archivo y su perfil semántico asociado serán eliminados de tu lista de CVs disponibles para las conversaciones de Opportunity Intelligence.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setCvToDelete(null)}
                  disabled={deletingCv}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteCv}
                  disabled={deletingCv}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingCv ? 'Eliminando...' : 'Eliminar CV'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer: Directorio & Sincronización de Chats */}
      <AnimatePresence>
        {showDirectoryDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white border-l border-slate-200 shadow-2xl max-w-md w-full h-full p-6 space-y-4 overflow-y-auto flex flex-col"
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0070F2]" />
                  <h3 className="text-base font-bold text-slate-900">Directorio & Historial</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0070F2] text-white text-xs font-semibold hover:bg-[#005bb7] transition-colors"
                    title="Crear nueva conversación"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo</span>
                  </button>
                  <button onClick={() => setShowDirectoryDrawer(false)} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Segmented Tab Switcher */}
              <div className="flex items-center bg-[#f4f8fd] p-1 rounded-xl border border-[#d8e6f8]">
                <button
                  onClick={() => setDirectoryTab('chats')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    directoryTab === 'chats'
                      ? 'bg-white text-[#0070F2] shadow-2xs border border-[#cbe0fc]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Conversaciones ({sessions.length})</span>
                </button>
                <button
                  onClick={() => setDirectoryTab('companies')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    directoryTab === 'companies'
                      ? 'bg-white text-[#0070F2] shadow-2xs border border-[#cbe0fc]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Empresas ({companies.length})</span>
                </button>
              </div>

              {/* TAB 1: Conversaciones / Chats */}
              {directoryTab === 'chats' && (
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Tus chats sincronizados:</span>
                    {sessions.length > 0 && (
                      <button
                        onClick={handleClearAllSessions}
                        className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                      >
                        Limpiar todos
                      </button>
                    )}
                  </div>

                  {sessions.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#0070F2]" />
                      <p className="font-semibold text-slate-600">No hay conversaciones previas</p>
                      <p className="text-[11px] mt-1 text-slate-400">Tus consultas y análisis quedarán guardados aquí automáticamente.</p>
                      <button
                        onClick={handleNewChat}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-[#0070F2] text-white text-xs font-semibold hover:bg-[#005bb7] inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Iniciar Chat
                      </button>
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isActive = s.id === currentSessionId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 relative group ${
                            isActive
                              ? 'bg-[#eff6ff] border-[#b9d6f8] shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate max-w-[240px] ${isActive ? 'text-[#0070F2]' : 'text-slate-900'}`}>
                              {s.title}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleDeleteSession(s.id, e)}
                                title="Eliminar conversación"
                                className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(s.updatedAt || s.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {s.companyDomain && (
                              <span className="text-[10px] font-semibold text-[#0064d9] bg-[#ebf3fc] px-1.5 py-0.2 rounded border border-[#cbe0fc] truncate max-w-[120px]">
                                {s.companyDomain}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: Empresas */}
              {directoryTab === 'companies' && (
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Empresas auditadas:</span>
                    {companies.length > 0 && (
                      <button
                        onClick={handleClearAllCompanies}
                        className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                      >
                        Limpiar todas
                      </button>
                    )}
                  </div>

                  {companies.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#0070F2]" />
                      <p className="font-semibold text-slate-600">No hay empresas en el historial</p>
                      <p className="text-[11px] mt-1 text-slate-400">Analiza una URL en el chat para registrarla automáticamente.</p>
                    </div>
                  ) : (
                    companies.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => {
                          const existingSession = sessions.find((s) => s.companyId === comp.id || s.companyDomain === comp.domain);
                          if (existingSession) {
                            handleSelectSession(existingSession);
                          } else {
                            setShowDirectoryDrawer(false);
                            handleSendMessage(`Analiza los detalles y oportunidades de ${comp.domain}`);
                          }
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors space-y-1 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleDeleteCompany(comp.id, e)}
                              title="Quitar del historial"
                              className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-200/70 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                        <span className="text-xs text-[#0070F2] font-medium block">{comp.domain}</span>
                        <p className="text-xs text-slate-500 line-clamp-2">{comp.description || 'Empresa analizada'}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
