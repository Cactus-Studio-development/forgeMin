'use client';

import React, { useState } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import {
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Users,
  Calendar,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Cctv,
} from 'lucide-react';

export default function MonitoringAnalyticsPage() {
  const { dashboardData, cameras } = useMonitoring();
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');
  const [selectedCameraFilter, setSelectedCameraFilter] = useState('');

  const hourly = dashboardData?.hourlyTraffic || [];
  const historical = dashboardData?.historicalToday;

  const maxTrafficHour = Math.max(...hourly.map((h) => h.entries + h.exits), 10);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Inteligencia Operacional
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Analítica de Flujo & Afluencia
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Métricas consolidadas de tránsito, afluencia horaria y permanencia en zonas físicas.
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === 'today' ? 'bg-white text-[#0070F2] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === '7d' ? 'bg-white text-[#0070F2] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 7 Días
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === '30d' ? 'bg-white text-[#0070F2] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Afluencia Total (Entradas)</span>
            <ArrowDownRight size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">
            {historical?.entriesToday || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Registradas por visión artificial</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Egresos Totales (Salidas)</span>
            <ArrowUpRight size={16} className="text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">
            {historical?.exitsToday || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Conteo en sectores de salida</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Tiempo Medio de Permanencia</span>
            <Clock size={16} className="text-[#0070F2]" />
          </div>
          <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">
            {historical?.avgDwellMinutes ? `${historical.avgDwellMinutes} min` : '0 min'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Duración en áreas comerciales</p>
        </div>

        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Hora Pico de Tráfico</span>
            <TrendingUp size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">
            {historical?.peakHour || 'N/A'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Máxima concentración detectada</p>
        </div>

      </div>

      {/* Hourly Flow Chart Section */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#0070F2]" />
            <h3 className="text-sm font-bold text-[#1C2D42]">
              Distribución de Tráfico por Hora del Día (00:00 - 23:00)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Entradas
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Salidas
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-48 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto">
          {hourly.map((bucket, idx) => {
            const entryHeight = Math.max(Math.round((bucket.entries / maxTrafficHour) * 100), 4);
            const exitHeight = Math.max(Math.round((bucket.exits / maxTrafficHour) * 100), 4);

            return (
              <div key={bucket.hour} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group">
                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div
                    className="w-2.5 bg-emerald-500 rounded-t-sm transition-all group-hover:brightness-110"
                    style={{ height: `${entryHeight}%` }}
                    title={`${bucket.hour} - Entradas: ${bucket.entries}`}
                  />
                  <div
                    className="w-2.5 bg-rose-500 rounded-t-sm transition-all group-hover:brightness-110"
                    style={{ height: `${exitHeight}%` }}
                    title={`${bucket.hour} - Salidas: ${bucket.exits}`}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-500 truncate">
                  {idx % 2 === 0 ? bucket.hour.slice(0, 2) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Breakdown Table */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#0070F2]" />
            <h3 className="text-sm font-bold text-[#1C2D42]">
              Rendimiento Operacional por Zonas Físicas
            </h3>
          </div>
        </div>

        {dashboardData?.zoneCirculation && dashboardData.zoneCirculation.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Zona</th>
                  <th className="py-3 px-4">Cámara</th>
                  <th className="py-3 px-4 text-center">Entradas Acumuladas</th>
                  <th className="py-3 px-4 text-center">Salidas Acumuladas</th>
                  <th className="py-3 px-4 text-right">Ocupación Pico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.zoneCirculation.map((z) => (
                  <tr key={z.zoneId} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{z.zoneName}</td>
                    <td className="py-3 px-4 text-slate-600">{z.cameraName}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{z.totalEntriesToday}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold">{z.totalExitsToday}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#0070F2]">{z.currentCount} personas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay estadísticas de zonas disponibles todavía.
          </div>
        )}
      </div>

    </div>
  );
}
