'use client';

import React, { useState } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import {
  Settings,
  Save,
  Shield,
  Server,
  Sliders,
  CheckCircle2,
  HardDrive,
  Cpu,
  Radio,
} from 'lucide-react';

export default function MonitoringSettingsPage() {
  const { organizationId } = useMonitoring();

  const [gatewayUrl, setGatewayUrl] = useState('http://localhost:3001/api/monitoring/gateway/telemetry');
  const [retentionDays, setRetentionDays] = useState(90);
  const [pingIntervalSeconds, setPingIntervalSeconds] = useState(30);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Configuración del Sistema
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Parámetros de Video & Gateway
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Ajustes del motor de Computer Vision, retención de datos operacionales y pasarelas de streaming.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Computer Vision Gateway Parameters */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Cpu size={18} className="text-[#0070F2]" />
            <h3 className="text-sm font-bold text-slate-900">
              Gateway de Visión Artificial (Python / YOLO / ByteTrack)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endpoint de Ingesta de Telemetría:
              </label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
              />
              <p className="text-[10px] text-slate-400 mt-1">URL a la cual el worker Python enviará las detecciones.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Umbral de Confianza de Detección (0.1 - 1.0):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.99"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
              />
              <p className="text-[10px] text-slate-400 mt-1">Filtro de confianza mínima para conteo de personas.</p>
            </div>
          </div>
        </div>

        {/* Network & Polling */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Radio size={18} className="text-[#0070F2]" />
            <h3 className="text-sm font-bold text-slate-900">
              Conectividad & Retención
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frecuencia de Sondeo / Ping a Cámaras (segundos):
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={pingIntervalSeconds}
                onChange={(e) => setPingIntervalSeconds(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Retención de Historial de Eventos (días):
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Shield size={15} className="text-[#0070F2]" />
            Política de Privacidad y No Identificación Biométrica
          </p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            La plataforma MONITOREO procesa únicamente métricas agregadas de flujo, conteo y permanencia espacial. Ninguna imagen biométrica, perfil facial ni identidad personal es almacenada o asociada en base de datos.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={14} /> Configuración guardada correctamente
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save size={15} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
