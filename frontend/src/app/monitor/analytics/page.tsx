'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  UserCheck,
  Flame,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import {
  getRealInteractionHistory,
  getRealDemographicsSummary,
  clearRealTelemetry,
  IRealInteractionTelemetry,
  IRealDemographicsSummary
} from '@/lib/monitoring/real-telemetry';

export default function MonitoringAnalyticsPage() {
  const [interactions, setInteractions] = useState<IRealInteractionTelemetry[]>([]);
  const [demographics, setDemographics] = useState<IRealDemographicsSummary>({
    maleCount: 0,
    femaleCount: 0,
    childCount: 0,
    totalUniquePeople: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const loadData = () => {
    setInteractions(getRealInteractionHistory());
    setDemographics(getRealDemographicsSummary());
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmClear = () => {
    clearRealTelemetry();
    loadData();
    setIsClearModalOpen(false);
    setToastMessage('✓ Toda la analítica e interacciones han sido restablecidas a cero.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute Object Frequency
  const objectCounts: Record<string, { count: number; icon: string; category: string }> = {};
  interactions.forEach((item) => {
    if (!objectCounts[item.objectName]) {
      objectCounts[item.objectName] = { count: 0, icon: item.icon, category: item.category };
    }
    objectCounts[item.objectName].count += 1;
  });

  const sortedObjects = Object.entries(objectCounts).sort((a, b) => b[1].count - a[1].count);

  const malePercent = demographics.totalUniquePeople > 0
    ? Math.round((demographics.maleCount / demographics.totalUniquePeople) * 100)
    : 0;
  const femalePercent = demographics.totalUniquePeople > 0
    ? Math.round((demographics.femaleCount / demographics.totalUniquePeople) * 100)
    : 0;
  const childPercent = demographics.totalUniquePeople > 0
    ? Math.round((demographics.childCount / demographics.totalUniquePeople) * 100)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Gestor de Métricas & Telemetría
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Analítica de Interacción & Demografía
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Métricas acumuladas de interacciones sostenidas (3s+), clasificación demográfica y frecuencia de objetos distinguidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border border-slate-300 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Trash2 size={15} />
            <span>Limpiar Telemetría</span>
          </button>

          <Link
            href="/monitor/live"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0070F2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <span>Ver Cámara en Vivo</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-700 px-2 py-0.5 rounded font-bold">REINICIADO</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Interacciones (3s+) Confirmadas</span>
            <Flame size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[#1C2D42] mt-2">
            {interactions.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Sostenidas durante al menos 3 segundos</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Personas Únicas Registradas</span>
            <Users size={16} className="text-[#0070F2]" />
          </div>
          <p className="text-2xl font-black text-[#1C2D42] mt-2">
            {demographics.totalUniquePeople}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Conteo agregado en transmisión</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Objetos Distinguidos Únicos</span>
            <Package size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-[#1C2D42] mt-2">
            {sortedObjects.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Categorías distintas manipuladas</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Tiempo Total de Interacción</span>
            <Clock size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#1C2D42] mt-2">
            {(interactions.length * 3.0).toFixed(0)} seg
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Permanencia acumulada activa</p>
        </div>

      </div>

      {/* Demographics Ratio & Object Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Demographics Breakdown */}
        <div className="lg:col-span-6 bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-purple-600" />
              <h2 className="text-sm font-bold text-[#1C2D42]">
                Distribución Demográfica de Personas
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total: {demographics.totalUniquePeople}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Masculino
                </span>
                <span>{demographics.maleCount} ({malePercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${malePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Femenino
                </span>
                <span>{demographics.femaleCount} ({femalePercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${femalePercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Niños / Infantes
                </span>
                <span>{demographics.childCount} ({childPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${childPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Objects Ranking */}
        <div className="lg:col-span-6 bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-cyan-600" />
              <h2 className="text-sm font-bold text-[#1C2D42]">
                Ranking de Objetos Distinguidos Sostenidos
              </h2>
            </div>
            <span className="text-xs font-bold text-[#0070F2]">Top Frecuencia</span>
          </div>

          <div className="space-y-2.5 pt-1 max-h-[160px] overflow-y-auto">
            {sortedObjects.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No hay objetos sostenidos registrados aún.
              </div>
            ) : (
              sortedObjects.map(([name, data]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{data.icon}</span>
                    <div>
                      <p className="font-bold text-[#1C2D42]">{name}</p>
                      <p className="text-[10px] text-slate-500">{data.category}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#0070F2] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {data.count} {data.count === 1 ? 'vez' : 'veces'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Tabular Audit Log of Confirmed Interactions */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#0070F2]" />
            <h2 className="text-sm font-bold text-[#1C2D42]">
              Registro Histórico de Interacciones Sostenidas (3s+)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {interactions.length} eventos en BD
          </span>
        </div>

        {interactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Clock size={32} className="mx-auto opacity-30" />
            <p className="text-xs font-semibold">El registro de telemetría está vacío.</p>
            <p className="text-[11px] text-slate-400">
              Inicie la cámara en la sección de Monitoreo en Vivo para generar nuevas métricas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Objeto / Acción</th>
                  <th className="py-3 px-4">Sujeto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Duración Mínima</th>
                  <th className="py-3 px-4 text-right">Hora Registrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.objectName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      Persona #{item.personId} ({item.gender})
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                      {item.durationSeconds}s
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono">
                      {item.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 text-center space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1C2D42]">
                ¿Limpiar Telemetría & Registros?
              </h3>
              <p className="text-xs text-[#556B82] mt-1.5 leading-relaxed">
                Esta acción eliminará de forma irreversible el historial de <strong>{interactions.length} interacciones</strong>, el desglose demográfico y restablecerá todas las métricas de analítica.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 text-left flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span>Los gráficos y tablas de auditoría se reiniciarán a cero inmediatamente.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClear}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Sí, Limpiar Todo</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
