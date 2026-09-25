'use client';

import React from 'react';
import Link from 'next/link';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import {
  Cctv,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Activity,
  PlusCircle,
  Eye,
  MapPin,
  CheckCircle2,
  XCircle,
  Radio,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export default function MonitoringDashboardPage() {
  const { dashboardData, loadingDashboard, cameras } = useMonitoring();

  const realtime = dashboardData?.realtime || {
    totalCameras: 0,
    connectedCameras: 0,
    disconnectedCameras: 0,
    unconfiguredCameras: 0,
    currentDetectedPersons: 0,
    activeAlertsCount: 0,
  };

  const historical = dashboardData?.historicalToday || {
    entriesToday: 0,
    exitsToday: 0,
    netTraffic: 0,
    avgDwellMinutes: 0,
    peakHour: 'N/A',
    peakOccupancy: 0,
    eventsTodayCount: 0,
  };

  const hasCameras = (cameras && cameras.length > 0) || realtime.totalCameras > 0;

  return (
    <div className="space-y-6">
      
      {/* Page Title & Action Bar */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
              Control Operacional
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Actualización automática</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Centro de Monitoreo & Analítica
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/monitor/cameras"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle size={15} />
            <span>Agregar Cámara</span>
          </Link>
          <Link
            href="/monitor/live"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-[#D9E1E8] shadow-xs transition-colors"
          >
            <Eye size={15} className="text-[#0070F2]" />
            <span>Vista en Vivo</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: TIEMPO REAL (REAL-TIME METRICS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Estado en Tiempo Real
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Telemetría de streams activos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Active Cameras */}
          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#556B82]">Cámaras Conectadas</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0070F2] flex items-center justify-center">
                <Cctv size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1C2D42]">
                  {realtime.connectedCameras}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ {realtime.totalCameras} totales</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                {realtime.disconnectedCameras > 0 ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <XCircle size={12} /> {realtime.disconnectedCameras} desconectadas
                  </span>
                ) : realtime.totalCameras === 0 ? (
                  <span className="text-amber-600 font-medium">Esperando registro de cámara</span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Todas en línea
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card: Current Persons Detected */}
          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#556B82]">Personas Detectadas Ahora</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1C2D42]">
                  {realtime.currentDetectedPersons}
                </span>
                <span className="text-xs text-slate-500 font-medium">en tránsito / permanencia</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {hasCameras ? 'Conteo agregado por IA (sin datos biométricos)' : 'Sin stream de video activo'}
              </p>
            </div>
          </div>

          {/* Card: Active Alerts */}
          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#556B82]">Alertas Activas</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1C2D42]">
                  {realtime.activeAlertsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">incidentes abiertos</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {realtime.activeAlertsCount === 0 ? 'Sin incidencias críticas' : 'Requieren atención operacional'}
              </p>
            </div>
          </div>

          {/* Card: Unconfigured / Setup pending */}
          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#556B82]">Cámaras por Configurar</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Sliders size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1C2D42]">
                  {realtime.unconfiguredCameras}
                </span>
                <span className="text-xs text-slate-500 font-medium">pendientes de stream</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                RTSP / ONVIF configurable
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: HISTÓRICO DEL DÍA (HISTORICAL AGGREGATE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[#0070F2]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Histórico Operacional (Hoy)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Consolidado desde las 00:00 hs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Entradas del Día</span>
              <ArrowDownRight size={16} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">{historical.entriesToday}</p>
            <p className="text-[10px] text-slate-400 mt-1">Conteo en zonas de ingreso</p>
          </div>

          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Salidas del Día</span>
              <ArrowUpRight size={16} className="text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">{historical.exitsToday}</p>
            <p className="text-[10px] text-slate-400 mt-1">Conteo en zonas de egreso</p>
          </div>

          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Permanencia Promedio</span>
              <Clock size={16} className="text-[#0070F2]" />
            </div>
            <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">
              {historical.avgDwellMinutes > 0 ? `${historical.avgDwellMinutes} min` : '0 min'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Tiempo de permanencia en recinto</p>
          </div>

          <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Hora Pico de Actividad</span>
              <Activity size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-[#1C2D42] mt-2">{historical.peakHour}</p>
            <p className="text-[10px] text-slate-400 mt-1">Mayor afluencia registrada</p>
          </div>

        </div>
      </div>

      {/* SECTION 3: RECENT EVENTS & ZONE CIRCULATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Zone Circulation & Activity Table */}
        <div className="lg:col-span-2 bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#0070F2]" />
              <h3 className="text-sm font-bold text-[#1C2D42]">Circulación y Actividad por Zonas</h3>
            </div>
            <Link
              href="/monitor/zones"
              className="text-xs font-bold text-[#0070F2] hover:underline flex items-center gap-1"
            >
              <span>Configurar Zonas</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {dashboardData?.zoneCirculation && dashboardData.zoneCirculation.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Zona</th>
                    <th className="py-2.5 px-3">Cámara Asociada</th>
                    <th className="py-2.5 px-3 text-center">Entradas</th>
                    <th className="py-2.5 px-3 text-center">Salidas</th>
                    <th className="py-2.5 px-3 text-right">Ocupación Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.zoneCirculation.map((z) => (
                    <tr key={z.zoneId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{z.zoneName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{z.cameraName}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">{z.totalEntriesToday}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-semibold">{z.totalExitsToday}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#0070F2]">{z.currentCount} pers.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <MapPin size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-medium">Aún no se han configurado polígonos de zonas en las cámaras.</p>
              <Link
                href="/monitor/zones"
                className="inline-block text-xs font-bold text-[#0070F2] hover:underline"
              >
                Definir zonas operacionales (Entrada, Salida, Caja, Sectores) →
              </Link>
            </div>
          )}
        </div>

        {/* Right Col: Recent Operational Events */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#0070F2]" />
              <h3 className="text-sm font-bold text-[#1C2D42]">Eventos Recientes</h3>
            </div>
            <Link
              href="/monitor/events"
              className="text-xs font-bold text-[#0070F2] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {dashboardData?.recentEvents && dashboardData.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl border border-[#EEF2F6] bg-slate-50 flex items-start gap-2.5 text-xs"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      evt.severity === 'critical'
                        ? 'bg-rose-500'
                        : evt.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {evt.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {evt.cameraName || 'Cámara'} {evt.zoneName ? `• ${evt.zoneName}` : ''}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <Activity size={24} className="mx-auto text-slate-300" />
              <p className="text-xs">Esperando eventos del motor de visión.</p>
              <span className="text-[11px] text-slate-400">Las detecciones aparecerán en tiempo real.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
