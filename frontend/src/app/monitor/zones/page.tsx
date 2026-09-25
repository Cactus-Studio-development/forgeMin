'use client';

import React, { useState } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import { monitoringApi } from '@/lib/monitoring/monitoring-api';
import { ICamera, ICameraZone } from '@/lib/monitoring/types';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Cctv,
  Users,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  X,
} from 'lucide-react';

export default function MonitoringZonesPage() {
  const { cameras, loadingCameras, refreshCameras } = useMonitoring();

  const [selectedCameraId, setSelectedCameraId] = useState<string>(
    cameras[0]?.id || '',
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ICameraZone | null>(null);

  // Form
  const [zoneName, setZoneName] = useState('');
  const [zoneType, setZoneType] = useState<ICameraZone['type']>('general');
  const [zoneColor, setZoneColor] = useState('#0070F2');
  const [saving, setSaving] = useState(false);

  const currentCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  const handleOpenCreate = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneType('general');
    setZoneColor('#0070F2');
    setIsModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCam || !zoneName.trim()) return;

    setSaving(true);
    try {
      const existingZones = currentCam.zones || [];
      let updatedZones: ICameraZone[];

      if (editingZone) {
        updatedZones = existingZones.map((z) =>
          z.id === editingZone.id
            ? { ...z, name: zoneName, type: zoneType, color: zoneColor }
            : z,
        );
      } else {
        const newZone: ICameraZone = {
          id: 'zone_' + Date.now().toString(36),
          name: zoneName,
          type: zoneType,
          color: zoneColor,
          polygon: [
            { x: 100, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 300 },
            { x: 100, y: 300 },
          ],
        };
        updatedZones = [...existingZones, newZone];
      }

      await monitoringApi.cameras.updateZones(currentCam.id, updatedZones);
      await refreshCameras();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar la zona');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!currentCam || !confirm('¿Eliminar esta zona operacional?')) return;
    try {
      const updated = (currentCam.zones || []).filter((z) => z.id !== zoneId);
      await monitoringApi.cameras.updateZones(currentCam.id, updated);
      await refreshCameras();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Segmentación Espacial
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Gestión de Zonas Operacionales
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Delimitación de áreas de interés (Entradas, Salidas, Cajas, Sectores) para análisis de afluencia y permanencia.
          </p>
        </div>

        {currentCam && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Crear Zona en Cámara</span>
          </button>
        )}
      </div>

      {/* Main Grid: Camera Selector & Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Camera Selection & Zones List */}
        <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Seleccionar Cámara:
            </label>
            <select
              value={currentCam?.id || ''}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Zonas Definidas ({currentCam?.zones?.length || 0})
            </h3>

            {currentCam?.zones && currentCam.zones.length > 0 ? (
              <div className="space-y-2">
                {currentCam.zones.map((z) => (
                  <div
                    key={z.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-sm shrink-0 border"
                        style={{ backgroundColor: z.color || '#0070F2' }}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{z.name}</p>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          Tipo: {z.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar zona"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No hay zonas configuradas en esta cámara.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Zone Canvas / Visualizer */}
        <div className="lg:col-span-2 bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[#0070F2]" />
              <h3 className="text-sm font-bold text-[#1C2D42]">
                Visualizador de Polígonos de Detección
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {currentCam ? `${currentCam.name} • ${currentCam.config?.resolution || '1080p'}` : 'Sin cámara'}
            </span>
          </div>

          <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415520_1px,transparent_1px),linear-gradient(to_bottom,#33415520_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />

            {/* Render configured polygons overlay */}
            {currentCam?.zones && currentCam.zones.map((zone, idx) => (
              <div
                key={zone.id}
                className="absolute border-2 rounded-lg p-2 flex flex-col justify-between"
                style={{
                  borderColor: zone.color || '#0070F2',
                  backgroundColor: `${zone.color || '#0070F2'}18`,
                  top: `${20 + idx * 22}%`,
                  left: `${15 + idx * 25}%`,
                  width: '32%',
                  height: '42%',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-xs"
                    style={{ backgroundColor: zone.color || '#0070F2' }}
                  >
                    {zone.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-300 bg-black/60 px-1 rounded">
                    {zone.type}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">
                  Polígono activo de visión
                </span>
              </div>
            ))}

            <div className="text-center z-0 text-slate-500 space-y-1 select-none pointer-events-none">
              <Cctv size={32} className="mx-auto text-slate-600" />
              <p className="text-xs font-semibold text-slate-400">Plano de Detección de Cámara</p>
              <p className="text-[10px] text-slate-600">Las zonas filtran detecciones de personas para analítica agregada</p>
            </div>
          </div>
        </div>

      </div>

      {/* ZONE CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#0070F2]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingZone ? 'Modificar Zona' : 'Crear Zona en Cámara'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Zona:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Molinetes de Entrada, Mostrador, Sector A"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo Operacional:
                </label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                >
                  <option value="entry">Entrada / Ingreso (Conteo In)</option>
                  <option value="exit">Salida / Egreso (Conteo Out)</option>
                  <option value="dwell">Área de Permanencia / Espera</option>
                  <option value="restricted">Sector Restringido / Seguridad</option>
                  <option value="general">Zona General de Circulación</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color de Delimitación:
                </label>
                <div className="flex items-center gap-2">
                  {['#0070F2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setZoneColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        zoneColor === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0070F2] hover:bg-[#0050B3] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {saving ? 'Guardando...' : 'Crear Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
