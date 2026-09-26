'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  Filter,
  Check,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { BusinessOpportunity, BusinessOpportunityStatus } from '@/types';
import { api } from '@/lib/api';

interface BusinessDiagnosticProps {
  opportunities: BusinessOpportunity[];
  onOpportunitiesUpdated: (updated: BusinessOpportunity[]) => void;
  onConsultOpportunity?: (opportunity: BusinessOpportunity) => void;
}

export function BusinessDiagnostic({
  opportunities,
  onOpportunitiesUpdated,
  onConsultOpportunity,
}: BusinessDiagnosticProps) {
  const [diagnosing, setDiagnosing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRunDiagnostic = async () => {
    setDiagnosing(true);
    try {
      const res = await api.businessBoost.diagnose();
      onOpportunitiesUpdated(res);
    } catch (err: any) {
      alert(`Error al ejecutar el diagnóstico: ${err.message}`);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleStatusChange = async (oppId: string, newStatus: BusinessOpportunityStatus) => {
    setUpdatingId(oppId);
    try {
      await api.businessBoost.updateOpportunityStatus(oppId, newStatus);
      const updated = opportunities.map((o) =>
        o.id === oppId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
      );
      onOpportunitiesUpdated(updated);
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = opportunities.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const pendingCount = opportunities.filter((o) => o.status === 'pending').length;
  const inProgressCount = opportunities.filter((o) => o.status === 'in_progress').length;
  const completedCount = opportunities.filter((o) => o.status === 'completed').length;
  const highImpactCount = opportunities.filter((o) => o.impact === 'high').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Zap size={14} />
              Motor de Diagnóstico RIS3
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Oportunidades de Mejora Detectadas
            </h2>
            <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-relaxed">
              RIS3 analiza la información comercial, presencia y productos de tu negocio para detectar brechas y proponer acciones de crecimiento concretas.
            </p>
          </div>

          <button
            onClick={handleRunDiagnostic}
            disabled={diagnosing}
            className="flex items-center gap-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold px-5 py-3 text-xs transition-all shadow-lg shadow-amber-950/40 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw size={15} className={diagnosing ? 'animate-spin' : ''} />
            {diagnosing ? 'Analizando negocio...' : 'Ejecutar Diagnóstico IA'}
          </button>
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[11px] text-zinc-500 block">Total Oportunidades</span>
            <span className="text-xl font-bold text-white">{opportunities.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[11px] text-amber-400/80 block">Pendientes</span>
            <span className="text-xl font-bold text-amber-400">{pendingCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[11px] text-blue-400/80 block">En Progreso</span>
            <span className="text-xl font-bold text-blue-400">{inProgressCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[11px] text-emerald-400/80 block">Completadas</span>
            <span className="text-xl font-bold text-emerald-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs w-fit">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todas ({opportunities.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'in_progress'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-zinc-400 hover:text-blue-300'
            }`}
          >
            En Progreso ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterStatus === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Completadas ({completedCount})
          </button>
        </div>

        {highImpactCount > 0 && (
          <span className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" />
            {highImpactCount} oportunidades de alto impacto comercial
          </span>
        )}
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.length > 0 ? (
            filtered.map((opp) => {
              const isPending = opp.status === 'pending';
              const isInProgress = opp.status === 'in_progress';
              const isCompleted = opp.status === 'completed';

              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-zinc-950/40 opacity-90'
                      : isInProgress
                      ? 'border-blue-500/30 bg-zinc-900/80 shadow-md'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                            opp.impact === 'high'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : opp.impact === 'low'
                              ? 'bg-zinc-800 text-zinc-400'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          Impacto {opp.impact === 'high' ? 'Alto' : opp.impact === 'low' ? 'Bajo' : 'Medio'}
                        </span>
                        {opp.category && (
                          <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 border border-zinc-700/50">
                            {opp.category}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500">ID: {opp.id}</span>
                      </div>

                      <h3
                        className={`text-base font-bold ${
                          isCompleted ? 'text-zinc-400 line-through' : 'text-white'
                        }`}
                      >
                        {opp.title}
                      </h3>

                      {/* Descripción */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                          Descripción
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{opp.description}</p>
                      </div>

                      {/* Motivo */}
                      <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/70 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1.5">
                          <Lightbulb size={13} />
                          Motivo
                        </span>
                        <p className="text-xs text-zinc-400 leading-relaxed">{opp.reason}</p>
                      </div>

                      {/* Acción sugerida */}
                      <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3 space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp size={13} />
                          Acción sugerida
                        </span>
                        <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                          {opp.suggestedAction}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions Column */}
                    <div className="flex flex-col sm:items-end justify-between gap-4 shrink-0 pt-2 md:pt-0">
                      {/* Estado selector buttons: Pendiente -> En progreso -> Completado */}
                      <div className="space-y-1.5 w-full sm:w-auto">
                        <span className="text-[11px] font-semibold text-zinc-500 block sm:text-right">
                          Estado
                        </span>
                        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                          <button
                            onClick={() => handleStatusChange(opp.id, 'pending')}
                            disabled={updatingId === opp.id}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Pendiente
                          </button>
                          <button
                            onClick={() => handleStatusChange(opp.id, 'in_progress')}
                            disabled={updatingId === opp.id}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                              isInProgress
                                ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            En progreso
                          </button>
                          <button
                            onClick={() => handleStatusChange(opp.id, 'completed')}
                            disabled={updatingId === opp.id}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            Completado
                          </button>
                        </div>
                      </div>

                      {/* Shortcut to Assistant */}
                      {onConsultOpportunity && (
                        <button
                          onClick={() => onConsultOpportunity(opp)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-emerald-400 bg-zinc-800/60 hover:bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700/60 transition-all"
                        >
                          <MessageSquare size={13} className="text-emerald-400" />
                          Consultar al Asistente
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-semibold text-zinc-300">
                  {filterStatus === 'all'
                    ? 'No hay oportunidades registradas todavía'
                    : `No hay oportunidades con estado "${filterStatus}"`}
                </h4>
                <p className="text-xs text-zinc-500">
                  Ejecuta el diagnóstico para que RIS3 evalúe la información de tu negocio y detecte oportunidades concretas.
                </p>
              </div>
              <button
                onClick={handleRunDiagnostic}
                disabled={diagnosing}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 text-xs transition-all shadow-md"
              >
                <Zap size={14} />
                Ejecutar Diagnóstico Ahora
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
