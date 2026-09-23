'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { AEMessage } from '@/lib/argentina-empleos/types';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  User,
  Briefcase,
  Clock,
  PlusCircle,
  Inbox,
  ArrowLeft,
  Mail,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AEAvatar } from '@/components/argentina-empleos/ui/ae-avatar';

interface Thread {
  otherUser: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    headline?: string;
    role?: string;
    userType?: string;
  };
  lastMessage: AEMessage;
  unreadCount: number;
  messages: AEMessage[];
}

interface ContactSearchResult {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string;
  headline?: string;
  userType?: string;
  role?: string;
}

export default function AEMensajesPage() {
  const { user } = useAEAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New message / Reply inputs
  const [replyText, setReplyText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // New Conversation Modal State with Live DB Contact Search
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [contactSearchText, setContactSearchText] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [searchingContacts, setSearchingContacts] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [newSubject, setNewSubject] = useState<string>('');
  const [newMessageText, setNewMessageText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadInbox = async (preserveSelected = true) => {
    if (!user) return;
    try {
      const data = await aeApi.messages.getInbox(user.id);
      setThreads(data.threads || []);
      setTotalUnread(data.totalUnreadCount || 0);

      if ((!selectedThreadId || !preserveSelected) && data.threads && data.threads.length > 0) {
        setSelectedThreadId(data.threads[0].otherUser.id);
      }
    } catch (err) {
      console.error('Error cargando bandeja de mensajes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInbox(false);
    }
  }, [user]);

  // Mark thread as read when selected
  useEffect(() => {
    if (user && selectedThreadId) {
      const activeThread = threads.find((t) => t.otherUser.id === selectedThreadId);
      if (activeThread && activeThread.unreadCount > 0) {
        aeApi.messages.markThreadAsRead(user.id, selectedThreadId).then(() => {
          setThreads((prev) =>
            prev.map((t) =>
              t.otherUser.id === selectedThreadId ? { ...t, unreadCount: 0 } : t,
            ),
          );
          setTotalUnread((prev) => Math.max(0, prev - activeThread.unreadCount));
        });
      }
    }
  }, [selectedThreadId, user]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedThreadId, threads]);

  // Live Contact Search with debounce
  useEffect(() => {
    if (!isNewModalOpen || !user) return;

    const timer = setTimeout(async () => {
      setSearchingContacts(true);
      try {
        const results = await aeApi.messages.searchContacts(user.id, contactSearchText);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Error buscando contactos:', err);
        setSearchResults([]);
      } finally {
        setSearchingContacts(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [contactSearchText, isNewModalOpen, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedThreadId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const activeThread = threads.find((t) => t.otherUser.id === selectedThreadId);
      const lastMsg = activeThread?.lastMessage;

      await aeApi.messages.send(user.id, {
        receiverId: selectedThreadId,
        content: replyText.trim(),
        subject: lastMsg?.subject ? `Re: ${lastMsg.subject.replace(/^Re:\s*/, '')}` : undefined,
        jobId: lastMsg?.jobId,
        jobTitle: lastMsg?.jobTitle,
      });

      setReplyText('');
      await loadInbox(true);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const handleOpenNewMessageModal = () => {
    setSelectedContact(null);
    setContactSearchText('');
    setNewSubject('');
    setNewMessageText('');
    setIsNewModalOpen(true);
  };

  const handleSendNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContact || !newMessageText.trim() || sending) return;

    setSending(true);
    try {
      await aeApi.messages.send(user.id, {
        receiverId: selectedContact.id,
        subject: newSubject.trim() || 'Consulta directa',
        content: newMessageText.trim(),
      });

      setSelectedThreadId(selectedContact.id);
      setIsNewModalOpen(false);
      setSelectedContact(null);
      setContactSearchText('');
      setNewSubject('');
      setNewMessageText('');
      await loadInbox(true);
    } catch (err) {
      console.error('Error iniciando conversación:', err);
    } finally {
      setSending(false);
    }
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.otherUser.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'unread') return t.unreadCount > 0;
    if (filterType === 'read') return t.unreadCount === 0;
    return true;
  });

  const selectedThread = threads.find((t) => t.otherUser.id === selectedThreadId);

  if (!user) {
    return (
      <AEShell>
        <div className="bg-white border border-slate-200 rounded-sm p-8 text-center max-w-md mx-auto shadow-2xs">
          <Mail className="w-12 h-12 text-[#0064D9] mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-900">Bandeja de Mensajes</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Debes iniciar sesión para ver y responder mensajes de postulantes y empresas.
          </p>
          <Link
            href="/argentinaEmpleos/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0064D9] hover:bg-[#0050B3] text-white text-xs font-bold rounded-sm shadow-2xs transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </AEShell>
    );
  }

  return (
    <AEShell>
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-[#0064D9]/10 text-[#0064D9] flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                  Bandeja de Mensajes & Conversaciones
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Comunícate directamente con empresas, reclutadores y postulantes en tiempo real.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadInbox(true)}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-sm text-slate-600 transition-colors"
              title="Actualizar mensajes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleOpenNewMessageModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0064D9] hover:bg-[#0050B3] text-white text-xs font-bold rounded-sm shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo Mensaje</span>
            </button>
          </div>
        </div>

        {/* Main Split Layout Container */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-2xs grid grid-cols-1 md:grid-cols-12 min-h-[580px] overflow-hidden">
          {/* Left Column: Thread List Sidebar */}
          <div
            className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/40 ${
              selectedThreadId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search & Filter Bar */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o mensaje..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#0064D9] focus:outline-hidden"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 text-[11px] font-semibold">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-xs transition-colors ${
                    filterType === 'all'
                      ? 'bg-[#0064D9] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({threads.length})
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={`px-2.5 py-1 rounded-xs transition-colors flex items-center gap-1 ${
                    filterType === 'unread'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>No vistos</span>
                  {totalUnread > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        filterType === 'unread'
                          ? 'bg-white text-amber-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {totalUnread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilterType('read')}
                  className={`px-2.5 py-1 rounded-xs transition-colors ${
                    filterType === 'read'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Vistos
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0064D9] mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Cargando conversaciones...</p>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No hay mensajes</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {filterType === 'unread'
                      ? 'Todos tus mensajes han sido vistos.'
                      : 'Inicia una conversación con el botón "Nuevo Mensaje".'}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = selectedThreadId === thread.otherUser.id;
                  const hasUnread = thread.unreadCount > 0;
                  const lastMsg = thread.lastMessage;
                  const isMyLastMsg = lastMsg?.senderId === user.id;

                  return (
                    <div
                      key={thread.otherUser.id}
                      onClick={() => setSelectedThreadId(thread.otherUser.id)}
                      className={`p-3 cursor-pointer transition-colors flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-3 border-[#0064D9]'
                          : hasUnread
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 font-semibold'
                          : 'hover:bg-slate-100/70'
                      }`}
                    >
                      {/* User Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <AEAvatar user={thread.otherUser as any} size="md" showBadge={true} />
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white z-10" />
                        )}
                      </div>

                      {/* Thread Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs truncate ${
                              hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                            }`}
                          >
                            {thread.otherUser.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {lastMsg?.createdAt
                              ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {thread.otherUser.headline && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {thread.otherUser.headline}
                          </div>
                        )}

                        {lastMsg?.jobTitle && (
                          <div className="text-[10px] text-[#0064D9] font-medium flex items-center gap-1 truncate mt-0.5">
                            <Briefcase className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{lastMsg.jobTitle}</span>
                          </div>
                        )}

                        <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          {isMyLastMsg && (
                            <span className="shrink-0 text-slate-400">
                              {lastMsg.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-500 inline" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                          <span className="truncate">{lastMsg?.content || 'Sin mensajes'}</span>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                              hasUnread
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {hasUnread ? `${thread.unreadCount} no visto(s)` : 'Visto'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Thread Chat Stream */}
          <div
            className={`md:col-span-7 lg:col-span-8 flex flex-col bg-white ${
              !selectedThreadId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedThreadId(null)}
                      className="md:hidden p-1 text-slate-500 hover:text-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <AEAvatar user={selectedThread.otherUser as any} size="md" showBadge={true} />

                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{selectedThread.otherUser.name}</span>
                        {selectedThread.otherUser.role === 'superadmin' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-700" />
                            <span>Verificado Superadmin</span>
                          </span>
                        )}
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedThread.otherUser.headline || (selectedThread.otherUser.role === 'superadmin' ? 'Superadministrador Oficial — Argentina Empleos' : 'Usuario de Argentina Empleos')}
                      </div>
                    </div>
                  </div>

                  {selectedThread.lastMessage?.jobTitle && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 border border-blue-200 text-xs text-[#0064D9] font-semibold">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{selectedThread.lastMessage.jobTitle}</span>
                    </div>
                  )}
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-50/30 to-white max-h-[460px]">
                  {selectedThread.messages.map((msg) => {
                    const isMe = msg.senderId === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {msg.subject && (
                          <div className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                            Asunto: {msg.subject}
                          </div>
                        )}

                        <div
                          className={`max-w-md rounded-sm p-3 text-xs shadow-2xs space-y-1 ${
                            isMe
                              ? 'bg-[#0064D9] text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                              isMe ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span className="ml-1">
                                {msg.read ? (
                                  <span className="text-emerald-300 font-bold flex items-center gap-0.5">
                                    <CheckCheck className="w-3 h-3 inline" /> Visto
                                  </span>
                                ) : (
                                  <span className="text-blue-200 flex items-center gap-0.5">
                                    <Check className="w-3 h-3 inline" /> Enviado
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Reply Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe una respuesta... (Presiona Enter para enviar)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#0064D9] focus:outline-hidden"
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-2 bg-[#0064D9] hover:bg-[#0050B3] disabled:bg-slate-300 text-white font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                <h3 className="text-xs font-bold text-slate-700">Selecciona una conversación</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Haz clic en cualquier mensaje de la lista izquierda para ver el historial y responder.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* New Conversation Modal with Live Database Search */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0064D9]" />
                  <span>Iniciar Nueva Conversación</span>
                </h2>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendNewConversation} className="space-y-3.5 text-xs">
                {/* Contact Search and Selection Box */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Destinatario (Buscar por Nombre en la base de datos) *
                  </label>

                  {selectedContact ? (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <AEAvatar user={selectedContact} size="md" showBadge={true} />
                        <div>
                          <div className="font-bold text-slate-900">{selectedContact.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {selectedContact.headline || 'Usuario de la plataforma'} • <span className="capitalize font-semibold">{selectedContact.userType || 'Candidato'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedContact(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-sm"
                        title="Cambiar contacto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 relative">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={contactSearchText}
                          onChange={(e) => setContactSearchText(e.target.value)}
                          placeholder="Escribe el nombre del usuario o empresa..."
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#0064D9] focus:outline-hidden"
                        />
                        {searchingContacts && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0064D9] absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>

                      {/* Contact Suggestions Dropdown (Only show when user types a query) */}
                      {contactSearchText.trim().length >= 1 && (
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-sm divide-y divide-slate-100 bg-white shadow-xs">
                          {searchingContacts ? (
                            <div className="p-3 text-center text-slate-400 text-xs">
                              Buscando en la base de datos...
                            </div>
                          ) : searchResults.length === 0 ? (
                            <div className="p-3 text-center text-slate-400 text-xs">
                              No se encontraron usuarios con ese nombre.
                            </div>
                          ) : (
                            searchResults.map((contact) => {
                              const isContactSuperadmin = contact.role === 'superadmin';
                              return (
                                <div
                                  key={contact.id}
                                  onClick={() => setSelectedContact(contact)}
                                  className="p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <AEAvatar user={contact} size="sm" showBadge={true} />
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                        <span>{contact.name}</span>
                                        {isContactSuperadmin && (
                                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-xs text-[8px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                            <ShieldCheck className="w-2 h-2 text-amber-700" />
                                            <span>Superadmin</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {contact.headline || (isContactSuperadmin ? 'Superadministrador Oficial' : 'Usuario verificado')}
                                      </div>
                                    </div>
                                  </div>

                                  <span
                                    className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase shrink-0 ${
                                      isContactSuperadmin
                                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isContactSuperadmin ? 'Superadmin' : contact.userType || 'Usuario'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asunto</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Ej: Consulta sobre propuesta laboral..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#0064D9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mensaje *</label>
                  <textarea
                    rows={4}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#0064D9] leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-sm text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedContact || !newMessageText.trim() || sending}
                    className="px-4 py-1.5 bg-[#0064D9] hover:bg-[#0050B3] disabled:bg-slate-300 text-white font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-2xs"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Mensaje</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AEShell>
  );
}
