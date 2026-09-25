'use client';

import React, { useState } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function MonitoringReportsPage() {
  const { dashboardData, organizationId, cameras } = useMonitoring();
  const [reportType, setReportType] = useState('daily_traffic');
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGenerateReport = () => {
    setGenerating(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setGenerating(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Consolidados Ejecutivos
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Generador de Reportes Operacionales
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Exportación de informes consolidados de flujo, aforo y eventos para auditoría y dirección.
          </p>
        </div>
      </div>

      {/* Report Config Box */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Parámetros del Informe
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Informe:
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium"
            >
              <option value="daily_traffic">Resumen Diario de Afluencia & Tráfico</option>
              <option value="zone_dwell">Análisis de Ocupación y Permanencia por Zona</option>
              <option value="incidents_log">Bitácora de Eventos e Incidencias Críticas</option>
              <option value="camera_uptime">Disponibilidad y Conectividad de Cámaras</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Período:
            </label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-medium">
              <option value="today">Día en curso (Hoy)</option>
              <option value="yesterday">Ayer</option>
              <option value="this_week">Semana actual</option>
              <option value="last_month">Último mes cerrado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Formato de Salida:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  format === 'pdf'
                    ? 'bg-[#0070F2] text-white border-[#0070F2]'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                PDF Ejecutivo
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  format === 'csv'
                    ? 'bg-[#0070F2] text-white border-[#0070F2]'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                CSV / Excel
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Organización: <strong className="text-slate-800">{organizationId}</strong> • Cámaras activas: <strong className="text-slate-800">{cameras.length}</strong>
          </span>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={15} />
            <span>{generating ? 'Generando Reporte...' : 'Descargar Reporte'}</span>
          </button>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Reporte exportado correctamente y listo para auditoría.</span>
          </div>
        )}
      </div>

    </div>
  );
}
