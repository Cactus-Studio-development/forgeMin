'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AdminStats } from '@/components/argentina-empleos/admin/admin-stats';
import { AIJobGeneratorModal } from '@/components/argentina-empleos/admin/ai-job-generator-modal';
import { AdminDashboardMetrics } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Bot,
  Users,
  Briefcase,
  Wallet,
  CreditCard,
  History,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAEAuth();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);

  const loadMetrics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.getDashboard(user.id);
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  if (loading || !metrics) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando métricas de administración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <AdminStats metrics={metrics} />

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-[#106EBE] to-[#005A9E] p-6 rounded-sm text-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0FFCBE] uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" />
            <span>Motor de Contenido y Publicaciones IA</span>
          </div>
          <h2 className="text-base font-bold">
            Generar Vacantes y Publicaciones Demostrativas
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Creá publicaciones estructuradas con Gemini para dinamizar categorías y regiones específicas en Argentina con sourceType: AI_GENERATED.
          </p>
        </div>

        <button
          onClick={() => setShowAIModal(true)}
          className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#106EBE] font-bold text-xs rounded-sm transition-colors shadow-xs shrink-0"
        >
          Generar Vacante con IA
        </button>
      </div>

      {/* Recent Activity & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Audit Logs */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Auditoría Reciente de Acciones
            </h3>
            <Link
              href="/argentinaEmpleos/admin/auditoria"
              className="text-xs font-bold text-[#106EBE] hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {metrics.recentLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No hay registros de auditoría recientes.
              </div>
            ) : (
              metrics.recentLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    Por <strong>{log.adminEmail}</strong> • Destino: {log.targetType} ({log.targetId})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Accesos de Gestión
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/argentinaEmpleos/admin/usuarios"
              className="p-4 rounded-sm border border-slate-200 hover:border-[#106EBE] hover:bg-blue-50/30 transition-all flex flex-col items-start gap-1"
            >
              <Users className="w-5 h-5 text-[#106EBE]" />
              <span className="font-bold text-slate-900 text-xs">Gestionar Usuarios</span>
              <span className="text-[11px] text-slate-500">Perfiles, saldos y bloqueos</span>
            </Link>

            <Link
              href="/argentinaEmpleos/admin/billeteras"
              className="p-4 rounded-sm border border-slate-200 hover:border-[#106EBE] hover:bg-blue-50/30 transition-all flex flex-col items-start gap-1"
            >
              <Wallet className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-900 text-xs">Otorgar Créditos</span>
              <span className="text-[11px] text-slate-500">Asignar créditos adicionales</span>
            </Link>

            <Link
              href="/argentinaEmpleos/admin/trabajos"
              className="p-4 rounded-sm border border-slate-200 hover:border-[#106EBE] hover:bg-blue-50/30 transition-all flex flex-col items-start gap-1"
            >
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900 text-xs">Moderar Trabajos</span>
              <span className="text-[11px] text-slate-500">Publicadas, anónimas y de IA</span>
            </Link>

            <Link
              href="/argentinaEmpleos/admin/retiros"
              className="p-4 rounded-sm border border-slate-200 hover:border-[#106EBE] hover:bg-blue-50/30 transition-all flex flex-col items-start gap-1"
            >
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-slate-900 text-xs">Moderar Retiros</span>
              <span className="text-[11px] text-slate-500">Aprobación de fondos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      <AIJobGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onJobPublished={loadMetrics}
      />
    </div>
  );
}
