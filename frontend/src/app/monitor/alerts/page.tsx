'use client';

import React, { useState, useEffect } from 'react';
import { useMonitoring } from '@/lib/monitoring/monitoring-context';
import { monitoringApi } from '@/lib/monitoring/monitoring-api';
import { IAlertRule, IAlertIncident, EventType, EventSeverity } from '@/lib/monitoring/types';
import {
  Bell,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Cctv,
  X,
  ShieldAlert,
} from 'lucide-react';

export default function MonitoringAlertsPage() {
  const { organizationId, cameras } = useMonitoring();

  const [activeTab, setActiveTab] = useState<'incidents' | 'rules'>('incidents');
  const [incidents, setIncidents] = useState<IAlertIncident[]>([]);
  const [rules, setRules] = useState<IAlertRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleEventType, setRuleEventType] = useState<EventType>('CAMERA_OFFLINE');
  const [ruleSeverity, setRuleSeverity] = useState<EventSeverity>('warning');
  const [ruleThreshold, setRuleThreshold] = useState<number>(10);
  const [selectedCamIds, setSelectedCamIds] = useState<string[]>([]);
  const [savingRule, setSavingRule] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incList, ruleList] = await Promise.all([
        monitoringApi.alerts.listIncidents(organizationId),
        monitoringApi.alerts.listRules(organizationId),
      ]);
      setIncidents(incList || []);
      setRules(ruleList || []);
    } catch (err) {
      console.warn('Failed to load alert data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      await monitoringApi.alerts.toggleRule(ruleId, !currentEnabled);
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !currentEnabled } : r)),
      );
    } catch (err: any) {
      alert('Error al alternar regla');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('¿Deseas eliminar esta regla de alerta?')) return;
    try {
      await monitoringApi.alerts.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: any) {
      alert('Error al eliminar regla');
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await monitoringApi.alerts.updateIncidentStatus(incidentId, 'resolved');
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? { ...inc, status: 'resolved' } : inc)),
      );
    } catch (err: any) {
      alert('Error al resolver incidente');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    setSavingRule(true);
    try {
      await monitoringApi.alerts.createRule({
        organizationId,
        name: ruleName.trim(),
        description: ruleDesc.trim(),
        eventType: ruleEventType,
        severity: ruleSeverity,
        threshold: Number(ruleThreshold),
        cameraIds: selectedCamIds,
        zoneIds: [],
        enabled: true,
        notifyChannels: ['app'],
      });
      await loadData();
      setIsRuleModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar regla');
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-[#D9E1E8] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#0070F2] bg-blue-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Motor de Alertas & Notificaciones
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1C2D42] mt-1">
            Gestión de Alertas & Reglas
          </h1>
          <p className="text-xs text-[#556B82] mt-0.5">
            Configuración de condiciones operacionales y supervisión de incidencias activas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setRuleName('');
              setRuleDesc('');
              setRuleEventType('CAMERA_OFFLINE');
              setRuleSeverity('warning');
              setRuleThreshold(10);
              setSelectedCamIds([]);
              setIsRuleModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0070F2] hover:bg-[#0050B3] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Nueva Regla de Alerta</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'incidents'
              ? 'bg-white text-[#0070F2] border border-[#D9E1E8] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Incidentes Detectados ({incidents.filter((i) => i.status === 'active').length} Activos)
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-white text-[#0070F2] border border-[#D9E1E8] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reglas Configuradas ({rules.length})
        </button>
      </div>

      {/* TAB 1: INCIDENTS */}
      {activeTab === 'incidents' && (
        <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Cargando incidencias...</div>
          ) : incidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Severidad</th>
                    <th className="py-3 px-4">Regla / Motivo</th>
                    <th className="py-3 px-4">Cámara Afectada</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => {
                    const isActive = inc.status === 'active';
                    return (
                      <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {new Date(inc.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inc.severity === 'critical'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <AlertTriangle size={11} />
                            <span className="capitalize">{inc.severity}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{inc.ruleName}</p>
                          <p className="text-[11px] text-slate-500">{inc.message}</p>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {inc.cameraName}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isActive
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Resuelto'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleResolveIncident(inc.id)}
                              className="px-2.5 py-1 bg-[#0070F2] hover:bg-[#0050B3] text-white rounded font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Resolver
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
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700">Sin incidentes de alerta</p>
              <p className="text-[11px] text-slate-400">
                El sistema no registra desconexiones ni violaciones de ocupación.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RULES */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-[#D9E1E8] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#0070F2] bg-blue-50 px-2 py-0.5 rounded uppercase">
                    {rule.eventType.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled)}
                    className="text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {rule.enabled ? (
                      <ToggleRight size={22} className="text-[#0070F2]" />
                    ) : (
                      <ToggleLeft size={22} className="text-slate-400" />
                    )}
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2">{rule.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rule.description || 'Regla de supervisión automática de eventos.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Severidad: <strong className="text-slate-800 capitalize">{rule.severity}</strong></span>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-[#0070F2]" />
                <h3 className="text-sm font-bold text-slate-900">Nueva Regla de Alerta</h3>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Regla:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Desconexión de Cámara Entrada / Aforo Excedido"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Evento Disparador:
                  </label>
                  <select
                    value={ruleEventType}
                    onChange={(e) => setRuleEventType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  >
                    <option value="CAMERA_OFFLINE">Cámara Desconectada</option>
                    <option value="HIGH_OCCUPANCY">Ocupación / Aforo Alto</option>
                    <option value="EXTENDED_DWELL">Permanencia Excesiva</option>
                    <option value="ZONE_INTRUSION">Intrusión en Zona Restringida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nivel de Severidad:
                  </label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0070F2]/20"
                  >
                    <option value="info">Informativo</option>
                    <option value="warning">Advertencia (Warning)</option>
                    <option value="critical">Crítico (Alerta Roja)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción (Opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre qué acción debe tomar el operador..."
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="bg-[#0070F2] hover:bg-[#0050B3] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {savingRule ? 'Guardando...' : 'Crear Regla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
