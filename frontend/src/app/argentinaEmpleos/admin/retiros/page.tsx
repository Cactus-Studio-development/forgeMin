'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEWithdrawal, AEWithdrawalStatus } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';

export default function AdminRetirosPage() {
  const { user } = useAEAuth();
  const [withdrawals, setWithdrawals] = useState<AEWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadWithdrawals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.wallet.getMyWallet(user.id);
      // In real admin, query all withdrawals
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWithdrawals();
    }
  }, [user]);

  const handleModerate = async (id: string, status: AEWithdrawalStatus) => {
    if (!user) return;
    setUpdatingId(id);
    try {
      await aeApi.admin.moderateWithdrawal(user.id, id, {
        status,
        adminNotes: `Estado actualizado a ${status} por Superadmin`,
      });
      loadWithdrawals();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-600" />
          Moderación de Solicitudes de Retiro
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Validá solicitudes de conversión a dinero real y transferencias a Mercado Pago / Bancarias.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando solicitudes de retiro...</p>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No hay solicitudes de retiro registradas en este momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Método & Cuenta</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-[11px] text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{w.userName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{w.userEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{w.method}</div>
                    <div className="font-mono text-[11px] text-slate-500">{w.destinationAccount}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    $ {w.amount.toLocaleString('es-AR')} ARS
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'Pagado' || w.status === 'Aprobado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : w.status === 'Pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {w.status === 'Pendiente' && (
                      <>
                        <button
                          onClick={() => handleModerate(w.id, 'Aprobado')}
                          disabled={updatingId === w.id}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xs"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleModerate(w.id, 'Rechazado')}
                          disabled={updatingId === w.id}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-xs"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
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
