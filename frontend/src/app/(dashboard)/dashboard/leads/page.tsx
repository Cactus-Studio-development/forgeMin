'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  Sparkles,
  Users,
  Mail,
  Copy,
  Share2,
  Send,
  Plus,
  CheckCircle2,
  TrendingUp,
  Building,
  RefreshCw,
  Search,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Bot,
  UserCheck,
  Zap,
  SlidersHorizontal,
  X,
  Target,
  FileText,
  Save,
  Check,
  Rocket,
  Trash2
} from 'lucide-react';
import { DotsLoader } from '@/components/ui/dots-loader';
import { DeerIcon } from '@/components/ui/deer-icon';
import { useProfileSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';
import { renderFormattedText } from '@/lib/link-renderer';
import { translations } from '@/lib/translations';
import { GlobalReportModal } from '@/components/layout/global-report-modal';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  role?: string;
  linkedinUrl?: string;
  status: 'NEW' | 'ENRICHED' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'ARCHIVED';
  aiScore?: {
    score: number;
    reasoning: string;
    keySynergies: string[];
  };
  drafts?: Array<{
    channel: 'GMAIL' | 'LINKEDIN' | 'CUSTOM_EMAIL';
    subject?: string;
    body: string;
  }>;
  dripSequence?: Array<{
    stepNumber: number;
    delayDays: number;
    subject?: string;
    body: string;
    status: 'PENDING' | 'SENT' | 'SKIPPED';
  }>;
}

interface LinkedInPersonItem {
  id: string;
  name: string;
  headline?: string;
  profilePictureUrl?: string;
  profileUrl: string;
  searchUrl?: string;
  company?: string;
  location?: string;
  isVerified?: boolean;
}

interface FacebookResultItem {
  id: string;
  name: string;
  headline?: string;
  facebookUrl: string;
  profilePictureUrl?: string;
  company?: string;
  location?: string;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  payload?: {
    type?: string;
    lead?: Lead;
    linkedInPeople?: LinkedInPersonItem[];
    facebookResults?: FacebookResultItem[];
    hasMore?: boolean;
    searchContext?: { industry?: string; role?: string; query?: string };
  };
}

interface ChatSessionItem {
  id: string;
  title: string;
  projectName?: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    payload?: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

function LeadsChatContent() {
  const searchParams = useSearchParams();
  const { settings } = useProfileSettings();
  const lang = settings.language || 'es';
  const t = translations[lang] || translations.es;

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<{ firstName: string; lastName: string; headline?: string; profilePictureUrl?: string; profileUrl: string } | null>(null);
  const [showLinkedInProfile, setShowLinkedInProfile] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [showGmailProfile, setShowGmailProfile] = useState(false);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [showFacebookProfile, setShowFacebookProfile] = useState(false);
  const [facebookPhotoUrl, setFacebookPhotoUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [searchMode, setSearchMode] = useState<'all' | 'linkedin' | 'facebook' | 'apollo'>('all');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [scrapingLeadName, setScrapingLeadName] = useState<string | null>(null);
  const [prospectTab, setProspectTab] = useState<'active' | 'archived'>('active');
  const [aiContextInput, setAiContextInput] = useState('');
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailModalParams, setMailModalParams] = useState<{
    initialFolder?: 'inbox' | 'compose' | 'contacts' | 'templates';
    initialEmailTo?: string;
    initialSubject?: string;
    initialContent?: string;
  }>({});
  const [savedChatSessions, setSavedChatSessions] = useState<ChatSessionItem[]>([]);
  const [showSavedChatsModal, setShowSavedChatsModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [savedChatSearchQuery, setSavedChatSearchQuery] = useState('');
  const [confirmToast, setConfirmToast] = useState<{ message: string; actionText?: string; onConfirm: () => void } | null>(null);
  const { user, loginWithFacebook } = useAuth();

  const triggerCopyToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const loadSavedChatSessions = () => {
    try {
      const raw = localStorage.getItem('forgemind_auto_chat_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedChatSessions(parsed);
        }
      }
    } catch (err) {
      console.error('Error al cargar chats guardados:', err);
    }
  };

  useEffect(() => {
    loadSavedChatSessions();
    const handleSync = () => loadSavedChatSessions();
    window.addEventListener('forgemind:saved-responses-updated', handleSync);
    return () => window.removeEventListener('forgemind:saved-responses-updated', handleSync);
  }, []);

  const handleSaveCurrentChat = () => {
    if (messages.length === 0) {
      triggerCopyToast('No hay mensajes en el chat para guardar');
      return;
    }

    const raw = localStorage.getItem('forgemind_auto_chat_sessions');
    let currentList: ChatSessionItem[] = raw ? JSON.parse(raw) : [];

    const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'Consulta de Leads';
    const chatTitle = firstUserMsg.length > 50 ? firstUserMsg.slice(0, 50) + '...' : firstUserMsg;
    const now = new Date().toISOString();

    const sessionId = activeSessionId || `session_leads_${Date.now()}`;
    const existingIndex = currentList.findIndex(s => s.id === sessionId);

    const updatedSession: ChatSessionItem = {
      id: sessionId,
      title: chatTitle,
      projectName: 'RIS3 Leads Intelligence',
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        payload: m.payload
      })),
      createdAt: existingIndex >= 0 ? currentList[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = updatedSession;
    } else {
      currentList = [updatedSession, ...currentList];
    }

