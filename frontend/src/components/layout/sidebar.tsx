'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import {
  LogOut,
  LayoutDashboard,
  Folder,
  FolderGit2,
  Users,
  Sparkles,
  Crown,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Code2,
  ShieldCheck,
  ArrowLeftRight,
  ChevronUp,
  Palette,
  Save,
  Plus,
  MessageSquare,
  MoreVertical,
  Link2,
  Unlink,
  Trash2,
  Search,
  X,
  Check,
  FileText,
  Building2,
  MapPin,
  Compass,
  Store,
} from 'lucide-react';
import { GlobalReportModal } from './global-report-modal';
import { DeerIcon } from '../ui/deer-icon';
import { OpportunityIcon } from '../ui/opportunity-icon';
import { api } from '@/lib/api';

import { useProfileSettings } from '@/lib/settings-context';
import { translations } from '@/lib/translations';

export interface ChatSessionSidebarItem {
  id: string;
  title: string;
  projectId?: string;
  projectName?: string;
  folderName?: string;
  updatedAt?: string;
}

export interface OpportunitySessionSidebarItem {
  id: string;
  title: string;
  companyName?: string;
  companyDomain?: string;
  updatedAt?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, setAppMode, appMode, isDevMode, isFounderMode, isLeadsMode, isManagementMode } = useAuth();
  const { settings } = useProfileSettings();
  const lang = settings.language || 'es';
  const t = translations[lang] || translations.es;

  // Herramientas aisladas por rol
  const navItems = [
    // Herramientas Fundador
    { href: '/dashboard/leads', label: 'Prospección & Leads', icon: Users, role: 'founder' },
    { href: '/territory-map', label: 'Radar Territorial & Propuestas', icon: Compass, role: 'founder' },
    { href: '/opportunities', label: 'Opportunity Intelligence', icon: OpportunityIcon, role: 'founder' },

    // Herramientas Gestor / Management
    { href: '/dashboard', label: 'Panel de Gestión', icon: LayoutDashboard, role: 'management' },
    { href: '/workspaces', label: t.sidebar.workspaces, icon: Folder, role: 'management' },
    { href: '/workspaces?tab=documents', label: 'Gestión de Documentos', icon: FileText, role: 'management' },
    { href: '/saved-chats', label: t.sidebar.savedChats, icon: Save, role: 'management' },

    // Herramientas Desarrollador / Dev
    { href: '/repositories', label: t.sidebar.repositories, icon: Code2, role: 'dev' },
    { href: '/dashboard', label: 'Panel Técnico', icon: LayoutDashboard, role: 'dev' },
    { href: '/saved-chats', label: 'Historial de Sesiones', icon: Save, role: 'dev' },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileSubmenu, setShowProfileSubmenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [chatSessions, setChatSessions] = useState<ChatSessionSidebarItem[]>([]);
  const [userProjects, setUserProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [linkingSession, setLinkingSession] = useState<ChatSessionSidebarItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [folderInput, setFolderInput] = useState<string>('');

  // Search & Collapsible State for Intelligence Chats
  const [isChatsCollapsed, setIsChatsCollapsed] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Opportunity Intelligence Sessions
  const [oppSessions, setOppSessions] = useState<OpportunitySessionSidebarItem[]>([]);
  const [isOppCollapsed, setIsOppCollapsed] = useState(false);
  const [oppSearchQuery, setOppSearchQuery] = useState('');

  const activeSessionId = searchParams.get('session');

  const filteredNavItems = navItems.filter((item) => item.role === appMode);

  const loadOpportunitySessions = () => {
    try {
      const local = localStorage.getItem('forgemind_opportunity_sessions');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          setOppSessions(parsed);
        }
      } else {
        setOppSessions([]);
      }
    } catch {
      setOppSessions([]);
    }
  };

  const loadSessionsAndProjects = async () => {
    try {
      const res = await api.chat.getSessions().catch(() => []);
      let remote: ChatSessionSidebarItem[] = Array.isArray(res) ? res : [];

      const local = localStorage.getItem('forgemind_auto_chat_sessions');
      let localList: ChatSessionSidebarItem[] = local ? JSON.parse(local) : [];

      const map = new Map<string, ChatSessionSidebarItem>();
      [...remote, ...localList].forEach((s) => {
        if (s.id) map.set(s.id, s);
      });

      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );

      setChatSessions(combined);
    } catch {
      const local = localStorage.getItem('forgemind_auto_chat_sessions');
      setChatSessions(local ? JSON.parse(local) : []);
    }

    try {
      if (user?.id) {
        const wss = await api.workspaces.list(user.id).catch(() => []);
        let projs: Array<{ id: string; name: string }> = [];
        for (const ws of wss) {
          const ps = await api.projects.list(ws.id).catch(() => []);
          projs.push(...ps);
        }
        setUserProjects(projs);
      }
    } catch {}
  };

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);
    loadSessionsAndProjects();
    loadOpportunitySessions();

    const handleSync = () => {
      setTimeout(() => {
        loadSessionsAndProjects();
      }, 0);
    };
    const handleOppSync = () => {
      setTimeout(() => {
        loadOpportunitySessions();
      }, 0);
    };

    window.addEventListener('forgemind:saved-responses-updated', handleSync);
    window.addEventListener('forgemind:opportunity-sessions-updated', handleOppSync);

    return () => {
      window.removeEventListener('forgemind:saved-responses-updated', handleSync);
      window.removeEventListener('forgemind:opportunity-sessions-updated', handleOppSync);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileSubmenu(false);
      }
    }
    if (showProfileSubmenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileSubmenu]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const handleStartNewChat = () => {
    const newId = 'session-' + Date.now();
    window.dispatchEvent(new Event('forgemind:new-chat'));
    router.push(`/dashboard?session=${newId}`);
  };

  const handleStartNewOpportunityChat = () => {
    const newId = 'opp_session_' + Date.now();
    window.dispatchEvent(new Event('forgemind:new-opportunity-chat'));
    router.push(`/opportunities?session=${newId}`);
  };

  const handleDeleteOpportunitySession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const local = localStorage.getItem('forgemind_opportunity_sessions');
      if (local) {
        const list = JSON.parse(local);
        const filtered = list.filter((s: any) => s.id !== sessionId);
        localStorage.setItem('forgemind_opportunity_sessions', JSON.stringify(filtered));
        setOppSessions(filtered);
        window.dispatchEvent(new Event('forgemind:opportunity-sessions-updated'));
        if (activeSessionId === sessionId) {
          router.push('/opportunities?session=new');
        }
      }
    } catch {}
  };

  const handleSaveProjectLink = async () => {
    if (!linkingSession) return;

    const proj = userProjects.find((p) => p.id === selectedProjectId);
    const updates = {
      projectId: selectedProjectId || null,
      projectName: proj?.name || null,
      folderName: folderInput.trim() || null,
    };

    try {
      await api.chat.updateSession(linkingSession.id, updates).catch(() => {});
    } catch {}

    const local = localStorage.getItem('forgemind_auto_chat_sessions');
    let localList: ChatSessionSidebarItem[] = local ? JSON.parse(local) : [];
    const updated = localList.map((s) => (s.id === linkingSession.id ? { ...s, ...updates } : s));
    localStorage.setItem('forgemind_auto_chat_sessions', JSON.stringify(updated));

    setLinkingSession(null);
    loadSessionsAndProjects();
  };

  const handleUnlinkProject = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuSessionId(null);
    const updates = { projectId: null, projectName: null, folderName: null };

    try {
      await api.chat.updateSession(sessionId, updates).catch(() => {});
    } catch {}

    const local = localStorage.getItem('forgemind_auto_chat_sessions');
    let localList: ChatSessionSidebarItem[] = local ? JSON.parse(local) : [];
    const updated = localList.map((s) => (s.id === sessionId ? { ...s, ...updates } : s));
    localStorage.setItem('forgemind_auto_chat_sessions', JSON.stringify(updated));

    loadSessionsAndProjects();
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuSessionId(null);

    try {
      await api.chat.deleteSession(sessionId).catch(() => {});
    } catch {}

    const local = localStorage.getItem('forgemind_auto_chat_sessions');
    let localList: ChatSessionSidebarItem[] = local ? JSON.parse(local) : [];
    const updated = localList.filter((s) => s.id !== sessionId);
    localStorage.setItem('forgemind_auto_chat_sessions', JSON.stringify(updated));

    if (activeSessionId === sessionId) {
      router.push('/dashboard?session=new');
    }

    loadSessionsAndProjects();
  };

  const filteredChatSessions = chatSessions.filter((s) => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.projectName?.toLowerCase().includes(q) ||
      s.folderName?.toLowerCase().includes(q)
    );
  });

  const filteredOppSessions = oppSessions.filter((s) => {
    if (!oppSearchQuery.trim()) return true;
    const q = oppSearchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.companyDomain?.toLowerCase().includes(q) ||
      s.companyName?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 68 : 224 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="bg-sidebar text-sidebar-foreground flex flex-col relative z-20 shrink-0 select-none overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between min-h-[65px]">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded-brand"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <DeerIcon size={22} className="text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wider leading-none">RIS3</span>
                  <span
                    className={`text-[9px] font-bold tracking-wide mt-1 px-1.5 py-0.5 rounded-md w-fit flex items-center gap-1 border ${
                      isFounderMode
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : isDevMode
                        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {isFounderMode ? (
                      <><Crown size={10} /> Fundador</>
                    ) : isDevMode ? (
                      <><Code2 size={10} /> Dev</>
                    ) : (
                      <><ShieldCheck size={10} /> Gestión</>
                    )}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-brand"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-1 mx-auto"
                title={isDevMode ? 'Modo Dev' : 'Modo Gestión'}
              >
                <DeerIcon size={22} className="text-white shrink-0" />
                <span className={`w-2 h-2 rounded-full ${isDevMode ? 'bg-amber-400' : 'bg-blue-400'}`} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-accent/60 transition-colors mx-auto flex items-center justify-center cursor-pointer"
            title={collapsed ? 'Expandir menú' : 'Comprimir menú'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronRight size={18} />
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isIntelligence = item.href === '/dashboard';
            const isOpportunity = item.href === '/opportunities';
            const isLeads = item.href === '/dashboard/leads';
            
            const currentTab = searchParams.get('tab');
            const active = isIntelligence
              ? pathname === '/dashboard'
              : isOpportunity
              ? pathname === '/opportunities'
              : isLeads
              ? pathname === '/dashboard/leads'
              : item.href === '/workspaces?tab=documents'
              ? pathname === '/workspaces' && currentTab === 'documents'
              : item.href === '/workspaces'
              ? pathname === '/workspaces' && currentTab !== 'documents'
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <div key={item.href} className="space-y-1">
                <div
                  onClick={() => {
                    router.push(item.href);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    active
                      ? 'bg-sidebar-accent text-white font-semibold shadow-xs'
                      : 'text-white/70 hover:text-white hover:bg-sidebar-accent/50'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={18} className={active ? 'text-white shrink-0' : 'text-white/70 shrink-0'} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="truncate overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions for Intelligence: Compress Chevron & Plus New Chat */}
                  <AnimatePresence>
                    {isIntelligence && !collapsed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 shrink-0"
                      >
                        {chatSessions.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsChatsCollapsed(!isChatsCollapsed);
                            }}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={isChatsCollapsed ? 'Desplegar chats' : 'Comprimir chats'}
                          >
                            <ChevronDown size={14} className={`transition-transform ${isChatsCollapsed ? '-rotate-90' : ''}`} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartNewChat();
                          }}
                          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Nuevo Chat"
                        >
                          <Plus size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions for Opportunity: Compress Chevron & Plus New Investigation */}
                  <AnimatePresence>
                    {isOpportunity && !collapsed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 shrink-0"
                      >
                        {oppSessions.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOppCollapsed(!isOppCollapsed);
                            }}
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title={isOppCollapsed ? 'Desplegar directorios' : 'Comprimir directorios'}
                          >
                            <ChevronDown size={14} className={`transition-transform ${isOppCollapsed ? '-rotate-90' : ''}`} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartNewOpportunityChat();
                          }}
                          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Nueva Investigación"
                        >
                          <Plus size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* DYNAMIC SIDEBAR CHAT SESSIONS WITH SEARCH BAR & COLLAPSIBLE VIEW */}
                {isIntelligence && !collapsed && !isChatsCollapsed && chatSessions.length > 0 && (
                  <div className="pl-3 pr-1 py-1 space-y-1.5 border-l border-white/10 ml-3 my-1">
                    {/* Search Bar for Sidebar Chats: Only when 2 or more chats exist */}
                    {chatSessions.length >= 2 && (
                      <div className="relative mb-1.5">
                        <Search size={11} className="absolute left-2.5 top-2 text-white/40" />
                        <input
                          type="text"
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          placeholder={t.sidebar.searchChat}
                          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-xl pl-7 pr-2 py-1 text-[11px] text-white placeholder:text-white/40 outline-none transition-all"
                        />
                      </div>
                    )}

                    {filteredChatSessions.length === 0 ? (
                      <p className="text-[10px] text-white/40 px-2 py-1 italic">Sin chats coincidentes</p>
                    ) : (
                      filteredChatSessions.slice(0, 15).map((session) => {
                        const isCurrentActive = activeSessionId === session.id;
                        const hasProject = session.projectName || session.projectId;
                        const hasFolder = session.folderName;

                        const truncatedTitle =
                          session.title.length > 18 ? session.title.slice(0, 18) + '...' : session.title;

                        return (
                          <div
                            key={session.id}
                            onClick={() => router.push(`/dashboard?session=${session.id}`)}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer relative ${
                              isCurrentActive
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MessageSquare size={12} className="shrink-0 text-white/50 group-hover:text-white" />
                              <span className="truncate text-[11px]" title={session.title}>
                                {truncatedTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {hasProject && (
                                <span
                                  className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded-md truncate max-w-[55px]"
                                  title={`Proyecto: ${session.projectName || 'Vinculado'}`}
                                >
                                  {session.projectName || 'Proyecto'}
                                </span>
                              )}

                              {hasFolder && (
                                <span
                                  className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded-md truncate max-w-[45px]"
                                  title={`Carpeta: ${session.folderName}`}
                                >
                                  {session.folderName}
                                </span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuSessionId(openMenuSessionId === session.id ? null : session.id);
                                }}
                                className="p-1 text-white/40 hover:text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Opciones de chat"
                              >
                                <MoreVertical size={12} />
                              </button>
                            </div>

                            {/* Options Menu Popover */}
                            {openMenuSessionId === session.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-44 bg-slate-900 text-white rounded-xl p-1.5 shadow-2xl border border-slate-800 space-y-0.5 z-50 text-[11px]"
                              >
                                <button
                                  onClick={() => {
                                    setOpenMenuSessionId(null);
                                    setLinkingSession(session);
                                    setSelectedProjectId(session.projectId || '');
                                    setFolderInput(session.folderName || '');
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors text-left"
                                >
                                  <Link2 size={12} className="text-amber-400" />
                                  <span>{hasProject || hasFolder ? 'Editar carpeta' : 'Vincular a carpeta'}</span>
                                </button>

                                {(hasProject || hasFolder) && (
                                  <button
                                    onClick={(e) => handleUnlinkProject(session.id, e)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <Unlink size={12} className="text-purple-400" />
                                    <span>Desvincular</span>
                                  </button>
                                )}

                                <button
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                                >
                                  <Trash2 size={12} />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* DYNAMIC SIDEBAR OPPORTUNITY INVESTIGATION DIRECTORIES WITH SEARCH BAR & COLLAPSIBLE VIEW */}
                {isOpportunity && !collapsed && !isOppCollapsed && oppSessions.length > 0 && (
                  <div className="pl-3 pr-1 py-1 space-y-1.5 border-l border-white/10 ml-3 my-1">
                    {/* Search Bar for Opportunity Chats: Only when 2 or more chats exist */}
                    {oppSessions.length >= 2 && (
                      <div className="relative mb-1.5">
                        <Search size={11} className="absolute left-2.5 top-2 text-white/40" />
                        <input
                          type="text"
                          value={oppSearchQuery}
                          onChange={(e) => setOppSearchQuery(e.target.value)}
                          placeholder="Buscar directorio..."
                          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-xl pl-7 pr-2 py-1 text-[11px] text-white placeholder:text-white/40 outline-none transition-all"
                        />
                      </div>
                    )}

                    {filteredOppSessions.length === 0 ? (
                      <p className="text-[10px] text-white/40 px-2 py-1 italic">Sin directorios coincidentes</p>
                    ) : (
                      filteredOppSessions.slice(0, 15).map((session) => {
                        const isCurrentActive = activeSessionId === session.id;
                        const truncatedTitle =
                          session.title.length > 18 ? session.title.slice(0, 18) + '...' : session.title;

                        return (
                          <div
                            key={session.id}
                            onClick={() => router.push(`/opportunities?session=${session.id}`)}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer relative ${
                              isCurrentActive
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Building2 size={12} className="shrink-0 text-white/50 group-hover:text-white" />
                              <span className="truncate text-[11px]" title={session.title}>
                                {truncatedTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {session.companyDomain && (
                                <span
                                  className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded-md truncate max-w-[55px]"
                                  title={session.companyDomain}
                                >
                                  {session.companyDomain}
                                </span>
                              )}

                              <button
                                onClick={(e) => handleDeleteOpportunitySession(session.id, e)}
                                className="p-1 text-white/40 hover:text-rose-400 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar directorio"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mail Reports Action */}
          <div className="pt-3 mt-2 border-t border-white/10 space-y-1.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReportModal(true)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 shadow-2xs backdrop-blur-xs transition-all ${
                collapsed ? 'justify-center px-0' : ''
              }`}
              title={collapsed ? t.modal.sidebarTitle : undefined}
            >
              <div className="w-5 h-5 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Mail size={13} className="text-white" />
              </div>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                  {t.modal.sidebarLabel}
                </motion.span>
              )}
            </motion.button>
          </div>
        </nav>

        {/* Footer Profile */}
        <div className="px-2.5 py-3 border-t border-sidebar-border relative" ref={profileRef}>
          <AnimatePresence>
            {showProfileSubmenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full left-2.5 right-2.5 mb-2 bg-slate-900 text-white rounded-2xl p-2 shadow-2xl border border-slate-800 space-y-1 z-50 text-xs"
              >
                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <p className="font-semibold text-white truncate">{user?.displayName || t.profile.myProfile}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setShowProfileSubmenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-slate-800 transition-all font-medium"
                >
                  <Palette size={15} className="text-sky-400" />
                  <span>{t.profile.designSettings}</span>
                </Link>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowProfileSubmenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-medium text-left cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>{t.profile.logout}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowProfileSubmenu(!showProfileSubmenu)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10 cursor-pointer ${
              showProfileSubmenu ? 'bg-white/10 border-white/15' : ''
            } ${collapsed ? 'justify-center' : ''}`}
            title="Opciones de perfil y diseño"
          >
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="" className="w-7 h-7 rounded-full shrink-0 border border-white/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0 border border-white/20">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.displayName || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-white/70 truncate">
                    {appMode === 'founder' && 'Rol Fundador'}
                    {appMode === 'dev' && 'Rol Desarrollador'}
                    {appMode === 'management' && 'Rol Gestión'}
                  </p>
                </div>
                <ChevronUp
                  size={14}
                  className={`text-white/50 group-hover:text-white transition-transform ${
                    showProfileSubmenu ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* PROJECT / FOLDER LINKING MODAL */}
      <AnimatePresence>
        {linkingSession && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Link2 size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Vincular Chat a Proyecto / Carpeta</h3>
                </div>
                <button
                  onClick={() => setLinkingSession(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Selecciona un proyecto y opcionalmente asigna una carpeta para organizar este chat.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Proyecto Relacionado:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="">(Sin proyecto vinculado)</option>
                    {userProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Nombre de Carpeta (Opcional):</label>
                  <input
                    type="text"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="Ej: Especificaciones, Requerimientos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setLinkingSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProjectLink}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check size={14} />
                  <span>Guardar Vinculación</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlobalReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />
    </>
  );
}
