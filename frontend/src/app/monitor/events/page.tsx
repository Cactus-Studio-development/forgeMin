'use client';

import React, { useState, useEffect } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import { monitoringApi } from '@/lib/monitoring/monitoring-api';
import { IVideoEvent, EventType, EventSeverity } from '@/lib/monitoring/types';
import {
  Activity,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Cctv,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function MonitoringEventsPage() {
  const { organizationId, cameras } = useMonitoring();
  const [events, setEvents] = useState<IVideoEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await monitoringApi.events.list({
        organizationId,
        cameraId: selectedCamera || undefined,
        type: selectedType || undefined,
        severity: selectedSeverity || undefined,
        limit: 100,
      });
      setEvents(data || []);
    } catch (err) {
      console.warn('Failed to load events', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [organizationId, selectedCamera, selectedType, selectedSeverity]);

  const handleAcknowledge = async (id: string) => {
    try {
      await monitoringApi.events.acknowledge(id);
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, acknowledged: true } : e)),
      );
    } catch (err) {
      console.warn('Failed to ack event', err);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.type.toLowerCase().includes(q) ||
      (e.cameraName && e.cameraName.toLowerCase().includes(q)) ||
      (e.zoneName && e.zoneName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Bitácora Operacional
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Registro de Eventos
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Eventos generados por el pipeline de visión artificial y telemetría de cámaras.
          </p>
        </div>

        <button
          onClick={loadEvents}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-medium"
            >
              <option value="">Todas las Cámaras</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-medium"
            >
              <option value="">Todos los Tipos de Evento</option>
              <option value="PERSON_ENTERED">Ingreso de Persona</option>
              <option value="PERSON_EXITED">Egreso de Persona</option>
              <option value="HIGH_OCCUPANCY">Alta Ocupación</option>
              <option value="EXTENDED_DWELL">Permanencia Prolongada</option>
              <option value="ZONE_INTRUSION">Intrusión en Zona</option>
              <option value="CAMERA_OFFLINE">Cámara Desconectada</option>
              <option value="CAMERA_ONLINE">Cámara Conectada</option>
            </select>
          </div>

          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-medium"
            >
              <option value="">Cualquier Severidad</option>
              <option value="info">Informativo</option>
              <option value="warning">Advertencia</option>
              <option value="critical">Crítico</option>
            </select>
          </div>

        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Consultando eventos operacionales...
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Severidad</th>
                  <th className="py-3 px-4">Tipo de Evento</th>
                  <th className="py-3 px-4">Cámara</th>
                  <th className="py-3 px-4">Zona</th>
                  <th className="py-3 px-4 text-right">Estado / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => {
                  const isCrit = evt.severity === 'critical';
                  const isWarn = evt.severity === 'warning';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCrit
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isWarn
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isCrit ? (
                            <ShieldAlert size={11} />
                          ) : isWarn ? (
                            <AlertTriangle size={11} />
                          ) : (
                            <Info size={11} />
                          )}
                          <span className="capitalize">{evt.severity}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {evt.type.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {evt.cameraName || evt.cameraId}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {evt.zoneName || '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {evt.acknowledged ? (
                          <span className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} /> Reconocido
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcknowledge(evt.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                          >
                            Reconocer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Activity size={32} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No hay eventos registrados</p>
            <p className="text-[11px] text-slate-400">
              Los eventos se emitirán automáticamente cuando las cámaras comiencen el análisis de movimiento y flujo.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
