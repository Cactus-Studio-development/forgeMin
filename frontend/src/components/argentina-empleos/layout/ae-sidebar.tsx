'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import {
  Building2,
  Search,
  PlusCircle,
  Briefcase,
  Wallet,
  Settings,
  ShieldCheck,
  MapPin,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export function AESidebar() {
  const pathname = usePathname();
  const { user, wallet, isSuperadmin } = useAEAuth();

  const links = [
    { href: '/argentinaEmpleos', label: 'Inicio / Feed', icon: Building2 },
    { href: '/argentinaEmpleos/trabajos', label: 'Explorar Trabajos', icon: Search },
    { href: '/argentinaEmpleos/mensajes', label: 'Bandeja de Mensajes', icon: MessageSquare },
    { href: '/argentinaEmpleos/publicar', label: 'Publicar Vacante', icon: PlusCircle },
    { href: '/argentinaEmpleos/mis-publicaciones', label: 'Mis Publicaciones', icon: Briefcase },
    { href: '/argentinaEmpleos/billetera', label: 'Billetera & Saldo', icon: Wallet },
    { href: '/argentinaEmpleos/perfil', label: 'Mi Perfil & CV', icon: Building2 },
    { href: '/argentinaEmpleos/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden sticky top-20">
        {/* User Card */}
        {user ? (
          <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#106EBE] text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate">{user.name}</span>
                {user.email && !user.email.endsWith('@argentinaempleos.local') ? (
                  <span className="text-[11px] text-slate-500 truncate">{user.email}</span>
                ) : (
                  <span className="text-[11px] text-slate-500 capitalize font-medium">
                    {user.userType ? `Perfil ${user.userType}` : 'Usuario Verificado'}
                  </span>
                )}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-[#106EBE] font-semibold">
                  <MapPin className="w-3 h-3 text-[#106EBE]" />
                  <span>{user.cityName || 'Posadas'}, {user.provinceName || 'Misiones'}</span>
                </div>
              </div>
            </div>

            {/* Wallet pill in sidebar */}
            <div className="mt-3 p-2.5 rounded-sm bg-slate-100/90 border border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Créditos Internos</span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  $ {(wallet?.internalCredits || 0).toLocaleString('es-AR')} ARS
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                Activo
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
            <p className="text-xs text-slate-600 font-medium mb-3">
              Registrate y recibí <span className="font-bold text-[#106EBE]">$25.000 ARS</span> en créditos de bienvenida.
            </p>
            <Link
              href="/argentinaEmpleos/login"
              className="block w-full text-center py-1.5 px-3 bg-[#106EBE] text-white text-xs font-bold rounded-sm hover:bg-[#005A9E] transition-colors"
            >
              Comenzar Ahora
            </Link>
          </div>
        )}

        {/* Navigation Section */}
        <div className="p-2 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/argentinaEmpleos'
                ? pathname === '/argentinaEmpleos'
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#106EBE]/10 text-[#106EBE] border-l-2 border-[#106EBE]'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#106EBE]' : 'text-slate-500'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Superadmin Exclusive Panel Link */}
        {isSuperadmin && (
          <div className="p-2 border-t border-slate-200 bg-amber-50/50">
            <Link
              href="/argentinaEmpleos/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-bold transition-colors ${
                pathname.startsWith('/argentinaEmpleos/admin')
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-900 hover:bg-amber-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panel Superadmin</span>
            </Link>
          </div>
        )}

        {/* Return to RIS3 Main Platform */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px]">
          <Link
            href="/dashboard"
            className="flex items-center justify-between text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <span>Volver a RIS3 Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