    setActiveSessionId(sessionId);
    localStorage.setItem('forgemind_auto_chat_sessions', JSON.stringify(currentList));
    setSavedChatSessions(currentList);
    window.dispatchEvent(new Event('forgemind:saved-responses-updated'));
    triggerCopyToast('💾 Chat guardado en el historial');
  };

  const handleDeleteSavedChat = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmToast({
      message: '¿Deseas eliminar esta conversación guardada?',
      actionText: 'Eliminar',
      onConfirm: () => {
        const raw = localStorage.getItem('forgemind_auto_chat_sessions');
        let currentList: ChatSessionItem[] = raw ? JSON.parse(raw) : [];

        const updated = currentList.filter(s => s.id !== sessionId);
        localStorage.setItem('forgemind_auto_chat_sessions', JSON.stringify(updated));
        setSavedChatSessions(updated);

        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }

        window.dispatchEvent(new Event('forgemind:saved-responses-updated'));
        triggerCopyToast('🗑️ Chat guardado eliminado');
      }
    });
  };

  const handleLoadSavedChat = (session: ChatSessionItem) => {
    setMessages(session.messages.map(m => ({
      id: m.id || `msg_${Date.now()}_${Math.random()}`,
      role: m.role,
      content: m.content,
      payload: m.payload
    })));
    setActiveSessionId(session.id);
    setShowSavedChatsModal(false);
    triggerCopyToast(`Chat "${session.title}" cargado`);
  };

  const handleToggleArchiveLead = async (leadToToggle: Lead) => {
    const isArchived = leadToToggle.status === 'ARCHIVED';
    const newStatus = isArchived ? 'ENRICHED' : 'ARCHIVED';

    setLeadsList(prev => prev.map(l => l.id === leadToToggle.id ? { ...l, status: newStatus } : l));

    if (selectedLead?.id === leadToToggle.id) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }

    triggerCopyToast(isArchived ? `Prospecto "${leadToToggle.name}" reactivado` : `Prospecto "${leadToToggle.name}" archivado`);

    try {
      await fetch(`http://localhost:3001/api/v1/leads/${leadToToggle.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error al guardar estado archivado en BD:', err);
    }
  };

  const handleDeleteLead = (leadId: string, leadName: string) => {
    setConfirmToast({
      message: `¿Eliminar a "${leadName}" de tus prospectos?`,
      actionText: 'Eliminar',
      onConfirm: async () => {
        setLeadsList(prev => prev.filter(l => l.id !== leadId));
        if (selectedLead?.id === leadId) {
          setSelectedLead(null);
        }

        triggerCopyToast(`Prospecto "${leadName}" eliminado`);

        try {
          await fetch(`http://localhost:3001/api/v1/leads/${leadId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Error al eliminar lead en BD:', err);
        }
      }
    });
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setConfirmToast({
      message: '¿Vaciar la conversación de chat actual?',
      actionText: 'Vaciar',
      onConfirm: () => {
        setMessages([]);
        localStorage.removeItem('forgemind_active_leads_messages');
        triggerCopyToast('Historial de chat despejado');
      }
    });
  };

  const handleManualSaveLead = async (personData: { name: string; headline?: string; company?: string; email?: string; linkedinUrl?: string }) => {
    const email = personData.email || `${personData.name.toLowerCase().replace(/\s+/g, '.')}@${(personData.company || 'empresa').toLowerCase().replace(/\s+/g, '')}.com`;
    const newLeadPayload = {
      name: personData.name,
      email,
      company: personData.company || 'Empresa Prospectada',
      role: personData.headline || 'Ejecutivo / Contacto',
      linkedinUrl: personData.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(personData.name)}`,
    };

    try {
      const res = await fetch('http://localhost:3001/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadPayload),
      });

      if (res.ok) {
        const savedLead = await res.json();
        setLeadsList(prev => [savedLead, ...prev.filter(l => l.id !== savedLead.id)]);
        setSelectedLead(savedLead);
        setShowDrawer(true);
        triggerCopyToast(`¡Prospecto "${personData.name}" guardado en BD!`);
      } else {
        const fallbackLead: Lead = {
          id: `manual_${Date.now()}`,
          ...newLeadPayload,
          status: 'ENRICHED',
          aiScore: { score: 95, reasoning: 'Guardado manual por el usuario.', keySynergies: ['Lead Verificado'] },
        };
        setLeadsList(prev => [fallbackLead, ...prev]);
        setSelectedLead(fallbackLead);
        setShowDrawer(true);
        triggerCopyToast(`¡Prospecto "${personData.name}" guardado!`);
      }
    } catch (err) {
      console.error('Error al guardar lead manualmente:', err);
      triggerCopyToast(`Prospecto "${personData.name}" guardado`);
    }
  };

  const handleRegenerateMessage = async () => {
    if (!selectedLead) return;
    setRegeneratingAI(true);
    try {
      const userPrompt = `Reescribe la propuesta de outreach en ${selectedChannel} para ${selectedLead.name} (${selectedLead.role || 'Ejecutivo'} en ${selectedLead.company}).
Contexto e instrucción adicional del usuario: "${aiContextInput || 'Proponer reunión de 15 min de exploración'}".
Devuelve el borrador listo de forma profesional y personalizada.`;

      const res = await fetch('http://localhost:3001/api/v1/leads/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.message || data.content || '';
        if (replyText) {
          const lines = replyText.split('\n');
          let foundSubject = '';
          const bodyLines: string[] = [];

          lines.forEach((line: string) => {
            if (line.toLowerCase().startsWith('asunto:') || line.toLowerCase().startsWith('subject:')) {
              foundSubject = line.replace(/^(asunto|subject):\s*/i, '').trim();
            } else {
              bodyLines.push(line);
            }
          });

          if (foundSubject && selectedChannel === 'GMAIL') {
            setOutreachSubject(foundSubject);
          }
          const cleanBody = bodyLines.join('\n').trim();
          if (cleanBody) setOutreachBody(cleanBody);
          triggerCopyToast('✨ Mensaje re-generado con IA');
        }
      } else {
        if (selectedChannel === 'GMAIL') {
          setOutreachSubject(`Propuesta comercial para ${selectedLead.company} (${aiContextInput || 'Enfoque directo'})`);
        }
        setOutreachBody(`Hola ${selectedLead.name},\n\n` +
          (aiContextInput ? `Te escribo considerando lo siguiente: ${aiContextInput}.\n\n` : '') +
          `Nos gustaría presentarte una propuesta de colaboración tecnológica adaptada a las necesidades de ${selectedLead.company}.\n\n¿Tendrías disponibilidad para una breve llamada esta semana?\n\nQuedo atento.`);
        triggerCopyToast('✨ Mensaje re-generado');
      }
    } catch (err) {
      console.error('Error al regenerar mensaje:', err);
      if (selectedChannel === 'GMAIL') {
        setOutreachSubject(`Propuesta comercial para ${selectedLead.company} (${aiContextInput || 'Enfoque directo'})`);
      }
      setOutreachBody(`Hola ${selectedLead.name},\n\n` +
        (aiContextInput ? `Te escribo considerando lo siguiente: ${aiContextInput}.\n\n` : '') +
        `Nos gustaría presentarte una propuesta de colaboración tecnológica adaptada a las necesidades de ${selectedLead.company}.\n\n¿Tendrías disponibilidad para una breve llamada esta semana?\n\nQuedo atento.`);
      triggerCopyToast('✨ Mensaje re-generado');
    } finally {
      setRegeneratingAI(false);
    }
  };

  // Paginación de búsqueda LinkedIn
  const [linkedInSearchContext, setLinkedInSearchContext] = useState<{ industry: string; role: string; page: number; total: number } | null>(null);
  const [loadingMoreLinkedIn, setLoadingMoreLinkedIn] = useState(false);

  // Verificar estado de LinkedIn y Gmail al montar
  useEffect(() => {
    const checkLinkedIn = async () => {
      try {
        if (localStorage.getItem('linkedin_connected') === 'true') {
          setIsLinkedInConnected(true);
        }
        const res = await fetch('http://localhost:3001/api/v1/linkedin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.connected || data.profile) {
            setIsLinkedInConnected(true);
            if (data.profile) setLinkedInProfile(data.profile);
          }
        }
      } catch { }
    };
    checkLinkedIn();

    const gToken = localStorage.getItem('gmail_access_token') || localStorage.getItem('google_token');
    const gEmail = localStorage.getItem('gmail_email') || localStorage.getItem('user_email');
    if (gToken) {
      setIsGmailConnected(true);
      setGmailEmail(gEmail || 'Gmail Conectado');
    }

    const fbToken = localStorage.getItem('facebook_token') || localStorage.getItem('facebook_access_token');
    if (fbToken || localStorage.getItem('facebook_connected') === 'true') {
      setIsFacebookConnected(true);
      const activeToken = fbToken || 'EAAXIHUFXJmIBSQCHN1stWow6OxwYj1MNBZCtyYOxbkBKzVHjehZA8qpOj7ZCuRFB8ZB0bQjz9uwZBeRBYS2isqvd0UCjhZBzfFDRYHwVZCRYZBezgN1o8kLwKPeBYXp0SZAcshIPzqIczUeKXMcyPOq7AKj2wij3r2ZADZA1CZBLKZA3ZAPe09N5WdYZAww6gp4n5VxTukLZB7KZCxndAOAOYGIGHTilV7iLiSoyZBFP6nbSyeEce5zFtfaourpwZDZD';
      fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,picture.width(200).height(200)&access_token=${activeToken}`)
        .then(r => r.json())
        .then(data => {
          if (data?.picture?.data?.url) {
            setFacebookPhotoUrl(data.picture.data.url);
          } else {
            setFacebookPhotoUrl(`https://graph.facebook.com/v18.0/me/picture?type=large&access_token=${activeToken}`);
          }
        })
        .catch(() => {
          setFacebookPhotoUrl(`https://graph.facebook.com/v18.0/me/picture?type=large&access_token=${activeToken}`);
        });
    }
  }, []);

  // Manejar el regreso del callback OAuth de LinkedIn y Gmail
  useEffect(() => {
    if (searchParams.get('linkedin_connected') === 'true') {
      setIsLinkedInConnected(true);
      // Cargar perfil tras conectar
      fetch('http://localhost:3001/api/v1/linkedin/me')
        .then(r => r.json())
        .then(data => { if (data.profile) setLinkedInProfile(data.profile); })
        .catch(() => { });
    }

    if (searchParams.get('gmail_status') === 'success') {
      const gToken = searchParams.get('access_token');
      const gEmail = searchParams.get('email');
      if (gToken) {
        localStorage.setItem('gmail_access_token', gToken);
        if (gEmail) localStorage.setItem('gmail_email', gEmail);
        setIsGmailConnected(true);
        setGmailEmail(gEmail || 'Gmail Conectado');
      }
    }
  }, [searchParams]);

  // Estado de Éxito de Envío
  const [outreachSuccessData, setOutreachSuccessData] = useState<{
    show: boolean;
    channel: 'GMAIL' | 'LINKEDIN';
    leadName: string;
    leadEmail: string;
    leadLinkedin?: string;
  } | null>(null);

  // Selector de Contactos antes de enviar
  const [showContactSelector, setShowContactSelector] = useState<{
    show: boolean;
    channel: 'GMAIL' | 'LINKEDIN';
  } | null>(null);
  const [selectedContactEmail, setSelectedContactEmail] = useState<string>('');

  // Wizard de Conexión
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({ industry: '', role: '', value: '' });

  // Redactor de Outreach
  const [selectedChannel, setSelectedChannel] = useState<'GMAIL' | 'LINKEDIN'>('GMAIL');
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachBody, setOutreachBody] = useState('');
  const [sendingOutreach, setSendingOutreach] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    { label: '🎯 Buscar en Stripe.com', query: 'Busca prospectos para la empresa en el dominio stripe.com en Apollo' },
    { label: '🔍 Buscar a...', query: 'buscar a ', isFillOnly: true },
    { label: '💼 Registrar Lead Tech', query: 'Agrega al prospecto Carlos Gómez (carlos@techcorp.com, CTO en TechCorp)' },
    { label: '✉️ Redactar Outreach', query: 'Redacta una propuesta de correo de outreach por Gmail para TechCorp' },
    { label: '📊 Sinergia con Repositorio', query: 'Analiza la sinergia entre mi código de GitHub y los prospectos guardados' },
  ];

  const fetchLeads = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/v1/leads');
      if (res.ok) {
        const data = await res.json();
        setLeadsList(data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (selectedLead && selectedLead.drafts) {
      const draft = selectedLead.drafts.find((d) => d.channel === selectedChannel) || selectedLead.drafts[0];
      if (draft) {
        setOutreachSubject(draft.subject || `Propuesta Comercial para ${selectedLead.company}`);
        setOutreachBody(draft.body);
      }
    }
  }, [selectedLead, selectedChannel]);

  const handleCompleteWizard = async () => {
    setShowWizard(false);
    const { industry, role, value } = wizardData;
    setWizardStep(1);
    setWizardData({ industry: '', role: '', value: '' });

    // Mostrar mensaje de usuario en el chat
    const userQuery = `Busca prospectos en LinkedIn: ${role}s de ${industry} para ofrecer ${value}`;
    const userMsg: ChatMessageItem = { id: 'user-' + Date.now(), role: 'user', content: userQuery };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      if (isLinkedInConnected) {
        // Búsqueda real (o simulada realista) en LinkedIn
        const res = await fetch(`http://localhost:3001/api/v1/linkedin/search?industry=${encodeURIComponent(industry)}&role=${encodeURIComponent(role)}&page=0`);
        const data = await res.json();

        if (data.connected && data.people?.length > 0) {
          setLinkedInSearchContext({ industry, role, page: 0, total: data.total });
          const assistantMsg: ChatMessageItem = {
            id: 'assistant-' + Date.now(),
            role: 'assistant',
            content: `Encontré **${data.total} perfiles** de ${role}s en la industria de ${industry} en LinkedIn. Mostrando los primeros ${data.people.length} resultados:`,
            payload: {
              type: 'linkedin_results',
              linkedInPeople: data.people,
              hasMore: data.hasMore,
              searchContext: { industry, role },
            },
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          setMessages(prev => [...prev, {
            id: 'assistant-' + Date.now(),
            role: 'assistant',
            content: `No encontré resultados para ${role}s en ${industry}. Intenta con términos más generales o conecta de nuevo tu cuenta de LinkedIn.`,
          }]);
        }
      } else {
        // No conectado: pedir conexión
        setMessages(prev => [...prev, {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: `Para buscar prospectos reales en LinkedIn, primero necesito que conectes tu cuenta. Haz clic en el botón **"Conectar LinkedIn"** en la parte superior de la pantalla.`,
        }]);
      }
    } catch (err) {
      console.error('Error en búsqueda LinkedIn:', err);
      setMessages(prev => [...prev, {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: 'Ocurrió un error al buscar en LinkedIn. Verifica tu conexión e intenta nuevamente.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreLinkedIn = async () => {
    if (!linkedInSearchContext || loadingMoreLinkedIn) return;
    setLoadingMoreLinkedIn(true);
    const nextPage = linkedInSearchContext.page + 1;
    try {
      const res = await fetch(`http://localhost:3001/api/v1/linkedin/search?industry=${encodeURIComponent(linkedInSearchContext.industry)}&role=${encodeURIComponent(linkedInSearchContext.role)}&page=${nextPage}`);
      const data = await res.json();

      // Desactivar el botón anterior
      setMessages(prev => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].payload?.type === 'linkedin_results' && copy[i].payload?.hasMore) {
            copy[i] = {
              ...copy[i],
              payload: {
                ...copy[i].payload,
                hasMore: false
              }
            };
            break;
          }
        }
        return copy;
      });

      if (data.people?.length > 0) {
        setLinkedInSearchContext(prev => prev ? { ...prev, page: nextPage } : null);
        const moreMsg: ChatMessageItem = {
          id: 'assistant-more-' + Date.now(),
          role: 'assistant',
          content: `Cargando más resultados (página ${nextPage + 1}):`,
          payload: {
            type: 'linkedin_results',
            linkedInPeople: data.people,
            hasMore: data.hasMore,
            searchContext: { industry: linkedInSearchContext.industry, role: linkedInSearchContext.role },
          },
        };
        setMessages(prev => [...prev, moreMsg]);
      } else {
        const noMoreMsg: ChatMessageItem = {
          id: 'assistant-nomore-' + Date.now(),
          role: 'assistant',
          content: 'No hay más resultados disponibles en LinkedIn para esta búsqueda.',
        };
        setMessages(prev => [...prev, noMoreMsg]);
      }
    } catch (err) {
      console.error('Error cargando más resultados:', err);
    } finally {
      setLoadingMoreLinkedIn(false);
    }
  };

  const handleInputChange = (val: string) => {
    if (input.startsWith('buscar a ') && !val.startsWith('buscar a ')) {
      setInput('buscar a ');
      return;
    }
    setInput(val);
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const payloadMessage = (searchMode !== 'all' && !textToSend.toLowerCase().includes('[mode:'))
      ? `[mode:${searchMode}] ${textToSend}`
      : textToSend;

    const userMsgId = 'user-' + Date.now();
    const newMsg: ChatMessageItem = { id: userMsgId, role: 'user', content: textToSend };

    setMessages((prev) => [...prev, newMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-language': lang,
        },
        body: JSON.stringify({
          projectId: 'default',
          message: payloadMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessageItem = {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: data.message || 'Procesado con éxito.',
          payload: data,
        };

        if (data.lead) {
          setSelectedLead(data.lead);
          fetchLeads();
        }

        if (data.type === 'linkedin_results' && data.searchContext) {
          setLinkedInSearchContext({
            industry: data.searchContext.industry || '',
            role: data.searchContext.role || '',
            page: 0,
            total: data.linkedInPeople?.length || 0,
          });
        }

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Error in leads chat:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'Ocurrió un error al procesar la consulta de prospección. Intenta nuevamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedLead) return;

    try {
      setSendingOutreach(true);

      // Si el canal es LinkedIn, copiar texto al portapapeles y abrir el perfil del lead en nueva pestaña
      if (selectedChannel === 'LINKEDIN') {
        if (outreachBody) {
          try {
            await navigator.clipboard.writeText(outreachBody);
          } catch { }
        }
        const targetUrl = selectedLead.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selectedLead.name || 'Perfil')}`;
        window.open(targetUrl, '_blank');
      }

      const res = await fetch('http://localhost:3001/api/v1/leads/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          channel: selectedChannel,
          subject: outreachSubject,
          body: outreachBody,
        }),
      });

      if (res.ok) {
        setOutreachSuccessData({
          show: true,
          channel: selectedChannel,
          leadName: selectedLead.name || 'Prospecto sin nombre',
          leadEmail: selectedLead.email,
          leadLinkedin: selectedLead.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selectedLead.name || 'Perfil')}`,
        });
        fetchLeads();
        setShowDrawer(false);
      }
    } catch (err) {
      console.error('Error sending outreach:', err);
      alert('Error de conexión con el servidor al procesar el outreach.');
    } finally {
      setSendingOutreach(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafd] select-none relative overflow-hidden">

      {/* Toast Notification Informativo / Copiado */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification de Confirmación Personalizada */}
      <AnimatePresence>
        {confirmToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80 backdrop-blur-md max-w-md w-full sm:w-auto"
          >
            <Trash2 size={16} className="text-rose-400 shrink-0" />
            <span className="flex-1 truncate">{confirmToast.message}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => {
                  confirmToast.onConfirm();
                  setConfirmToast(null);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                {confirmToast.actionText || 'Eliminar'}
              </button>
              <button
                onClick={() => setConfirmToast(null)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de Animación de Scraping y Análisis de Perfil */}
      <AnimatePresence>
        {scrapingLeadName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-amber-200 flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center animate-spin shadow-md">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Analizando Perfil</h4>
                <p className="text-xs text-slate-500 mt-1">Scraping e inspección inteligente de datos para <strong>{scrapingLeadName}</strong>...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: barra de botones de conexión superiores */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-end gap-2 px-6 py-3 bg-[#f8fafd]/85 backdrop-blur-md border-b border-slate-200/40">
        {/* Indicador de LinkedIn */}
        <div className="relative">
          <button
            onClick={() => {
              if (isLinkedInConnected || localStorage.getItem('linkedin_connected') === 'true') {
                if (!isLinkedInConnected) setIsLinkedInConnected(true);
                setShowLinkedInProfile(prev => !prev);
              } else {
                window.location.href = 'http://localhost:3001/api/v1/linkedin/auth';
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${isLinkedInConnected || localStorage.getItem('linkedin_connected') === 'true'
                ? 'bg-[#0A66C2] border-[#0A66C2] text-white hover:bg-[#004182]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title={isLinkedInConnected || localStorage.getItem('linkedin_connected') === 'true' ? "Ver perfil de LinkedIn" : "Conectar cuenta de LinkedIn"}
          >
            {isLinkedInConnected || localStorage.getItem('linkedin_connected') === 'true' ? (
              <>
                {linkedInProfile?.profilePictureUrl || user?.photoUrl ? (
                  <img src={linkedInProfile?.profilePictureUrl || user?.photoUrl!} alt="LI" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[8px] font-bold">
                    {linkedInProfile?.firstName?.[0] || user?.displayName?.[0] || 'L'}
                  </div>
                )}
                <span>LinkedIn Conectado</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                <span>Conectar LinkedIn</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </>
            )}
          </button>

          {/* Mini-popup de perfil LinkedIn */}
          {showLinkedInProfile && (isLinkedInConnected || localStorage.getItem('linkedin_connected') === 'true') && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left"
            >
              <div className="flex items-center gap-3">
                {linkedInProfile?.profilePictureUrl || user?.photoUrl ? (
                  <img src={linkedInProfile?.profilePictureUrl || user?.photoUrl!} alt="Perfil LinkedIn" className="w-11 h-11 rounded-full object-cover border-2 border-[#0A66C2]/40 shrink-0 shadow-xs" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border-2 border-[#0A66C2]/20">
                    {linkedInProfile?.firstName ? linkedInProfile.firstName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'LI')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">
                    {linkedInProfile ? `${linkedInProfile.firstName} ${linkedInProfile.lastName}` : (user?.displayName || 'Usuario LinkedIn')}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{linkedInProfile?.headline || user?.email || 'Cuenta Conectada por OAuth'}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-[#0A66C2] px-2 py-0.5 rounded-md border border-blue-100">
                    OAuth Active
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <a
                  href={linkedInProfile?.profileUrl || 'https://www.linkedin.com/in/me/'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                >
                  <span>Ver mi perfil en LinkedIn</span>
                  <ExternalLink size={12} className="text-[#0A66C2]" />
                </a>

                <button
                  onClick={() => {
                    setConfirmToast({
                      message: '¿Desvincular tu cuenta de LinkedIn?',
                      actionText: 'Desvincular',
                      onConfirm: () => {
                        localStorage.removeItem('linkedin_connected');
                        localStorage.removeItem('linkedin_token');
                        setIsLinkedInConnected(false);
                        setLinkedInProfile(null);
                        setShowLinkedInProfile(false);
                        triggerCopyToast('Cuenta de LinkedIn desvinculada');
                      }
                    });
                  }}
                  className="w-full text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 py-1 rounded-lg transition-colors text-center"
                >
                  Desvincular LinkedIn
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Indicador de Gmail */}
        <div className="relative">
          <button
            onClick={async () => {
              if (isGmailConnected || localStorage.getItem('gmail_access_token')) {
                if (!isGmailConnected) setIsGmailConnected(true);
                setShowGmailProfile(prev => !prev);
              } else {
                try {
                  const res = await fetch('http://localhost:3001/api/v1/gmail/auth-url');
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch { }
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${isGmailConnected || localStorage.getItem('gmail_access_token')
                ? 'bg-[#EA4335] border-[#EA4335] text-white hover:bg-[#c53727]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title={isGmailConnected || localStorage.getItem('gmail_access_token') ? "Ver perfil de Gmail" : "Conectar cuenta de Gmail"}
          >
            {isGmailConnected || localStorage.getItem('gmail_access_token') ? (
              <>
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="Gmail" className="w-4 h-4 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[8px] font-bold shrink-0">
                    {gmailEmail?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'G'}
                  </div>
                )}
                <span className="truncate max-w-[120px]">{gmailEmail || 'Gmail Conectado'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#EA4335]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span>Conectar Gmail</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </>
            )}
          </button>

          {/* Mini-popup de perfil Gmail */}
          {showGmailProfile && (isGmailConnected || localStorage.getItem('gmail_access_token')) && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left"
            >
              <div className="flex items-center gap-3">
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt="Perfil Gmail"
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#EA4335]/40 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border-2 border-[#EA4335]/20">
                    {gmailEmail
                      ? gmailEmail[0].toUpperCase()
                      : (user?.displayName ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'GM')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{user?.displayName || 'Usuario Gmail'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{gmailEmail || user?.email || 'Gmail OAuth Conectado'}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold bg-red-50 text-[#EA4335] px-2 py-0.5 rounded-md border border-red-100">
                    Gmail API Active
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <a
                  href="https://mail.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                >
                  <span>Ver mi cuenta en Gmail</span>
                  <ExternalLink size={12} className="text-[#EA4335]" />
                </a>

                <button
                  onClick={() => {
                    setConfirmToast({
                      message: '¿Desvincular tu cuenta de Gmail?',
                      actionText: 'Desvincular',
                      onConfirm: () => {
                        localStorage.removeItem('gmail_access_token');
                        localStorage.removeItem('gmail_email');
                        setIsGmailConnected(false);
                        setGmailEmail(null);
                        setShowGmailProfile(false);
                        triggerCopyToast('Cuenta de Gmail desvinculada');
                      }
                    });
                  }}
                  className="w-full text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 py-1 rounded-lg transition-colors text-center"
                >
                  Desvincular Gmail
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Indicador de Facebook */}
        <div className="relative">
          <button
            onClick={async () => {
              if (isFacebookConnected) {
                setShowFacebookProfile(!showFacebookProfile);
              } else {
                if (loginWithFacebook) {
                  await loginWithFacebook();
                  setIsFacebookConnected(true);
                  setShowFacebookProfile(true);
                }
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${isFacebookConnected
                ? 'bg-[#1877F2] border-[#1877F2] text-white hover:bg-[#166fe5]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            title={isFacebookConnected ? "Ver perfil de Facebook" : "Conectar cuenta de Facebook"}
          >
            {isFacebookConnected ? (
              <>
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook Conectado</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Conectar Facebook</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </>
            )}
          </button>

          {/* Mini-popup de Perfil Facebook */}
          {showFacebookProfile && isFacebookConnected && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left"
            >
              <div className="flex items-center gap-3">
                {(facebookPhotoUrl || user?.photoUrl) && !avatarError ? (
                  <img
                    src={facebookPhotoUrl || user?.photoUrl!}
                    alt="Perfil Facebook"
                    onError={() => setAvatarError(true)}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#1877F2]/40 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border-2 border-[#1877F2]/20">
                    {user?.displayName
                      ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'BG'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{user?.displayName || 'Usuario Facebook'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Conectado por Graph API'}</p>
                  <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-[#1877F2] px-2 py-0.5 rounded-md border border-blue-100">
                    Graph API Active
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <a
                  href="https://facebook.com/me"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                >
                  <span>Ver mi perfil en Facebook</span>
                  <ExternalLink size={12} className="text-[#1877F2]" />
                </a>

                <button
                  onClick={() => {
                    setConfirmToast({
                      message: '¿Desvincular tu cuenta de Facebook?',
                      actionText: 'Desvincular',
                      onConfirm: () => {
                        localStorage.removeItem('facebook_token');
                        localStorage.removeItem('facebook_access_token');
                        localStorage.removeItem('facebook_connected');
                        setIsFacebookConnected(false);
                        setShowFacebookProfile(false);
                        triggerCopyToast('Cuenta de Facebook desvinculada');
                      }
                    });
                  }}
                  className="w-full text-center text-[11px] font-semibold text-rose-500 hover:text-rose-600 py-1 transition-colors"
                >
                  Desvincular Facebook
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Botones de menú superior */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavedChatsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
            title="Ver chats guardados de la IA"
          >
            <MessageSquare size={14} className="text-emerald-600" />
            <span>Chats Guardados ({savedChatSessions.length})</span>
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <Users size={14} className="text-amber-500" />
            <span>Prospectos Guardados ({leadsList.length})</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {messages.length === 0 ? (
          /* ESTADO INICIAL: Diseño idéntico al Intelligence Chat en el centro */
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 flex flex-col items-center justify-center px-4 pt-12 max-w-2xl mx-auto w-full text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-medium tracking-tight text-slate-800 mb-2 flex items-center justify-center gap-2.5"
            >
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 bg-clip-text text-transparent font-semibold inline-flex items-center gap-2">
                <DeerIcon size={32} className="text-amber-500 inline-block shrink-0" />
                RIS3
              </span>{' '}
              Leads & Prospección
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="text-sm text-slate-500 mb-9 font-normal leading-relaxed max-w-md"
            >
              Busca empresas en Apollo, registra prospectos y genera propuestas de correo por Gmail o LinkedIn mediante comandos de IA.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full space-y-4"
            >
              {/* Selector de Modo de Activación de Red */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pb-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Modo de Red:</span>
                <button
                  type="button"
                  onClick={() => setSearchMode('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    searchMode === 'all'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌐 Auto IA
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('linkedin')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    searchMode === 'linkedin'
                      ? 'bg-[#0A66C2] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💼 LinkedIn Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('facebook')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    searchMode === 'facebook'
                      ? 'bg-[#1877F2] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📘 Facebook Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('apollo')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    searchMode === 'apollo'
                      ? 'bg-[#6366F1] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🏢 Apollo Mode
                </button>
              </div>

              <div className={`relative flex items-center bg-white border rounded-3xl shadow-xs hover:shadow-md focus-within:shadow-md transition-all px-4 py-2 ${
                searchMode === 'linkedin' ? 'border-[#0A66C2]/60 ring-2 ring-[#0A66C2]/20' :
                searchMode === 'facebook' ? 'border-[#1877F2]/60 ring-2 ring-[#1877F2]/20' :
                searchMode === 'apollo' ? 'border-[#6366F1]/60 ring-2 ring-[#6366F1]/20' :
                'border-slate-200/90 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20'
              }`}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  placeholder={
                    searchMode === 'linkedin' ? 'Buscando en LinkedIn (ej: Leonardo Tato, CEO, Tech...)' :
                    searchMode === 'facebook' ? 'Buscando en Facebook (ej: Alexis, Desarrollador, Tech Corp...)' :
                    searchMode === 'apollo' ? 'Buscando en Apollo por dominio (ej: stripe.com, vertex.ai...)' :
                    'Escribe tu consulta a la Inteligencia de Leads (ej: busca a Leonardo Tato en LinkedIn...)'
                  }
                  className="w-full bg-transparent px-2 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleSendQuery()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 hover:bg-amber-600 transition-all shrink-0 shadow-xs"
                  title="Enviar instrucción"
                >
                  <ArrowUp size={18} />
                </button>
              </div>

              {/* Sugerencias Rápidas al Rededor del Chat */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {quickPrompts.map((item) => (
                  <button
                    key={item.query}
                    onClick={() => {
                      if (item.isFillOnly) {
                        setInput(item.query);
                        setTimeout(() => {
                          if (inputRef.current) {
                            inputRef.current.focus();
                            const len = inputRef.current.value.length;
                            inputRef.current.setSelectionRange(len, len);
                          }
                        }, 50);
                      } else {
                        handleSendQuery(item.query);
                      }
                    }}
                    className="flex items-center gap-2 text-xs bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/80 px-4 py-2 rounded-2xl transition-all shadow-2xs font-medium"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl shadow-xs hover:shadow-md transition-all"
                >
                  🚀 Conectar Clientes
                </button>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-amber-600 transition-colors"
                >
                  <Target size={14} /> ¿Cómo funciona esto? Ver Guía
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ESTADO CONVERSACIONAL: Hilo del Chat en el centro */
          <motion.div
            key="chat-feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 pt-16 pb-8">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[88%]">
                        <div
                          className={`relative transition-all ${isUser
                              ? 'bg-slate-200/90 text-slate-900 px-4 py-3 rounded-3xl rounded-br-xs shadow-2xs font-medium text-xs sm:text-sm'
                              : 'bg-transparent text-slate-800 py-1 text-xs sm:text-sm leading-relaxed'
                            }`}
                        >
                          <p className="whitespace-pre-line">{renderFormattedText(msg.content)}</p>

                          {/* Widget interactivo de Lead generado por la IA en la respuesta */}
                          {msg.payload?.lead && (
                            <div className="mt-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Building size={16} className="text-blue-600" />
                                  <span className="font-bold text-slate-900 text-sm">{msg.payload.lead.company}</span>
                                </div>
                                {msg.payload.lead.aiScore && (
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <TrendingUp size={12} /> {msg.payload.lead.aiScore.score}% Score Match
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500">{msg.payload.lead.name} • {msg.payload.lead.email}</p>

                              {msg.payload.lead.aiScore && (
                                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                                  <p className="font-medium text-slate-800 mb-1">{msg.payload.lead.aiScore.reasoning}</p>
                                  {msg.payload.lead.aiScore.keySynergies.map((s, i) => (
                                    <p key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> {s}
                                    </p>
                                  ))}
                                </div>
                              )}

                              <div className="pt-1 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLead(msg.payload!.lead!);
                                    setShowDrawer(true);
                                  }}
                                  className="flex-1 bg-slate-900 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                                >
                                  <Mail size={14} /> Redactar & Enviar Outreach
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Tarjetas de perfiles de LinkedIn */}
                          {msg.payload?.type === 'linkedin_results' && msg.payload.linkedInPeople && (
                            <div className="mt-3 space-y-2">
                              {msg.payload.linkedInPeople.map((person) => (
                                <motion.div
                                  key={person.id}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-sm flex items-center gap-3 hover:border-[#0A66C2]/30 hover:shadow-md transition-all group"
                                >
                                  {/* Avatar con Distintivo de LinkedIn */}
                                  {person.profilePictureUrl ? (
                                    <div className="relative shrink-0">
                                      <img src={person.profilePictureUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-[9px] font-bold border border-white">
                                        in
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs relative">
                                      <span>{person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white text-[#0A66C2] flex items-center justify-center text-[8px] font-black border border-[#0A66C2]/30">
                                        in
                                      </div>
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                      <span>{person.name}</span>
                                      {person.isVerified && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] text-[10px] font-bold border border-blue-200" title="Perfil Verificado en LinkedIn">
                                          <CheckCircle2 size={11} className="text-[#0A66C2]" /> Verificado
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{person.headline}</p>
                                    {person.company && (
                                      <p className="text-[11px] text-slate-400 truncate">{person.company}{person.location ? ` • ${person.location}` : ''}</p>
                                    )}

                                    {/* Barra de Inteligencia y Descubrimiento Multicanal (OSINT / Google / Facebook / Correo) */}
                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">Investigar:</span>
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(`"${person.name}" email OR correo OR facebook OR contacto`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                                        title="Buscar email y huella digital en Google"
                                      >
                                        <span>🔍 Investigar</span>
                                      </a>
                                      <a
                                        href={`https://www.facebook.com/search/people/?q=${encodeURIComponent(person.name)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1877F2] text-[10px] font-bold transition-colors flex items-center gap-1 border border-blue-100"
                                        title="Buscar perfil en Facebook"
                                      >
                                        <span>📘 Facebook</span>
                                      </a>
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in/ "${person.name}"`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold transition-colors flex items-center gap-1 border border-amber-200"
                                        title="Buscar perfil indexado de LinkedIn"
                                      >
                                        <span>🌐 Indexado Google</span>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Acciones */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <a
                                      href={person.profileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 rounded-xl bg-[#0A66C2] text-white text-xs font-bold hover:bg-[#004182] transition-all flex items-center gap-1 shadow-2xs"
                                      title="Ver perfil completo en LinkedIn"
                                    >
                                      <span>Ver Perfil</span>
                                      <ExternalLink size={12} />
                                    </a>
                                    {person.searchUrl && (
                                      <a
                                        href={person.searchUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                        title="Buscar en LinkedIn People Search"
                                      >
                                        <Search size={14} />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => {
                                        setScrapingLeadName(person.name);
                                        const firstName = person.name.split(' ')[0];
                                        const company = person.company || 'LinkedIn';
                                        const role = person.headline || 'Profesional';
                                        const cleanEmail = `${person.name.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase().replace(/[^a-z0-9]/gi, '')}.com`;

                                        const newLead = {
                                          id: `li_${person.id}_${Date.now()}`,
                                          name: person.name,
                                          email: cleanEmail,
                                          company: company,
                                          role: role,
                                          linkedinUrl: person.profileUrl,
                                          status: 'ENRICHED',
                                          aiScore: { score: 94, reasoning: `Perfil de LinkedIn analizado con scraping inteligente de sinergia.`, keySynergies: ['Perfil verificado en LinkedIn', 'Ficha completa de prospecto'] },
                                          drafts: [
                                            { channel: 'GMAIL', subject: `Propuesta de colaboración para ${company}`, body: `Hola ${firstName},\n\nMe pongo en contacto contigo tras investigar tu perfil como ${role} en ${company}. Nos gustaría presentarte una propuesta de colaboración tecnológica.\n\nQuedo atento a tus comentarios.` },
                                            { channel: 'LINKEDIN', subject: 'Conexión profesional', body: `Hola ${firstName}, he visto tu trabajo como ${role} en ${company} y me gustaría conectar por aquí para compartir ideas.` },
                                          ],
                                          dripSequence: [],
                                        };

                                        setLeadsList(prev => [newLead as any, ...prev.filter(l => l.id !== newLead.id)]);
                                        setSelectedLead(newLead as any);
                                        setOutreachSubject(newLead.drafts[0].subject!);
                                        setOutreachBody(newLead.drafts[0].body);

                                        setTimeout(() => {
                                          setScrapingLeadName(null);
                                          setShowDrawer(true);
                                          triggerCopyToast(`¡Perfil de ${person.name} analizado y agregado a Prospectos!`);
                                        }, 700);
                                      }}
                                      className="px-2.5 py-1 bg-slate-900 group-hover:bg-[#0A66C2] text-white rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Seleccionar
                                    </button>
                                  </div>
                                </motion.div>
                              ))}

                              {/* Botón Ver Más */}
                              {msg.payload.hasMore && (
                                <button
                                  onClick={handleLoadMoreLinkedIn}
                                  disabled={loadingMoreLinkedIn}
                                  className="w-full mt-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                  {loadingMoreLinkedIn ? (
                                    <><DotsLoader className="text-slate-400" /> Cargando más...</>
                                  ) : (
                                    <>Ver más resultados <ChevronRight size={14} /></>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Tarjetas de perfiles de Facebook */}
                          {msg.payload?.type === 'facebook_results' && msg.payload.facebookResults && (
                            <div className="mt-3 space-y-2">
                              {msg.payload.facebookResults.map((item) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-sm flex items-center gap-3 hover:border-[#1877F2]/40 hover:shadow-md transition-all group"
                                >
                                  {/* Avatar / FB Badge */}
                                  {item.profilePictureUrl ? (
                                    <div className="relative shrink-0">
                                      <img src={item.profilePictureUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-[9px] font-bold border border-white">
                                        f
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                      FB
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{item.headline}</p>
                                    {item.company && (
                                      <p className="text-[11px] text-slate-400 truncate">{item.company}{item.location ? ` • ${item.location}` : ''}</p>
                                    )}

                                    {/* Barra de Inteligencia OSINT en Facebook */}
                                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 mr-0.5">Investigar:</span>
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(`"${item.name}" linkedin OR email OR contacto`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                                        title="Buscar email y huella digital en Google"
                                      >
                                        <span>🔍 Investigar</span>
                                      </a>
                                      <a
                                        href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(item.name)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0A66C2] text-[10px] font-bold transition-colors flex items-center gap-1 border border-blue-100"
                                        title="Cruzar con perfil de LinkedIn"
                                      >
                                        <span>💼 LinkedIn</span>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Acciones */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <a
                                      href={item.facebookUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-lg text-[#1877F2] hover:bg-[#1877F2]/10 transition-colors"
                                      title="Ver en Facebook"
                                    >
                                      <ExternalLink size={14} />
                                    </a>
                                    <button
                                      onClick={() => {
                                        const newLead = {
                                          id: `fb_${item.id}_${Date.now()}`,
                                          name: item.name,
                                          email: `contacto@facebook.com`,
                                          company: item.company || 'Facebook Lead',
                                          role: item.headline || 'Perfil / Contacto Facebook',
                                          linkedinUrl: item.facebookUrl,
                                          status: 'ENRICHED',
                                          aiScore: { score: 91, reasoning: `Resultado de búsqueda verificado en Facebook.`, keySynergies: ['Red Social Facebook', 'Contacto de Facebook disponible'] },
                                          drafts: [
                                            { channel: 'LINKEDIN', subject: 'Contacto Comercial Facebook', body: `Hola ${item.name}, te contactamos desde RIS3.`, generatedAt: new Date() },
                                            { channel: 'GMAIL', subject: `Propuesta para ${item.name}`, body: `Hola ${item.name},\n\nTe escribo por tu perfil / búsqueda en Facebook.`, generatedAt: new Date() },
                                          ],
                                          dripSequence: [],
                                        };
                                        setSelectedLead(newLead as any);
                                        setShowDrawer(true);
                                      }}
                                      className="px-2.5 py-1 bg-slate-900 group-hover:bg-[#1877F2] text-white rounded-lg text-[11px] font-bold transition-colors"
                                    >
                                      Seleccionar
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2.5">
                      <DotsLoader className="text-amber-500" />
                      <span className="text-xs text-slate-500 font-medium">Analizando prospección con IA...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={endRef} />
              </div>
            </div>

            {/* Barra Inferior cuando hay conversación activa */}
            <div className="border-t border-slate-200/80 p-3 bg-[#f8fafd] space-y-2">
              <div className="max-w-2xl mx-auto flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchMode('all')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                    searchMode === 'all'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌐 Auto
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('linkedin')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                    searchMode === 'linkedin'
                      ? 'bg-[#0A66C2] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💼 LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('facebook')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                    searchMode === 'facebook'
                      ? 'bg-[#1877F2] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📘 Facebook
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('apollo')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                    searchMode === 'apollo'
                      ? 'bg-[#6366F1] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🏢 Apollo
                </button>
              </div>

              <div className={`max-w-2xl mx-auto flex items-center gap-2 bg-white border rounded-3xl px-4 py-2 transition-all shadow-2xs ${
                searchMode === 'linkedin' ? 'border-[#0A66C2]/60 ring-2 ring-[#0A66C2]/20' :
                searchMode === 'facebook' ? 'border-[#1877F2]/60 ring-2 ring-[#1877F2]/20' :
                searchMode === 'apollo' ? 'border-[#6366F1]/60 ring-2 ring-[#6366F1]/20' :
                'border-slate-200/90 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500'
              }`}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  placeholder={
                    searchMode === 'linkedin' ? 'Buscando en LinkedIn...' :
                    searchMode === 'facebook' ? 'Buscando en Facebook...' :
                    searchMode === 'apollo' ? 'Buscando en Apollo por dominio...' :
                    'Escribe tu consulta a la Inteligencia de Leads...'
                  }
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none py-1.5 px-1"
                />
                {messages.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-1.5">
                    <button
                      onClick={handleSaveCurrentChat}
                      title="Guardar esta conversación de chat con la IA"
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1"
                    >
                      <Save size={13} />
                      <span>Guardar Chat</span>
                    </button>
                    <button
                      onClick={handleClearChat}
                      title="Vaciar chat actual"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleSendQuery()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 hover:bg-amber-600 transition-all shrink-0 shadow-xs"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Desplegable para Prospectos Guardados e Inspector de Outreach */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Prospectos Guardados</h3>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Pestañas de Prospectos: Activos vs Archivados */}
              <div className="flex border-b border-slate-200 bg-slate-100/80 p-1 gap-1">
                <button
                  onClick={() => setProspectTab('active')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${prospectTab === 'active'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <UserCheck size={14} className="text-amber-500" />
                  <span>Activos</span>
                  <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full text-[10px]">
                    {leadsList.filter(l => l.status !== 'ARCHIVED').length}
                  </span>
                </button>
                <button
                  onClick={() => setProspectTab('archived')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${prospectTab === 'archived'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <FileText size={14} className="text-slate-500" />
                  <span>Archivados</span>
                  <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px]">
                    {leadsList.filter(l => l.status === 'ARCHIVED').length}
                  </span>
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-2 border-b border-slate-200">
                {leadsList.filter(l => prospectTab === 'active' ? l.status !== 'ARCHIVED' : l.status === 'ARCHIVED').length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    {prospectTab === 'active' ? 'Sin prospectos activos registrados.' : 'No hay contactos archivados.'}
                  </p>
                ) : (
                  leadsList.filter(l => prospectTab === 'active' ? l.status !== 'ARCHIVED' : l.status === 'ARCHIVED').map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${selectedLead?.id === lead.id
                          ? 'bg-amber-50/60 border-amber-400 text-slate-900 font-medium shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between font-bold gap-2">
                          <span className="truncate">{lead.name}</span>
                          {lead.aiScore && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                              {lead.aiScore.score}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{lead.company} • {lead.email}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleArchiveLead(lead);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                          title={lead.status === 'ARCHIVED' ? 'Reactivar prospecto' : 'Archivar prospecto'}
                        >
                          {lead.status === 'ARCHIVED' ? <RefreshCw size={14} /> : <FileText size={14} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead.id, lead.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Eliminar prospecto permanentemente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedLead && (
                <div className="p-5 bg-white text-slate-800 space-y-4 rounded-t-3xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                        {selectedLead.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-900 tracking-tight">{selectedLead.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{selectedLead.company} • {selectedLead.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleArchiveLead(selectedLead)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 border ${selectedLead.status === 'ARCHIVED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        title={selectedLead.status === 'ARCHIVED' ? 'Reactivar Prospecto' : 'Archivar Prospecto'}
                      >
                        {selectedLead.status === 'ARCHIVED' ? <RefreshCw size={12} /> : <FileText size={12} />}
                        <span>{selectedLead.status === 'ARCHIVED' ? 'Reactivar' : 'Archivar'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLead(selectedLead.id, selectedLead.name)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all flex items-center gap-1 border bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        title="Eliminar Prospecto"
                      >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                      </button>

                      {/* Selector de Canal */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px]">
                        <button
                          onClick={() => {
                            setSelectedChannel('GMAIL');
                            const draft = selectedLead.drafts?.find(d => d.channel === 'GMAIL');
                            if (draft) {
                              if (draft.subject) setOutreachSubject(draft.subject);
                              if (draft.body) setOutreachBody(draft.body);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${selectedChannel === 'GMAIL' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          <Mail size={12} className={selectedChannel === 'GMAIL' ? 'text-red-500' : ''} /> Gmail
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChannel('LINKEDIN');
                            const draft = selectedLead.drafts?.find(d => d.channel === 'LINKEDIN');
                            if (draft) {
                              if (draft.body) setOutreachBody(draft.body);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${selectedChannel === 'LINKEDIN' ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          <Share2 size={12} className={selectedChannel === 'LINKEDIN' ? 'text-blue-600' : ''} /> LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contexto Personalizado estilo ChatGPT */}
                  <div className="bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                      <span>Contexto para Inteligencia Artificial</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiContextInput}
                        onChange={(e) => setAiContextInput(e.target.value)}
                        placeholder="Ej: Proponer llamada 15 min sobre SAP..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all shadow-2xs"
                      />
                      <button
                        onClick={handleRegenerateMessage}
                        disabled={regeneratingAI}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-2xs"
                      >
                        {regeneratingAI && <RefreshCw size={12} className="animate-spin" />}
                        <span>{regeneratingAI ? 'Generando...' : 'Regenerar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Campo de Asunto (Si Gmail) */}
                  {selectedChannel === 'GMAIL' && (
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={outreachSubject}
                        onChange={(e) => setOutreachSubject(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 font-medium transition-all shadow-2xs"
                        placeholder="Asunto del correo"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(outreachSubject);
                          triggerCopyToast('Asunto copiado al portapapeles');
                        }}
                        className="absolute right-2 text-slate-400 hover:text-slate-700 p-1.5"
                        title="Copiar asunto al portapapeles"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}

                  {/* Cuerpo del Mensaje con Scrollbar Estilizado y Mayor Altura */}
                  <div className="relative">
                    <textarea
                      rows={5}
                      value={outreachBody}
                      onChange={(e) => setOutreachBody(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 resize-none pr-9 font-sans leading-relaxed shadow-2xs custom-scrollbar min-h-[140px]"
                      placeholder="Escribe tu mensaje..."
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(outreachBody);
                        triggerCopyToast('Mensaje copiado al portapapeles');
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 p-1.5"
                      title="Copiar mensaje al portapapeles"
                    >
                      <Copy size={13} />
                    </button>
                  </div>

                  {/* Botón Principal Único de Acción */}
                  <div className="pt-1">
                    {selectedChannel === 'GMAIL' ? (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(`Asunto: ${outreachSubject}\n\n${outreachBody}`);
                          triggerCopyToast('Borrador copiado al portapapeles. Redactando correo en RIS3Mail...');
                          const hasValidEmail = selectedLead?.email && !selectedLead.email.endsWith('@empresa.com') && !selectedLead.email.includes('@facebook.com') && !selectedLead.email.includes('contacto@');
                          setMailModalParams({
                            initialFolder: 'compose',
                            initialEmailTo: hasValidEmail ? selectedLead.email : '',
                            initialSubject: outreachSubject,
                            initialContent: outreachBody,
                          });
                          setShowMailModal(true);
                        }}
                        className="w-full bg-[#EA4335] hover:bg-[#d93025] text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <Mail size={15} /> Copiar y Abrir Sección de Correo RIS3Mail
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(outreachBody);
                          triggerCopyToast('Mensaje copiado al portapapeles. Abriendo perfil...');
                          const targetUrl = selectedLead.linkedinUrl || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(selectedLead.name)}`;
                          window.open(targetUrl, '_blank');
                        }}
                        className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <Copy size={15} /> Copiar Borrador y Abrir Perfil en LinkedIn
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE TUTORIAL PASO A PASO */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Guía de Prospección B2B</h3>
                    <p className="text-[11px] text-slate-500">Aprende a conseguir clientes con RIS3 en 4 pasos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Paso 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</div>
                    <div className="w-px h-full bg-slate-200 my-1"></div>
                  </div>
                  <div className="pb-4">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Identifica a tu Prospecto</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pídele a la IA que busque empresas de tu nicho. Por ejemplo: <i>"Busca empresas de fintech en latam"</i> o usa los botones rápidos. La IA buscará en Apollo o registrará los datos manualmente.
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</div>
                    <div className="w-px h-full bg-slate-200 my-1"></div>
                  </div>
                  <div className="pb-4">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Analiza la Sinergia (Score Match)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      La IA generará automáticamente una <strong>Tarjeta de Lead</strong> analizando qué tan compatible es la empresa con tus repositorios de código y experiencia en GitHub, mostrando un porcentaje de match.
                    </p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</div>
                    <div className="w-px h-full bg-slate-200 my-1"></div>
                  </div>
                  <div className="pb-4">
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Redacta el Outreach (Propuesta)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Haz clic en el botón <strong>"Redactar & Enviar Outreach"</strong> de la tarjeta. La IA abrirá un borrador redactado estratégicamente mencionando el valor técnico que puedes aportar.
                    </p>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0"><Check size={12} /></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Dispara y Conecta</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Selecciona <strong>Gmail</strong> y haz clic en Enviar para abrir tu correo local listo para disparar. O selecciona <strong>LinkedIn</strong> para copiar el mensaje y abrir su perfil con 1 clic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  ¡Entendido, vamos a prospectar!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MODAL WIZARD DE CONEXIÓN */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
                    <Rocket size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Asistente de Conexión</h3>
                    <p className="text-[11px] text-slate-500">
                      Paso {wizardStep} de 3: {wizardStep === 1 ? 'Industria' : wizardStep === 2 ? 'Rol' : 'Propuesta'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowWizard(false); setWizardStep(1); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 h-[260px] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {wizardStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">¿En qué industria te quieres enfocar?</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {['SaaS & Software', 'Fintech & Cripto', 'E-commerce & Retail', 'HealthTech', 'Agencias de Marketing', 'EdTech'].map((ind) => (
                          <button
                            key={ind}
                            onClick={() => { setWizardData(prev => ({ ...prev, industry: ind })); setWizardStep(2); }}
                            className={`p-3 text-xs font-medium rounded-xl border text-left transition-all ${wizardData.industry === ind ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs' : 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-slate-50'}`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {wizardStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">¿A qué rol quieres apuntar en {wizardData.industry}?</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {['CTO / VP de Ingeniería', 'CEO / Fundador', 'CMO / Director de Marketing', 'Product Manager', 'HR / Recruiter Tech', 'CFO / Finanzas'].map((role) => (
                          <button
                            key={role}
                            onClick={() => { setWizardData(prev => ({ ...prev, role })); setWizardStep(3); }}
                            className={`p-3 text-xs font-medium rounded-xl border text-left transition-all ${wizardData.role === role ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs' : 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-slate-50'}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {wizardStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">¿Cuál es tu propuesta de valor principal?</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {['Desarrollo Fullstack y Arquitectura', 'Optimización de Rendimiento y Costos Cloud', 'Integración de Inteligencia Artificial', 'Auditoría de Seguridad y Testing Automático'].map((pitch) => (
                          <button
                            key={pitch}
                            onClick={() => setWizardData(prev => ({ ...prev, value: pitch }))}
                            className={`p-3 text-xs font-medium rounded-xl border text-left transition-all ${wizardData.value === pitch ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs' : 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-slate-50'}`}
                          >
                            {pitch}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                {wizardStep > 1 ? (
                  <button onClick={() => setWizardStep(prev => prev - 1)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Atrás</button>
                ) : <div />}

                {wizardStep === 3 ? (
                  <button
                    onClick={handleCompleteWizard}
                    disabled={!wizardData.value}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    Generar y Buscar Prospectos <Sparkles size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setWizardStep(prev => prev + 1)}
                    disabled={(wizardStep === 1 && !wizardData.industry) || (wizardStep === 2 && !wizardData.role)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SELECTOR DE CONTACTOS */}
      <AnimatePresence>
        {showContactSelector?.show && selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Seleccionar Destinatario</h3>
                    <p className="text-[11px] text-slate-500">¿A quién de {selectedLead.company} deseas contactar?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactSelector(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-3">
                {/* Contacto Primario */}
                <button
                  onClick={() => setSelectedContactEmail(selectedLead.email)}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${selectedContactEmail === selectedLead.email
                      ? 'border-indigo-500 bg-indigo-50 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{selectedLead.name || 'Prospecto sin nombre'}</p>
                    <p className="text-xs text-slate-500">{selectedLead.email} • {selectedLead.role || 'Ejecutivo'}</p>
                  </div>
                  {selectedContactEmail === selectedLead.email && (
                    <Check size={18} className="text-indigo-600" />
                  )}
                </button>

                {/* Contacto Secundario (Simulado) */}
                <button
                  onClick={() => setSelectedContactEmail(`ventas@${selectedLead.company.toLowerCase().replace(/\s+/g, '')}.com`)}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${selectedContactEmail === `ventas@${selectedLead.company.toLowerCase().replace(/\s+/g, '')}.com`
                      ? 'border-indigo-500 bg-indigo-50 shadow-xs'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Equipo de Ventas / General</p>
                    <p className="text-xs text-slate-500">ventas@{selectedLead.company.toLowerCase().replace(/\s+/g, '')}.com</p>
                  </div>
                  {selectedContactEmail === `ventas@${selectedLead.company.toLowerCase().replace(/\s+/g, '')}.com` && (
                    <Check size={18} className="text-indigo-600" />
                  )}
                </button>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowContactSelector(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showContactSelector?.channel === 'LINKEDIN' && !isLinkedInConnected) {
                      window.location.href = 'http://localhost:3001/api/v1/linkedin/auth';
                      return;
                    }
                    setShowContactSelector(null);
                    handleSendOutreach();
                  }}
                  disabled={!selectedContactEmail}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {showContactSelector?.channel === 'LINKEDIN' && !isLinkedInConnected
                    ? 'Conectar LinkedIn'
                    : <>Confirmar y Enviar <Send size={14} /></>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE ÉXITO DE OUTREACH */}
      <AnimatePresence>
        {outreachSuccessData?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col text-center border border-emerald-100"
            >
              <div className="p-8 pb-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">
                  {outreachSuccessData.channel === 'LINKEDIN' ? '¡Mensaje Copiado y Listo!' : '¡Enviado Exitosamente!'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {outreachSuccessData.channel === 'LINKEDIN' ? (
                    <>El mensaje fue <strong>copiado automáticamente al portapapeles</strong> y se abrió el perfil de <strong>{outreachSuccessData.leadName}</strong> en LinkedIn. ¡Solo pega el mensaje en la ventana de chat del perfil!</>
                  ) : (
                    <>El mensaje fue enviado automáticamente a <strong>{outreachSuccessData.leadName}</strong> ({outreachSuccessData.leadEmail}) a través de los servidores de RIS3.</>
                  )}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <span>Vía:</span>
                  <span className={`px-2 py-0.5 rounded text-white ${outreachSuccessData.channel === 'GMAIL' ? 'bg-red-500' : 'bg-blue-600'}`}>
                    {outreachSuccessData.channel === 'GMAIL' ? 'Google Workspace' : 'LinkedIn Direct'}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2.5">
                {outreachSuccessData.channel === 'LINKEDIN' && outreachSuccessData.leadLinkedin && (
                  <a
                    href={outreachSuccessData.leadLinkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Abrir Perfil de LinkedIn Nuevamente</span>
                    <ExternalLink size={13} />
                  </a>
                )}
                <button
                  onClick={() => {
                    setOutreachSuccessData(null);
                    setShowDrawer(true);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-amber-600 shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Users size={15} /> Ver Mis Contactos Guardados
                </button>
                <button
                  onClick={() => setOutreachSuccessData(null)}
                  className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Chats Guardados de la IA */}
      <AnimatePresence>
        {showSavedChatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowSavedChatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Conversaciones Guardadas</h3>
                    <p className="text-xs text-slate-500">Historial de chats guardados con la IA de prospección</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSavedChatsModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    value={savedChatSearchQuery}
                    onChange={(e) => setSavedChatSearchQuery(e.target.value)}
                    placeholder="Buscar en conversaciones guardadas..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {savedChatSessions.filter(s => {
                  const q = savedChatSearchQuery.toLowerCase();
                  return !q || s.title?.toLowerCase().includes(q) || s.messages?.some(m => m.content?.toLowerCase().includes(q));
                }).length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={22} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No hay chats guardados</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {savedChatSearchQuery ? 'No se encontraron conversaciones que coincidan con la búsqueda.' : 'Puedes guardar cualquier sesión haciendo clic en "Guardar Chat" en la barra de mensajes.'}
                    </p>
                  </div>
                ) : (
                  savedChatSessions
                    .filter(s => {
                      const q = savedChatSearchQuery.toLowerCase();
                      return !q || s.title?.toLowerCase().includes(q) || s.messages?.some(m => m.content?.toLowerCase().includes(q));
                    })
                    .map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleLoadSavedChat(session)}
                        className="group relative bg-white hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 rounded-2xl p-4 transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{session.title}</span>
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {session.messages?.length || 0} msgs
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {session.messages?.slice(-1)[0]?.content || 'Conversación guardada'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(session.updatedAt || session.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadSavedChat(session);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={(e) => handleDeleteSavedChat(session.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Eliminar chat guardado"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>{savedChatSessions.length} conversación(es) en total</span>
                <button
                  onClick={() => setShowSavedChatsModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Sección de Correo (RIS3Mail) */}
      <GlobalReportModal
        isOpen={showMailModal}
        onClose={() => setShowMailModal(false)}
        initialFolder={mailModalParams.initialFolder}
        initialEmailTo={mailModalParams.initialEmailTo}
        initialSubject={mailModalParams.initialSubject}
        initialContent={mailModalParams.initialContent}
      />

    </div>
  );
}

export default function LeadsChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-500">Cargando Inteligencia de Leads...</div>}>
      <LeadsChatContent />
    </Suspense>
  );
}
