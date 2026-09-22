'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Briefcase,
  Bot,
  Wallet,
  CreditCard,
  History,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperadmin, loading } = useAEAuth();

  const adminNav = [
    { href: '/argentinaEmpleos/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/argentinaEmpleos/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/argentinaEmpleos/admin/trabajos', label: 'Trabajos & Moderación', icon: Briefcase },
    { href: '/argentinaEmpleos/admin/ia', label: 'Generación IA', icon: Bot },
    { href: '/argentinaEmpleos/admin/billeteras', label: 'Billeteras & Créditos', icon: Wallet },
    { href: '/argentinaEmpleos/admin/retiros', label: 'Solicitudes de Retiro', icon: CreditCard },
    { href: '/argentinaEmpleos/admin/auditoria', label: 'Auditoría', icon: History },
  ];

  if (loading) {
    return (
      <AEShell showSidebar={false}>
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Verificando permisos de superadmin...</p>
        </div>
      </AEShell>
    );
  }

  if (!isSuperadmin) {
    return (
      <AEShell showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-sm p-8 text-center shadow-md space-y-4">
          <div className="w-12 h-12 rounded-sm bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Acceso Restringido
          </h2>
          <p className="text-xs text-slate-600">
            Se requiere el rol <code>superadmin</code> oficial para acceder al Centro de Administración de Argentina Empleos.
          </p>
          <Link
            href="/argentinaEmpleos"
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#106EBE] text-white text-xs font-bold rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Argentina Empleos</span>
          </Link>
        </div>
      </AEShell>
    );
  }

  return (
    <AEShell showSidebar={false}>
      <div className="space-y-5">
        {/* Admin Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-[#0F1D38] to-[#162A4E] border border-amber-800/60 rounded-sm p-5 text-white shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-sm bg-amber-600 text-white shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                    Rol: SUPERADMIN
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-300 font-mono">{user?.email}</span>
                </div>
                <h1 className="text-lg font-extrabold tracking-tight mt-0.5">
                  Centro de Administración • Argentina Empleos
                </h1>
              </div>
            </div>

            <Link
              href="/argentinaEmpleos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver como usuario</span>
            </Link>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="bg-white border border-slate-200 rounded-sm p-1.5 shadow-2xs overflow-x-auto flex items-center gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/argentinaEmpleos/admin'
                ? pathname === '/argentinaEmpleos/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#106EBE] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Page Content */}
        <div>{children}</div>
      </div>
    </AEShell>
  );
}
