'use client';

import React, { useState, useEffect } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEWalletTransaction, AEWithdrawal, AECreditRequest } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  PlusCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  Sparkles,
  Send,
  Loader2,
  Building,
} from 'lucide-react';

interface WalletSummaryProps {
  transactions: AEWalletTransaction[];
  withdrawals: AEWithdrawal[];
  onRefresh: () => void;
}

const MIN_WITHDRAWAL_CREDITS = 47600;

export function WalletSummary({ transactions, withdrawals, onRefresh }: WalletSummaryProps) {
  const { user, wallet, refreshWallet } = useAEAuth();

  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRequestCreditsModal, setShowRequestCreditsModal] = useState(false);

  // Credit requests history
  const [creditRequests, setCreditRequests] = useState<AECreditRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Request Credits Form
  const [requestCreditsAmount, setRequestCreditsAmount] = useState<number>(10000);
  const [requestCreditsReason, setRequestCreditsReason] = useState<string>(
    'Créditos para publicación y destaque de vacantes laborales en la plataforma.',
  );

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState(47600);
  const [withdrawMethod, setWithdrawMethod] = useState<'Mercado Pago' | 'Transferencia Bancaria'>('Mercado Pago');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [destinationHolder, setDestinationHolder] = useState(user?.name || '');
  const [destinationDniCuil, setDestinationDniCuil] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentCredits = wallet?.internalCredits || 0;
  const canWithdraw = currentCredits >= MIN_WITHDRAWAL_CREDITS;
  const progressPercent = Math.min(100, Math.round((currentCredits / MIN_WITHDRAWAL_CREDITS) * 100));

  // Load Credit Requests
  const loadCreditRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const data = await aeApi.wallet.getMyCreditRequests(user.id);
      setCreditRequests(data || []);
    } catch (err) {
      console.error('Error cargando solicitudes de crédito:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCreditRequests();
    }
  }, [user]);

  // Handle Request Credits Submit
  const handleRequestCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (requestCreditsAmount <= 0) {
      setMessage({ text: 'El monto solicitado debe ser mayor a 0.', type: 'error' });
      return;
    }
    if (!requestCreditsReason.trim()) {
      setMessage({ text: 'Por favor completá el motivo de la solicitud.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await aeApi.wallet.requestCredits(user.id, {
        amount: Number(requestCreditsAmount),
        reason: requestCreditsReason.trim(),
      });

      setMessage({
        text: `Solicitud de $ ${requestCreditsAmount.toLocaleString('es-AR')} créditos enviada al Superadmin para su aprobación.`,
        type: 'success',
      });
      setShowRequestCreditsModal(false);
      await loadCreditRequests();
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al solicitar créditos.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Withdrawal Request Submit
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (currentCredits < MIN_WITHDRAWAL_CREDITS) {
      setMessage({
        text: `El saldo mínimo requerido para solicitar retiro es de $ ${MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS.`,
        type: 'error',
      });
      return;
    }

    if (!destinationAccount.trim()) {
      setMessage({
        text: 'Por favor ingresá tu CVU, CBU o Alias de cuenta digital para la transferencia.',
        type: 'error',
      });
      return;
    }

    if (withdrawAmount <= 0 || withdrawAmount > currentCredits) {
      setMessage({
        text: 'El monto solicitado excede tu saldo disponible de créditos.',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const fullDestination = `${destinationAccount.trim()} - Titular: ${destinationHolder.trim() || user.name} (${destinationDniCuil.trim() || 'DNI'})`;

      await aeApi.wallet.requestWithdrawal(user.id, {
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        destinationAccount: fullDestination,
      });

      setMessage({
        text: 'Solicitud de retiro enviada exitosamente al Superadmin. El dinero será transferido a tu cuenta digital.',
        type: 'success',
      });
      setShowWithdrawModal(false);
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al solicitar retiro.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-3.5 rounded-sm text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] underline font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Credits & Request Credits Button */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Saldo Disponible
              </span>
              <span className="p-1 rounded-sm bg-blue-50 text-[#106EBE]">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              $ {currentCredits.toLocaleString('es-AR')} <span className="text-xs text-slate-500 font-sans">ARS</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Créditos internos de la plataforma
            </span>
          </div>

          <button
            onClick={() => setShowRequestCreditsModal(true)}
            className="mt-4 w-full py-2 px-3 rounded-sm bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Solicitar Créditos</span>
          </button>
        </div>

        {/* Retirar por Cuenta Digital & Progress */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Retiros a Cuenta Digital
              </span>
              <span className="p-1 rounded-sm bg-purple-50 text-purple-700">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              $ {currentCredits.toLocaleString('es-AR')} <span className="text-xs text-slate-500 font-sans">ARS</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Disponibles para conversión y depósito
            </span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
              <span>Umbral mínimo: $ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS</span>
              <span className="font-mono font-bold text-slate-900">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#106EBE]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Withdrawal Direct Action Box */}
        <div className="bg-gradient-to-br from-[#0064D9] to-[#0047A5] text-white border border-blue-600/40 rounded-sm p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">
              <CreditCard className="w-4 h-4" />
              <span>Retiro de Saldo</span>
            </div>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              Transferencia bancaria o a billetera digital directa a tu cuenta al alcanzar el umbral.
            </p>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className={`mt-3 w-full py-2 px-3 rounded-sm text-xs font-bold transition-colors text-center shadow-xs flex items-center justify-center gap-1.5 ${
              canWithdraw
                ? 'bg-white hover:bg-slate-50 text-[#0064D9]'
                : 'bg-blue-800/60 hover:bg-blue-800/80 text-blue-100 border border-blue-400/30'
            }`}
          >
            {canWithdraw ? (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Solicitar Retiro por Cuenta Digital</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-blue-200" />
                <span>Requiere $ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Credit Requests List */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#106EBE]" />
            <span>Mis Solicitudes de Crédito a Administración</span>
          </h3>
          <button
            onClick={() => setShowRequestCreditsModal(true)}
            className="px-2.5 py-1 bg-[#106EBE] hover:bg-[#005A9E] text-white text-[11px] font-bold rounded-xs transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Nueva Solicitud</span>
          </button>
        </div>

        <div className="p-4">
          {loadingRequests ? (
            <div className="p-4 text-center text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#106EBE] mx-auto mb-1" />
              <span>Cargando solicitudes de créditos...</span>
            </div>
          ) : creditRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              No registrás solicitudes de créditos pendientes en este momento.
            </p>
          ) : (
            <div className="space-y-3">
              {creditRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      $ {req.amount.toLocaleString('es-AR')} ARS
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Aprobado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px]">
                    <strong>Motivo:</strong> {req.reason}
                  </p>

                  {req.adminNotes && (
                    <div className="p-2 bg-white border border-slate-200 rounded-xs text-[11px] text-slate-700">
                      <strong>Respuesta de Administración:</strong> {req.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Requests List */}
      {withdrawals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span>Solicitudes de Retiro de Saldo</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {withdrawals.length} {withdrawals.length === 1 ? 'solicitud' : 'solicitudes'}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3.5 bg-slate-50/70 rounded-sm border border-slate-200 space-y-2.5 text-xs transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      $ {w.amount.toLocaleString('es-AR')} ARS
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-semibold">{w.method}</span>
                    <span className="font-mono text-slate-500 text-[11px] bg-white px-1.5 py-0.5 rounded-xs border border-slate-200">
                      {w.destinationAccount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      {new Date(w.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        w.status === 'Pagado' || w.status === 'Aprobado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : w.status === 'Pendiente'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {w.status === 'Pagado' || w.status === 'Aprobado' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : w.status === 'Pendiente' ? (
                        <Clock className="w-3 h-3 text-amber-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span>{w.status}</span>
                    </span>
                  </div>
                </div>

                {/* Admin Official Response Box */}
                {w.adminNotes && (
                  <div
                    className={`p-2.5 rounded-xs border text-[11px] leading-relaxed flex items-start gap-2 ${
                      w.status === 'Pagado' || w.status === 'Aprobado'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : w.status === 'Rechazado'
                        ? 'bg-red-50/80 border-red-200 text-red-950'
                        : 'bg-blue-50/70 border-blue-200 text-blue-950'
                    }`}
                  >
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        w.status === 'Pagado' || w.status === 'Aprobado'
                          ? 'text-emerald-600'
                          : w.status === 'Rechazado'
                          ? 'text-red-600'
                          : 'text-[#106EBE]'
                      }`}
                    />
                    <div>
                      <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                        {w.status === 'Pagado' || w.status === 'Aprobado'
                          ? 'Respuesta Oficial & Comprobante de Depósito:'
                          : w.status === 'Rechazado'
                          ? 'Motivo de Rechazo & Reintegro de Créditos:'
                          : 'Estado Administrativo:'}
                      </span>
                      <span>{w.adminNotes}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Historial de Movimientos y Transacciones
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {transactions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Descripción</th>
                <th className="py-2.5 px-4">Origen</th>
                <th className="py-2.5 px-4 text-right">Monto</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No se registran movimientos en la billetera.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                            tx.type === 'welcome_credit'
                              ? 'bg-purple-100 text-purple-800'
                              : tx.type === 'admin_credit'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] capitalize">
                        {tx.source}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tx.amount.toLocaleString('es-AR')} ARS
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Solicitar Créditos a Administración */}
      {showRequestCreditsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#106EBE]" />
                  <span>Solicitar Créditos a Administración</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enviá tu solicitud de créditos indicando el monto y motivo. El Superadmin la revisará para su acreditación.
                </p>
              </div>
              <button
                onClick={() => setShowRequestCreditsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xs text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleRequestCreditsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto de Créditos Solicitado ($ ARS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={requestCreditsAmount}
                  onChange={(e) => setRequestCreditsAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 25000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRequestCreditsAmount(amt)}
                    className={`py-1.5 px-2 rounded-xs border text-xs font-mono font-bold text-center transition-colors ${
                      requestCreditsAmount === amt
                        ? 'bg-blue-50 text-[#106EBE] border-[#106EBE]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    $ {amt.toLocaleString('es-AR')}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Justificación de la Solicitud <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestCreditsReason}
                  onChange={(e) => setRequestCreditsReason(e.target.value)}
                  placeholder="Detallá el uso de los créditos solicitados..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestCreditsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || requestCreditsAmount <= 0 || !requestCreditsReason.trim()}
                  className="px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submitting ? 'Enviando...' : 'Enviar Solicitud al Superadmin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Solicitar Retiro a Cuenta Digital */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#106EBE]" />
                  <span>Solicitar Retiro de Saldo</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Saldo disponible: $ {currentCredits.toLocaleString('es-AR')} ARS (Mínimo requerido: $ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS).
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {currentCredits < MIN_WITHDRAWAL_CREDITS && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Umbral de retiro no alcanzado</span>
                  <span>
                    Tu saldo actual es de <strong>$ {currentCredits.toLocaleString('es-AR')} ARS</strong>. Necesitás alcanzar al menos <strong>$ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS</strong> para solicitar un retiro a tu cuenta digital.
                  </span>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-3 rounded-xs text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto a retirar ($ ARS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Destino
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden font-medium"
                >
                  <option value="Mercado Pago">Billetera Digital / Mercado Pago (CVU o Alias)</option>
                  <option value="Transferencia Bancaria">Cuenta Bancaria Tradicional (CBU o Alias)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CVU / CBU o Alias de Destino <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  placeholder="Ej: 00000031000... o mi.alias.digital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titular de la Cuenta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationHolder}
                    onChange={(e) => setDestinationHolder(e.target.value)}
                    placeholder="Nombre y Apellido"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CUIT / CUIL o DNI
                  </label>
                  <input
                    type="text"
                    value={destinationDniCuil}
                    onChange={(e) => setDestinationDniCuil(e.target.value)}
                    placeholder="Ej: 20-39128341-2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || currentCredits < MIN_WITHDRAWAL_CREDITS || !destinationAccount.trim()}
                  className="px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] disabled:bg-slate-300 text-white font-bold rounded-sm text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submitting ? 'Enviando...' : 'Confirmar Solicitud de Retiro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
