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

  const navItems = [
    { href: '/monitor/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/monitor/cameras', label: 'Cámaras', icon: Cctv },
    { href: '/monitor/live', label: 'Vista en vivo', icon: Tv },
    { href: '/monitor/zones', label: 'Zonas', icon: MapPin },
    { href: '/monitor/events', label: 'Eventos', icon: Activity },
    { href: '/monitor/alerts', label: 'Alertas', icon: Bell },
    { href: '/monitor/analytics', label: 'Analítica', icon: BarChart3 },
    { href: '/monitor/reports', label: 'Reportes', icon: FileText },
    { href: '/monitor/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#F4F6F9] border-r border-[#D9E1E8] flex flex-col shrink-0 select-none">
      
      {/* Product Module Sub-Header */}
      <div className="px-4 py-3.5 border-b border-[#D9E1E8] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0070F2]" />
          <span className="text-xs font-bold text-[#1C2D42] uppercase tracking-wide">
            Centro de Control
          </span>
        </div>
        <span className="text-[10px] font-semibold bg-blue-50 text-[#0070F2] border border-blue-200 px-1.5 py-0.5 rounded">
          v1.0
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href || pathname === '/monitor'
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-white text-[#0070F2] shadow-xs border border-[#D9E1E8] font-bold border-l-4 border-l-[#0070F2]'
                  : 'text-[#556B82] hover:text-[#1C2D42] hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-[#0070F2]' : 'text-[#7D90A4] group-hover:text-[#1C2D42]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {isActive && <ChevronRight size={13} className="text-[#0070F2] shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status Banner */}
      <div className="p-3 border-t border-[#D9E1E8] bg-white m-3 rounded-xl border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-500">Motor de Visión</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Listo
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Pipeline YOLO + ByteTrack en espera de streams RTSP/ONVIF.
        </p>
      </div>

    </aside>
  );
}
