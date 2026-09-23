'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Search,
  Copy,
  Check,
  Send,
  ArrowUpRight,
  ShieldCheck,
  DollarSign,
  FileText,
  ExternalLink,
} from 'lucide-react';

function MercadoPagoIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="#009EE3" />
      <path
        d="M22.8 14.2c-.3-.4-1.2-1.2-3.1-1.2-1.4 0-2.4.6-2.9 1.1l-.8.8-.8-.8c-.5-.5-1.5-1.1-2.9-1.1-1.9 0-2.8.8-3.1 1.2-.4.5-.4 1.1-.1 1.6l4 5.2c.4.5 1 .8 1.7.8s1.3-.3 1.7-.8l4-5.2c.3-.5.3-1.1-.1-1.6z"
        fill="#FFFFFF"
      />
      <path d="M13.2 16.5l2.8 2.8 2.8-2.8" stroke="#009EE3" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminRetirosPage() {
  const { user } = useAEAuth();
  const [withdrawals, setWithdrawals] = useState<AEWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pendiente' | 'Pagado' | 'Rechazado'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation Modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AEWithdrawal | null>(null);
  const [actionType, setActionType] = useState<'Pagado' | 'Rechazado'>('Pagado');
  const [voucherCode, setVoucherCode] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadWithdrawals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.listWithdrawals(user.id);
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error cargando solicitudes de retiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWithdrawals();
    }
  }, [user]);

  // Copy account to clipboard helper
  const handleCopyAccount = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open moderation modal with default texts
  const handleOpenModeration = (w: AEWithdrawal) => {
    setSelectedWithdrawal(w);
    setActionType('Pagado');
    setVoucherCode(`MP-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setAdminNote(
      `Depósito de $ ${w.amount.toLocaleString('es-AR')} ARS realizado con éxito a cuenta ${w.destinationAccount} vía Mercado Pago.`,
    );
  };

  // Submit moderation & response
  const handleConfirmModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWithdrawal) return;

    setProcessing(true);
    setFeedbackMessage(null);

    try {
      const fullResponseNote =
        actionType === 'Pagado'
          ? `[Comprobante: ${voucherCode || 'N/A'}] ${adminNote || 'Depósito acreditado satisfactoriamente.'}`
          : `[Solicitud Rechazada] Motivo: ${adminNote || 'Datos de cuenta no válidos o discrepancia en la información provista.'}`;

      await aeApi.admin.moderateWithdrawal(user.id, selectedWithdrawal.id, {
        status: actionType,
        adminNotes: fullResponseNote,
      });

      setFeedbackMessage({
        text: `Solicitud de ${selectedWithdrawal.userName} actualizada a "${actionType}" y respuesta enviada al usuario.`,
        type: 'success',
      });

      setSelectedWithdrawal(null);
      await loadWithdrawals();
    } catch (err: any) {
      setFeedbackMessage({
        text: err.message || 'Error al procesar la moderación de la solicitud.',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Filtered list
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'Pagado'
          ? w.status === 'Pagado' || w.status === 'Aprobado'
          : w.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        w.userName?.toLowerCase().includes(q) ||
        w.userEmail?.toLowerCase().includes(q) ||
        w.destinationAccount?.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [withdrawals, statusFilter, searchQuery]);

  // Statistics
  const totalCount = withdrawals.length;
  const pendingCount = withdrawals.filter((w) => w.status === 'Pendiente').length;
  const pendingAmount = withdrawals
    .filter((w) => w.status === 'Pendiente')
    .reduce((acc, w) => acc + (w.amount || 0), 0);
  const paidCount = withdrawals.filter((w) => w.status === 'Pagado' || w.status === 'Aprobado').length;
  const paidAmount = withdrawals
    .filter((w) => w.status === 'Pagado' || w.status === 'Aprobado')
    .reduce((acc, w) => acc + (w.amount || 0), 0);
  const rejectedCount = withdrawals.filter((w) => w.status === 'Rechazado').length;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-sm text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-[11px] underline font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-sm bg-purple-50 text-purple-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-extrabold text-slate-900">
              Gestión y Depósito de Solicitudes de Retiro
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Panel de control para Superadmin: Revisá las cuentas vinculadas, realizá la transferencia y confirmá con el comprobante correspondiente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadWithdrawals}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizar Solicitudes</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1 flex items-center justify-between">
            <span>Pendientes de Pago</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1 font-semibold">
            $ {pendingAmount.toLocaleString('es-AR')} ARS por liquidar
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">
            Pagados / Acreditados
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {paidCount}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1 font-semibold">
            $ {paidAmount.toLocaleString('es-AR')} ARS transferidos
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">
            Rechazados / Reintegrados
          </div>
          <div className="text-2xl font-black font-mono text-red-600">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Créditos reembolsados
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">
            Total Solicitudes
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Histórico registrado
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
        {/* Filters and Search Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'ALL', label: 'Todas', count: totalCount },
                { id: 'Pendiente', label: 'Pendientes', count: pendingCount },
                { id: 'Pagado', label: 'Pagados', count: paidCount },
                { id: 'Rechazado', label: 'Rechazados', count: rejectedCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#106EBE] text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusFilter === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por usuario, email o cuenta..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 focus:border-[#106EBE] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando solicitudes de retiro...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No se encontraron solicitudes con los filtros aplicados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fecha & ID</th>
                  <th className="py-3 px-4">Candidato / Solicitante</th>
                  <th className="py-3 px-4">Destino de Transferencia</th>
                  <th className="py-3 px-4 text-right">Monto a Liquidar</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Respuesta / Comprobante</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div>
                        {new Date(w.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(w.createdAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{w.userName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{w.userEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        {w.method === 'Mercado Pago' ? (
                          <MercadoPagoIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span>{w.method}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">
                          {w.destinationAccount}
                        </span>
                        <button
                          onClick={() => handleCopyAccount(w.destinationAccount, w.id)}
                          title="Copiar cuenta para transferir"
                          className="p-1 rounded-xs hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedId === w.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="text-sm text-slate-950">
                        $ {w.amount.toLocaleString('es-AR')} <span className="text-[10px] text-slate-500 font-sans">ARS</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          w.status === 'Pagado' || w.status === 'Aprobado'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : w.status === 'Pendiente'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {w.status === 'Pagado' || w.status === 'Aprobado' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : w.status === 'Pendiente' ? (
                          <Clock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                        <span>{w.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {w.adminNotes ? (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-xs border border-slate-200 line-clamp-2">
                          {w.adminNotes}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Sin respuesta administrativa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {w.status === 'Pendiente' ? (
                        <button
                          onClick={() => handleOpenModeration(w)}
                          className="px-3 py-1.5 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors shadow-2xs flex items-center gap-1.5 ml-auto"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Depositar y Responder</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenModeration(w)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-sm border border-slate-300 transition-colors ml-auto"
                        >
                          Modificar Nota
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Moderation & Deposit Response Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#106EBE]" />
                  <span>Procesar Depósito y Responder Solicitud</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirmá el depósito realizado y adjuntá la respuesta oficial al usuario.
                </p>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Recipient and Account Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Candidato:</span>
                <span className="font-bold text-slate-900">
                  {selectedWithdrawal.userName} ({selectedWithdrawal.userEmail})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Monto a Transferir:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  $ {selectedWithdrawal.amount.toLocaleString('es-AR')} ARS
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-500">Cuenta de Destino:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#009EE3] bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-200">
                    {selectedWithdrawal.destinationAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(selectedWithdrawal.destinationAccount, 'modal')}
                    className="p-1 rounded-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Copiar CVU/Alias"
                  >
                    {copiedId === 'modal' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Decision Tabs */}
            <form onSubmit={handleConfirmModeration} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resolución de la Solicitud
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('Pagado');
                      setAdminNote(
                        `Depósito de $ ${selectedWithdrawal.amount.toLocaleString('es-AR')} ARS realizado con éxito a cuenta ${selectedWithdrawal.destinationAccount} vía Mercado Pago.`,
                      );
                    }}
                    className={`p-3 rounded-sm border text-left transition-all ${
                      actionType === 'Pagado'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Marcar como Pagado</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      El dinero fue transferido a la cuenta del usuario.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType('Rechazado');
                      setAdminNote('No se pudo procesar la transferencia debido a datos de cuenta inválidos. Se reintegran los créditos a tu saldo.');
                    }}
                    className={`p-3 rounded-sm border text-left transition-all ${
                      actionType === 'Rechazado'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-1 ring-red-400'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-red-800">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Rechazar Solicitud</span>
                    </div>
                    <p className="text-[11px] text-red-700 mt-1">
                      Reintegra automáticamente los créditos a la billetera del usuario.
                    </p>
                  </button>
                </div>
              </div>

              {actionType === 'Pagado' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nro. de Comprobante / Transacción Mercado Pago
                  </label>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    placeholder="Ej: MP-98421034 o Cód. de Transferencia Bancaria"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensaje / Nota de Respuesta al Candidato
                </label>
                <textarea
                  rows={3}
                  required
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Escribí el detalle que el usuario verá en su billetera..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing || !adminNote.trim()}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs ${
                    actionType === 'Pagado'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {processing
                      ? 'Procesando...'
                      : actionType === 'Pagado'
                      ? 'Confirmar Pago y Enviar Comprobante'
                      : 'Confirmar Rechazo y Devolver Créditos'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
