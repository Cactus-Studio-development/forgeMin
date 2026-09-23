'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { GrantCreditModal } from '@/components/argentina-empleos/admin/grant-credit-modal';
import { AEUser, AEWallet, AECreditRequest } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Wallet,
  Search,
  ShieldCheck,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Check,
  X,
} from 'lucide-react';

export default function AdminBilleterasPage() {
  const { user: currentAdmin } = useAEAuth();
  const [activeTab, setActiveTab] = useState<'wallets' | 'requests'>('requests');

  // Wallets data
  const [usersList, setUsersList] = useState<Array<AEUser & { wallet?: AEWallet }>>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AEUser | null>(null);

  // Credit requests data
  const [creditRequests, setCreditRequests] = useState<AECreditRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionModal, setActionModal] = useState<{
    request: AECreditRequest;
    type: 'Aprobado' | 'Rechazado';
  } | null>(null);

  const loadWallets = async () => {
    if (!currentAdmin) return;
    setLoadingWallets(true);
    try {
      const data = await aeApi.admin.listUsers(currentAdmin.id, { query: search });
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallets(false);
    }
  };

  const loadCreditRequests = async () => {
    if (!currentAdmin) return;
    setLoadingRequests(true);
    try {
      const data = await aeApi.admin.listCreditRequests(currentAdmin.id);
      setCreditRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      loadWallets();
      loadCreditRequests();
    }
  }, [currentAdmin, search]);

  const handleModerate = async () => {
    if (!currentAdmin || !actionModal) return;
    setModeratingId(actionModal.request.id);
    try {
      await aeApi.admin.moderateCreditRequest(currentAdmin.id, actionModal.request.id, {
        status: actionModal.type,
        adminNotes: adminNotes.trim() || undefined,
      });
      setActionModal(null);
      setAdminNotes('');
      await loadCreditRequests();
      await loadWallets();
    } catch (err) {
      console.error('Error moderando solicitud:', err);
    } finally {
      setModeratingId(null);
    }
  };

  const totalIssued = usersList.reduce(
    (acc, u) => acc + (u.wallet?.internalCredits || 0),
    0,
  );

  const pendingRequests = creditRequests.filter((r) => r.status === 'Pendiente');

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            Control Global de Billeteras & Créditos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total en circulación: <strong>$ {totalIssued.toLocaleString('es-AR')} ARS</strong> (Créditos internos).
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-sm font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Solicitudes de Créditos</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-700 text-[10px] font-extrabold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-3 py-1.5 rounded-sm font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'wallets'
                ? 'bg-[#106EBE] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Saldos de Usuarios</span>
          </button>
        </div>
      </div>

      {activeTab === 'requests' ? (
        /* SOLICITUDES DE CRÉDITO VIEW */
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              Solicitudes de Crédito de Usuarios ({creditRequests.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              {pendingRequests.length} pendientes de moderación
            </span>
          </div>

          {loadingRequests ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Cargando solicitudes...</p>
            </div>
          ) : creditRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No hay solicitudes de créditos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cuando los usuarios soliciten saldo o créditos aparecerán aquí para su aprobación.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Monto Solicitado</th>
                    <th className="py-3 px-4">Motivo / Justificación</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {creditRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.userName}</div>
                        {req.userEmail && !req.userEmail.endsWith('@argentinaempleos.local') && (
                          <div className="text-[11px] text-slate-500 font-mono">{req.userEmail}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#106EBE]">
                        $ {req.amount.toLocaleString('es-AR')} ARS
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                            req.status === 'Aprobado'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'Rechazado'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pendiente' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActionModal({ request: req, type: 'Aprobado' })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-xs flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => setActionModal({ request: req, type: 'Rechazado' })}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm text-xs flex items-center gap-1 shadow-2xs"
                            >
                              <X className="w-3 h-3" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Procesada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SALDOS DE USUARIOS VIEW */
        <div className="space-y-4">
          <div className="px-5 flex items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario o email..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>
          </div>

          {loadingWallets ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Cargando billeteras...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Crédito Inicial ($25.000)</th>
                    <th className="py-3 px-4 text-right">Saldo Interno Disponible</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        {u.email && !u.email.endsWith('@argentinaempleos.local') && (
                          <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-xs bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          {u.wallet?.welcomeCreditClaimed ? 'Otorgado (1 vez)' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        $ {(u.wallet?.internalCredits || 0).toLocaleString('es-AR')} ARS
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#106EBE] hover:bg-[#005A9E] text-white rounded-sm font-bold text-xs transition-colors shadow-2xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Otorgar Crédito Directo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grant Credit Modal */}
      <GrantCreditModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        targetUser={selectedUser}
        onCreditGranted={loadWallets}
      />

      {/* Moderate Credit Request Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {actionModal.type === 'Aprobado' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span>
                  {actionModal.type === 'Aprobado' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                </span>
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-sm">
              <p>
                <strong>Usuario:</strong> {actionModal.request.userName} ({actionModal.request.userEmail})
              </p>
              <p>
                <strong>Monto:</strong> $ {actionModal.request.amount.toLocaleString('es-AR')} ARS
              </p>
              <p>
                <strong>Motivo:</strong> {actionModal.request.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas / Mensaje al usuario (Opcional)
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ej: Aprobado conforme a la solicitud administrativa..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-sm text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleModerate}
                disabled={Boolean(moderatingId)}
                className={`px-4 py-1.5 text-white font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-2xs ${
                  actionModal.type === 'Aprobado'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {moderatingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirmar {actionModal.type}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
