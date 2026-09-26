'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cctv,
  Tv,
  MapPin,
  Activity,
  Bell,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react';

export function MonitoringSidebar() {
  const pathname = usePathname();

  if (pathname?.includes('/monitor/remote-camera')) {
    return null;
  }

  const navItems = [
    { href: '/monitor/live', label: 'Monitoreo en Vivo', shortLabel: 'En Vivo', icon: Tv },
    { href: '/monitor/analytics', label: 'Analítica de Interacción', shortLabel: 'Analítica', icon: BarChart3 },
    { href: '/monitor/cameras', label: 'Gestor de Métricas & Cámaras', shortLabel: 'Cámaras', icon: Cctv },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex md:w-16 lg:w-60 bg-[#F4F6F9] border-r border-[#D9E1E8] flex-col shrink-0 select-none transition-all duration-200">
        
        {/* Product Module Sub-Header */}
        <div className="px-3 lg:px-4 py-3.5 border-b border-[#D9E1E8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-[#0070F2] shrink-0" />
            <span className="hidden lg:inline text-xs font-bold text-[#1C2D42] uppercase tracking-wide truncate">
              Centro de Control
            </span>
          </div>
          <span className="hidden lg:inline text-[10px] font-semibold bg-blue-50 text-[#0070F2] border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
            v1.0
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 lg:p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center lg:justify-between px-2.5 lg:px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-white text-[#0070F2] shadow-xs border border-[#D9E1E8] font-bold md:border-l-4 md:border-l-[#0070F2]'
                    : 'text-[#556B82] hover:text-[#1C2D42] hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#0070F2]' : 'text-[#7D90A4] group-hover:text-[#1C2D42]'
                    }`}
                  />
                  <span className="hidden lg:inline truncate">{item.label}</span>
                </div>

                {isActive && <ChevronRight size={13} className="hidden lg:inline text-[#0070F2] shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer System Status Banner (Desktop only) */}
        <div className="hidden lg:block p-3 border-t border-[#D9E1E8] bg-white m-3 rounded-xl border shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500">Motor de Visión</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Listo
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Pipeline BlazeFace + EfficientDet activo en tiempo real.
          </p>
        </div>

      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D9E1E8] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#0070F2] font-bold'
                  : 'text-[#556B82] hover:text-[#1C2D42]'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#0070F2]' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
