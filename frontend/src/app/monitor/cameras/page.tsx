'use client';

import React, { useState } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import { monitoringApi } from '@/lib/monitoring/monitoring-api';
import { ICamera, ICameraConfig } from '@/lib/monitoring/types';
import {
  Cctv,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  Sliders,
  Trash2,
  Edit2,
  Radio,
  Wifi,
  WifiOff,
  Zap,
  X,
  Play,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function MonitoringCamerasPage() {
  const { cameras, loadingCameras, refreshCameras, organizationId } = useMonitoring();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<ICamera | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState<'RTSP' | 'ONVIF'>('RTSP');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(554);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rtspPath, setRtspPath] = useState('/live/ch0');
  const [fps, setFps] = useState(25);
  const [resolution, setResolution] = useState('1920x1080');

  // Auto-Discovery state
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Array<{
    ip: string;
    mac?: string;
    protocol: 'RTSP' | 'ONVIF';
    port: number;
    manufacturer: string;
    model: string;
    name: string;
    rtspPath: string;
    signal?: string;
  }>>([]);
  const [showDiscoveryDrawer, setShowDiscoveryDrawer] = useState(false);

  // Test connection state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    status: string;
    details?: any;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  const handleAutoDiscover = async () => {
    setIsScanning(true);
    setShowDiscoveryDrawer(true);
    try {
      const results = await monitoringApi.cameras.discover();
      setDiscoveredDevices(results || []);
    } catch (err) {
      console.warn('Discovery error', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDiscoveredDevice = (dev: any) => {
    setName(dev.name || 'Cámara Xiaomi');
    setIp(dev.ip);
    setPort(dev.port || (dev.protocol === 'ONVIF' ? 80 : 554));
    setProtocol(dev.protocol || 'RTSP');
    setRtspPath(dev.rtspPath || '/live/ch0');
    setDescription(`Dispositivo detectado automáticamente. MAC: ${dev.mac || 'N/A'}`);
    setShowDiscoveryDrawer(false);
  };

  const openCreateModal = () => {
    setEditingCamera(null);
    setName('Hogar');
    setLocation('Entrada Principal');
    setDescription('');
    setProtocol('RTSP');
    setIp('192.168.100.169');
    setPort(554);
    setUsername('admin');
    setPassword('');
    setRtspPath('/live/ch0');
    setFps(25);
    setResolution('1920x1080');
    setTestResult(null);
    setShowDiscoveryDrawer(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cam: ICamera) => {
    setEditingCamera(cam);
    setName(cam.name);
    setLocation(cam.location);
    setDescription(cam.description || '');
    setProtocol((cam.config?.protocol as 'RTSP' | 'ONVIF') || 'RTSP');
    setIp(cam.config?.ip || '');
    setPort(cam.config?.port || 554);
    setUsername(cam.config?.username || '');
    setPassword(cam.config?.password || '');
    setRtspPath(cam.config?.rtspPath || '/live/ch0');
    setFps(cam.config?.fps || 25);
    setResolution(cam.config?.resolution || '1920x1080');
    setTestResult(null);
    setShowDiscoveryDrawer(false);
    setIsModalOpen(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const configPayload: ICameraConfig = {
        ip,
        port: Number(port),
        protocol,
        username,
        password,
        rtspPath,
        fps: Number(fps),
        resolution,
      };
      const res = await monitoringApi.cameras.testConnection(configPayload);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'error',
        message: err.message || 'Error al verificar la cámara.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ip.trim()) return;

    setSaving(true);
    try {
      const config: ICameraConfig = {
        ip: ip.trim(),
        port: Number(port),
        protocol,
        username: username.trim(),
        password: password.trim(),
        rtspPath: rtspPath.trim(),
        fps: Number(fps),
        resolution,
        codec: 'H.264',
      };

      if (editingCamera) {
        await monitoringApi.cameras.update(editingCamera.id, {
          name,
          location,
          description,
          config,
        });
      } else {
        await monitoringApi.cameras.create({
          organizationId,
          name,
          location,
          description,
          config,
          zones: [],
        });
      }
      setIsModalOpen(false);
      await refreshCameras();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la cámara');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCamera = async (id: string) => {
    if (!confirm('¿Deseas desvincular esta cámara?')) return;
    try {
      await monitoringApi.cameras.delete(id);
      await refreshCameras();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cam.config?.ip && cam.config.ip.includes(searchQuery));

    const matchesStatus =
      filterStatus === 'all' || cam.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Gestión de Hardware & Streams
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Administración de Cámaras
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Configuración de streams compatibles con RTSP y ONVIF para análisis de visión por computadora.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              openCreateModal();
              handleAutoDiscover();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Wifi size={15} className="text-emerald-400" />
            <span>Detector Automático</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Agregar Nueva Cámara</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación o IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filtrar estado:</span>
          {['all', 'online', 'offline', 'unconfigured'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-[#0070F2] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all'
                ? 'Todas'
                : st === 'online'
                ? 'Conectadas'
                : st === 'offline'
                ? 'Sin Conexión'
                : 'Config. Pendiente'}
            </button>
          ))}
        </div>
      </div>

      {/* Cameras Table */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-xs overflow-hidden">
        {loadingCameras ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            Cargando inventario de cámaras...
          </div>
        ) : filteredCameras.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Cámara</th>
                  <th className="py-3 px-4">Ubicación</th>
                  <th className="py-3 px-4">Dirección IP & Protocolo</th>
                  <th className="py-3 px-4 text-center">Estado Stream</th>
                  <th className="py-3 px-4 text-center">Personas Actuales</th>
                  <th className="py-3 px-4 text-center">Zonas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCameras.map((cam) => {
                  const isOnline = cam.status === 'online';
                  const isOffline = cam.status === 'offline' || cam.status === 'error';
                  const isPending = cam.status === 'unconfigured';

                  return (
                    <tr key={cam.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isOnline
                                ? 'bg-emerald-50 text-emerald-600'
                                : isOffline
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Cctv size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{cam.name}</p>
                            <p className="text-[10px] text-slate-400">{cam.config?.model || 'Cámara IP'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {cam.location || 'General'}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-mono text-slate-800 font-semibold">{cam.config?.ip || '0.0.0.0'}:{cam.config?.port || 554}</p>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {cam.config?.protocol || 'RTSP'} • {cam.config?.resolution || '1080p'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOnline
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOffline
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline
                                ? 'bg-emerald-500'
                                : isOffline
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {isOnline
                            ? 'Conectada'
                            : isOffline
                            ? 'Sin conexión'
                            : 'Esperando cámara'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-extrabold text-[#0070F2]">
                        {cam.detectedPersonsCount || 0}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {cam.zones?.length || 0} zonas
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cam)}
                            className="p-1.5 text-slate-500 hover:text-[#0070F2] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar configuración"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCamera(cam.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar cámara"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Cctv size={36} className="mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-700">No hay cámaras registradas</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Registra tu primera cámara IP para iniciar la ingesta y procesamiento de video.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0070F2] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0050B3] transition-colors"
            >
              <Plus size={15} />
              <span>Registrar Cámara</span>
            </button>
          </div>
        )}
      </div>

      {/* CAMERA CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cctv size={20} className="text-[#0070F2]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingCamera ? 'Modificar Cámara' : 'Registrar Nueva Cámara IP'}
                  </h3>
                  <p className="text-[10px] text-slate-500">Configuración de transmisión y red local</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* AUTO-DETECTOR BANNER / SCANNER */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0070F2] text-white flex items-center justify-center shadow-2xs">
                    <Wifi size={14} className={isScanning ? 'animate-ping' : ''} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Detector Automático de Cámaras</h4>
                    <p className="text-[10px] text-slate-500">Escanea la red Wi-Fi / LAN y completa los datos con 1 clic</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDiscover}
                  disabled={isScanning}
                  className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0050B3] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
                  <span>{isScanning ? 'Escaneando...' : 'Escanear Red'}</span>
                </button>
              </div>

              {showDiscoveryDrawer && (
                <div className="mt-2 pt-2 border-t border-blue-200/80 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-slate-600">Dispositivos Encontrados en la Red:</p>
                  {discoveredDevices.map((dev) => (
                    <div
                      key={dev.ip}
                      className="p-2.5 rounded-lg bg-white border border-blue-200 flex items-center justify-between hover:border-[#0070F2] transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{dev.name}</span>
                          <span className="text-[9px] bg-blue-50 text-[#0070F2] px-1.5 py-0.2 rounded font-bold border border-blue-200">
                            {dev.manufacturer}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-600">
                          IP: <strong className="text-slate-900">{dev.ip}</strong> • Puerto: {dev.port} • MAC: {dev.mac || 'N/A'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectDiscoveredDevice(dev)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Check size={12} />
                        <span>Usar esta cámara</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCamera} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre de la Cámara:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Hogar / Entrada"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ubicación / Sector:
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Entrada Principal / Sala"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  />
                </div>
              </div>

              {/* Protocol & IP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Protocolo:
                  </label>
                  <select
                    value={protocol}
                    onChange={(e) => {
                      const p = e.target.value as 'RTSP' | 'ONVIF';
                      setProtocol(p);
                      setPort(p === 'ONVIF' ? 80 : 554);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  >
                    <option value="RTSP">RTSP (Real Time Streaming)</option>
                    <option value="ONVIF">ONVIF (Profile S/T)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dirección IP / Host:
                  </label>
                  <input
                    type="text"
                    required
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="192.168.100.169"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Puerto:
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  />
                </div>
              </div>

              {/* Credentials & Path */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Usuario:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ruta / Canal:
                  </label>
                  <input
                    type="text"
                    value={rtspPath}
                    onChange={(e) => setRtspPath(e.target.value)}
                    placeholder="/live/ch0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Stream Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resolución estimada:
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="1920x1080">1080p (Full HD - 1920x1080)</option>
                    <option value="1280x720">720p (HD - 1280x720)</option>
                    <option value="2560x1440">2K (QHD - 2560x1440)</option>
                    <option value="3840x2160">4K (Ultra HD - 3840x2160)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FPS Objetivo:
                  </label>
                  <input
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    min={5}
                    max={60}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Connection Diagnostics Test Block */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Verificación de Conectividad</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !ip.trim()}
                    className="px-3 py-1.5 bg-[#1C2D42] hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Zap size={13} className="text-amber-400" />
                    <span>{testingConnection ? 'Sondeando...' : 'Probar Conexión'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.details && (
                        <p className="text-[11px] opacity-85 font-mono">
                          Target: {testResult.details.target} • Latencia: {testResult.details.latencyMs}ms • Codec: {testResult.details.codec}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#0070F2] hover:bg-[#0050B3] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Guardando...' : editingCamera ? 'Actualizar Cámara' : 'Guardar Cámara'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
