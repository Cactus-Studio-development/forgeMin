'use client';

import React from 'react';
import { AdminDashboardMetrics } from '@/lib/argentina-empleos/types';
import {
  Users,
  Briefcase,
  Bot,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface AdminStatsProps {
  metrics: AdminDashboardMetrics;
}

export function AdminStats({ metrics }: AdminStatsProps) {
  const cards = [
    {
      title: 'Total Usuarios',
      value: metrics.totalUsers,
      sub: `+${metrics.newUsersThisWeek} esta semana`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Vacantes Activas',
      value: metrics.activeJobs,
      sub: `${metrics.totalJobs} en total`,
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Publicaciones IA',
      value: metrics.aiJobs,
      sub: `${metrics.adminCreatedJobs} administrativas`,
      icon: Bot,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Créditos Otorgados',
      value: `$ ${metrics.totalCreditsIssued.toLocaleString('es-AR')}`,
      sub: `${metrics.welcomeCreditsCount} de bienvenida`,
      icon: Wallet,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Retiros Pendientes',
      value: metrics.pendingWithdrawalsCount,
      sub: `$ ${metrics.totalPendingWithdrawalAmount.toLocaleString('es-AR')} ARS`,
      icon: CreditCard,
      color: metrics.pendingWithdrawalsCount > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: metrics.pendingWithdrawalsCount > 0 ? 'bg-rose-50' : 'bg-slate-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <span className={`p-1 rounded-xs ${card.bg} ${card.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
