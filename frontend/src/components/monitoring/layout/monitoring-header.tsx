'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import {
  Cctv,
  Building2,
  ChevronDown,
  Bell,
  RefreshCw,
  Layers,
  Briefcase,
  Store,
  LogOut,
  ShieldCheck,
  Radio,
  Sliders,
} from 'lucide-react';

export function MonitoringHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { organizationId, setOrganizationId, refreshDashboard, refreshCameras, dashboardData } = useMonitoring();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProductSwitcherOpen, setIsProductSwitcherOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);
  const prodRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const organizations = [
    { id: 'org_sede_central', name: 'Sede Central & Corporativo' },
    { id: 'org_planta_industrial', name: 'Planta Logística & Almacén' },
    { id: 'org_sucursal_comercial', name: 'Sucursal Comercial Centro' },
  ];

  const currentOrg = organizations.find((o) => o.id === organizationId) || organizations[0];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshDashboard(), refreshCameras()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
      if (prodRef.current && !prodRef.current.contains(event.target as Node)) {
        setIsProductSwitcherOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAlertsCount = dashboardData?.realtime?.activeAlertsCount || 0;

  return (
    <header className="hidden md:block bg-[#1C2D42] text-white border-b border-[#2C3E55] sticky top-0 z-40 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Left: Product Branding & SAP Fiori Shell Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0070F2] text-white flex items-center justify-center shadow-xs">
              <Cctv size={18} className="stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-[#0070F2] uppercase">RIS3</span>
                <span className="text-sm font-bold text-white tracking-tight">MONITOREO</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none">
                Enterprise Vision & Analytics
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-700 hidden sm:block mx-1" />

          {/* Product Switcher Dropdown */}
          <div className="relative" ref={prodRef}>
            <button
              onClick={() => setIsProductSwitcherOpen(!isProductSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
              title="Cambiar de producto en el ecosistema RIS3"
            >
              <Layers size={14} className="text-[#0070F2]" />
              <span className="hidden md:inline">Ecosistema RIS3</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${isProductSwitcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProductSwitcherOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Productos del Ecosistema RIS3
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setIsProductSwitcherOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Briefcase size={13} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-blue-600">Gestor de Negocio</p>
                    <p className="text-[10px] text-slate-500">Administración comercial & proyectos</p>
                  </div>
                </Link>

                <Link
                  href="/argentinaEmpleos"
                  onClick={() => setIsProductSwitcherOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Store size={13} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-amber-600">Argentina Empleos</p>
                    <p className="text-[10px] text-slate-500">Portal de empleo & servicios</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-50/70 border-l-4 border-[#0070F2]">
                  <div className="w-6 h-6 rounded-md bg-[#0070F2] text-white flex items-center justify-center shrink-0">
                    <Cctv size={13} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">MONITOREO (Activo)</p>
                    <p className="text-[10px] text-slate-500">Visión computacional y métricas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Organization selector, live telemetry indicator, alerts, and user menu */}
        <div className="flex items-center gap-3">
          
          {/* Organization Switcher */}
          <div className="relative" ref={orgRef}>
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <Building2 size={14} className="text-slate-400" />
              <span className="max-w-[150px] truncate hidden sm:inline">{currentOrg.name}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Organización / Planta Activa
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setOrganizationId(org.id);
                      setIsOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      org.id === organizationId ? 'font-bold text-[#0070F2] bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === organizationId && <div className="w-1.5 h-1.5 rounded-full bg-[#0070F2]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick manual refresh */}
          <button
            onClick={handleManualRefresh}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Sincronizar telemetría"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#0070F2]' : ''} />
          </button>

          {/* Alerts Counter Link */}
          <Link
            href="/monitor/alerts"
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Centro de Alertas"
          >
            <Bell size={16} />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#1C2D42] animate-pulse" />
            )}
          </Link>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-7 h-7 rounded-full border border-slate-600" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0070F2] text-white flex items-center justify-center text-xs font-bold border border-blue-400">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user?.displayName || 'Operador de Monitoreo'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || 'operaciones@ris3.ai'}</p>
                </div>
                <Link
                  href="/monitor/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Sliders size={14} className="text-slate-400" />
                  <span>Configuración de Producto</span>
                </Link>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut size={14} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
