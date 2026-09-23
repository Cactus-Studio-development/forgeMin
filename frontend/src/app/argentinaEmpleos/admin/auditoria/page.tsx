'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEAdminLog } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { History, Shield, Loader2, Search } from 'lucide-react';

export default function AdminAuditoriaPage() {
  const { user } = useAEAuth();
  const [logs, setLogs] = useState<AEAdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.getAuditLogs(user.id);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.targetId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            Registro Inmutable de Auditoría
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad completa de créditos otorgados, bloqueos, moderación de vacantes y solicitudes financieras.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por acción o email..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando registros de auditoría...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No hay registros de auditoría registrados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Administrador</th>
                <th className="py-3 px-4">Objetivo / Tipo</th>
                <th className="py-3 px-4">Detalles / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-sans text-xs">
                    {new Date(log.createdAt).toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    <span className="px-2 py-0.5 rounded-xs bg-slate-100 border border-slate-200 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-sans">
                    {log.adminEmail}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-sans">
                    <span className="font-semibold text-slate-800">{log.targetType}</span> ({log.targetId})
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
