'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { AENotification } from '@/lib/argentina-empleos/types';
import {
  Briefcase,
  Search,
  PlusCircle,
  Wallet,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight,
  Bell,
  Settings,
  Menu,
  X,
  MessageSquare,
  CheckCheck,
  Clock,
  Mail,
} from 'lucide-react';

export function AEHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, wallet, isSuperadmin, logout } = useAEAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Unread indicators
  const [notifications, setNotifications] = useState<AENotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications and unread messages count
  const loadNotificationsAndMessages = async () => {
    if (!user) return;
    try {
      const [notifsData, inboxData] = await Promise.all([
        aeApi.messages.getNotifications(user.id).catch(() => ({ notifications: [], unreadCount: 0 })),
        aeApi.messages.getInbox(user.id).catch(() => ({ threads: [], totalUnreadCount: 0, rawMessages: [] })),
      ]);

      setNotifications(notifsData.notifications || []);
      setUnreadNotifsCount(notifsData.unreadCount || 0);
      setUnreadMessagesCount(inboxData.totalUnreadCount || 0);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (user) {
      loadNotificationsAndMessages();
      const interval = setInterval(loadNotificationsAndMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/argentinaEmpleos/trabajos?query=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsMobileDrawerOpen(false);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    if (!user) return;
    try {
      await aeApi.messages.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifsCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Primary navigation links for Tier 1
  const topNavLinks = [
    { href: '/argentinaEmpleos/trabajos', label: 'Empleos' },
    { href: '/argentinaEmpleos/publicar', label: 'Empresas' },
    { href: '/argentinaEmpleos/mensajes', label: 'Mensajes', badge: unreadMessagesCount },
    { href: '/argentinaEmpleos/billetera', label: 'Billetera' },
    { href: '/argentinaEmpleos/perfil', label: 'Mi Perfil' },
  ];

  // Secondary tabs for Tier 2 (SAP underline style)
  const subNavTabs = [
    { href: '/argentinaEmpleos', label: 'Resumen', exact: true },
    { href: '/argentinaEmpleos/trabajos', label: 'Buscar Empleos' },
    { href: '/argentinaEmpleos/publicar', label: 'Publicar Vacante' },
    { href: '/argentinaEmpleos/mis-publicaciones', label: 'Mis Publicaciones' },
    { href: '/argentinaEmpleos/mensajes', label: 'Mensajes & Chats', badge: unreadMessagesCount },
    { href: '/argentinaEmpleos/billetera', label: 'Mi Billetera' },
    { href: '/argentinaEmpleos/perfil', label: 'Perfil Profesional' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-2xs font-sans">
        {/* TIER 1: Primary Corporate Top Bar */}
        <div className="border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Hamburger (Mobile) + Brand */}
            <div className="flex items-center gap-2 sm:gap-6">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-[#0064D9] hover:bg-slate-100 rounded-sm transition-colors"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* SAP-inspired Logo Emblem for Mercado */}
              <Link href="/argentinaEmpleos" className="flex items-center gap-2 group shrink-0">
                <div className="h-8 px-2.5 rounded-sm bg-[#0064D9] flex items-center justify-center font-bold text-white shadow-xs group-hover:bg-[#0050B3] transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#F59E0B] rounded-bl-xs" />
                  <span className="text-sm font-extrabold tracking-wider">M</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none flex items-center gap-0.5 sm:gap-1">
                    MERCADO<span className="text-[#0064D9]">RIS3</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5 hidden xs:inline">
                    Oportunidades & Talento
                  </span>
                </div>
              </Link>

              {/* Top Navigation Links (Desktop) */}
              <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-700">
                {topNavLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="hover:text-[#0064D9] transition-colors flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}

                {isSuperadmin && (
                  <Link
                    href="/argentinaEmpleos/admin"
                    className="text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1 transition-colors border border-amber-200"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin Center</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Right: Actions, Search, Notifications, Messages, Wallet, Switch to RIS3 & User Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Back to RIS3 Enterprise Platform Button */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all border border-slate-300 shadow-2xs"
                title="Volver a la Plataforma RIS3"
              >
                <span className="text-blue-600 font-black">←</span>
                <span>Plataforma RIS3</span>
              </Link>

              {/* User Location Chip (Desktop/Tablet) */}
              {user?.cityName && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#0064D9]" />
                  <span className="font-semibold text-slate-800">{user.cityName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 text-[11px]">{user.provinceName}</span>
                </div>
              )}

              {/* Quick Search Toggle / Input */}
              <div className="relative">
                {isSearchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => !searchQuery && setIsSearchOpen(false)}
                      placeholder="Buscar empleo..."
                      className="w-36 sm:w-64 pl-8 pr-2 py-1 bg-slate-50 border border-[#0064D9] rounded-sm text-xs text-slate-900 focus:outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </form>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="p-1.5 text-slate-600 hover:text-[#0064D9] hover:bg-slate-100 rounded-sm transition-colors"
                    title="Buscar en Argentina Empleos"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Direct Messages Shortcut */}
              {user ? (
                <Link
                  href="/argentinaEmpleos/mensajes"
                  className="p-1.5 text-slate-600 hover:text-[#0064D9] hover:bg-slate-100 rounded-sm transition-colors relative"
                  title="Bandeja de Mensajes"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadMessagesCount}
                    </span>
                  )}
                </Link>
              ) : null}

              {/* Notifications Dropdown */}
              {user ? (
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-1.5 text-slate-600 hover:text-[#0064D9] hover:bg-slate-100 rounded-sm transition-colors relative"
                    title="Notificaciones"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-sm shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-[#0064D9]" />
                          <span>Notificaciones</span>
                          {unreadNotifsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                              {unreadNotifsCount} nuevas
                            </span>
                          )}
                        </div>
                        {unreadNotifsCount > 0 && (
                          <button
                            onClick={handleMarkAllNotifsRead}
                            className="text-[10px] text-[#0064D9] hover:underline font-semibold"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No tienes notificaciones pendientes.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 transition-colors ${
                                !notif.read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 text-xs">{notif.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                  {new Date(notif.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                              {notif.link && (
                                <Link
                                  href={notif.link}
                                  onClick={() => setIsNotificationsOpen(false)}
                                  className="inline-block text-[11px] font-bold text-[#0064D9] hover:underline mt-1"
                                >
                                  Ver detalle →
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-center">
                        <Link
                          href="/argentinaEmpleos/mensajes"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-xs font-bold text-[#0064D9] hover:underline"
                        >
                          Ir al Centro de Mensajes
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Wallet Balance Badge (Responsive) */}
              {user ? (
                <Link
                  href="/argentinaEmpleos/billetera"
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-sm bg-blue-50/90 hover:bg-blue-100 border border-blue-200 transition-colors text-xs group shrink-0"
                  title="Billetera de Créditos Internos"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#0064D9]" />
                  <div className="flex flex-col text-right leading-none">
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-500">Saldo</span>
                    <span className="font-mono font-extrabold text-[#0064D9] text-[11px] sm:text-xs">
                      ${(wallet?.internalCredits || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </Link>
              ) : null}

              {/* User Profile Avatar with SAP Circle Initials Badge */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 p-0.5 sm:p-1 rounded-full hover:ring-2 hover:ring-[#0064D9]/20 transition-all focus:outline-hidden"
                  >
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0064D9] text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-2xs border-2 border-white">
                      <span>{getInitials(user.name)}</span>
                      {isSuperadmin ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white" title="Superadmin Verificado">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>
                  </button>

                  {/* User Dropdown Menu (SAP Style) */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-sm shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                        {user.email && !user.email.endsWith('@argentinaempleos.local') ? (
                          <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                        ) : (
                          <div className="text-[11px] text-slate-500 capitalize font-medium">
                            {user.userType ? `Perfil ${user.userType}` : 'Usuario Verificado'}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[#0064D9]">
                          <MapPin className="w-3 h-3" />
                          <span>{user.cityName || 'Posadas'}, {user.provinceName || 'Misiones'}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/argentinaEmpleos/perfil"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0064D9] font-medium"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Mi Perfil Profesional & CV</span>
                        </Link>

                        <Link
                          href="/argentinaEmpleos/mensajes"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0064D9] font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-slate-400" />
                            <span>Bandeja de Mensajes</span>
                          </div>
                          {unreadMessagesCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                              {unreadMessagesCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/argentinaEmpleos/billetera"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0064D9] font-medium"
                        >
                          <Wallet className="w-4 h-4 text-slate-400" />
                          <span>Mi Billetera & Retiros</span>
                        </Link>

                        <Link
                          href="/argentinaEmpleos/mis-publicaciones"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0064D9] font-medium"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span>Mis Publicaciones</span>
                        </Link>

                        <Link
                          href="/argentinaEmpleos/configuracion"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0064D9] font-medium"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Configuración</span>
                        </Link>

                        {isSuperadmin && (
                          <Link
                            href="/argentinaEmpleos/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-amber-900 bg-amber-50/70 hover:bg-amber-100 font-bold border-t border-amber-100 mt-1"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            <span>Panel Superadmin</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/argentinaEmpleos/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0064D9] hover:bg-[#0050B3] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* TIER 2: Secondary Section Sub-bar with Horizontal Swipeable Scrolling */}
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center overflow-x-auto custom-scrollbar no-scrollbar w-full sm:w-auto py-0.5">
              {/* Section Breadcrumb Label */}
              <div className="py-2.5 pr-3 border-r border-slate-200 hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-900 whitespace-nowrap">
                <span>Portal</span>
              </div>

              {/* Underline Tabs */}
              <nav className="flex items-center gap-0.5 sm:gap-1 pl-1">
                {subNavTabs.map((tab) => {
                  const isActive = tab.exact
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);

                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`relative py-2.5 sm:py-3 px-2.5 sm:px-3.5 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? 'text-[#0064D9] font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {Boolean(tab.badge && tab.badge > 0) && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                          {tab.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0064D9] rounded-t-xs" />
                      )}
                    </Link>
                  );
                })}

              </nav>
            </div>

            {/* Right Sub-bar shortcut: Post Job Button (Hidden on smallest mobile) */}
            <div className="hidden lg:flex items-center py-2 shrink-0">
              <Link
                href="/argentinaEmpleos/publicar"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0064D9] hover:bg-[#0050B3] text-white text-xs font-bold rounded-sm shadow-2xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Publicar Empleo</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN SLIDE-OVER DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative max-w-xs w-full bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-7 px-2 rounded-sm bg-[#0064D9] text-white font-extrabold text-xs flex items-center justify-center">
                  AE
                </div>
                <span className="font-extrabold text-xs text-slate-900">
                  Argentina<span className="text-[#0064D9]">Empleos</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer User Card */}
            {user ? (
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0064D9] text-white font-bold text-xs flex items-center justify-center">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{user.name}</div>
                  <div className="text-[10px] text-[#0064D9] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{user.cityName || 'Posadas'}, {user.provinceName || 'Misiones'}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Navegación
              </div>
              {[
                { href: '/argentinaEmpleos', label: 'Inicio / Resumen', icon: Building2 },
                { href: '/argentinaEmpleos/trabajos', label: 'Explorar Empleos', icon: Search },
                { href: '/argentinaEmpleos/mensajes', label: 'Bandeja de Mensajes', icon: MessageSquare, badge: unreadMessagesCount },
                { href: '/argentinaEmpleos/publicar', label: 'Publicar Vacante', icon: PlusCircle },
                { href: '/argentinaEmpleos/mis-publicaciones', label: 'Mis Publicaciones', icon: Briefcase },
                { href: '/argentinaEmpleos/billetera', label: 'Mi Billetera & Saldo', icon: Wallet },
                { href: '/argentinaEmpleos/perfil', label: 'Perfil Profesional & CV', icon: User },
                { href: '/argentinaEmpleos/configuracion', label: 'Configuración', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0064D9] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {isSuperadmin && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 px-3 py-1">
                    Administración
                  </div>
                  <Link
                    href="/argentinaEmpleos/admin"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Panel Superadmin</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              {user ? (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <Link
                  href="/argentinaEmpleos/login"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-full py-2.5 px-3 bg-[#0064D9] hover:bg-[#0050B3] text-white font-bold text-xs rounded-sm transition-colors text-center block"
                >
                  Ingresar con Google
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
