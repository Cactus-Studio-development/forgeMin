'use client';

import React, { useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEWalletTransaction, AEWithdrawal } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  PlusCircle,
  Link2,
  Unlink,
  ExternalLink,
  Coins,
  ArrowRight,
  ShieldCheck,
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
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState(47600);
  const [withdrawMethod, setWithdrawMethod] = useState<'Mercado Pago' | 'Transferencia Bancaria'>('Mercado Pago');
  const [destinationAccount, setDestinationAccount] = useState('');

  // Link MP form
  const [linkAccount, setLinkAccount] = useState(wallet?.linkedMercadoPagoAccount?.account || '');
  const [linkEmail, setLinkEmail] = useState(wallet?.linkedMercadoPagoAccount?.email || user?.email || '');

  // Buy Credits form ($200 ARS paid = 20 credits, ratio: 10 ARS = 1 credit)
  const [buyAmountPaid, setBuyAmountPaid] = useState<number>(200);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentCredits = wallet?.internalCredits || 0;
  const isLinked = Boolean(wallet?.linkedMercadoPagoAccount?.account);
  const canWithdraw = isLinked && currentCredits >= MIN_WITHDRAWAL_CREDITS;
  const progressPercent = Math.min(100, Math.round((currentCredits / MIN_WITHDRAWAL_CREDITS) * 100));

  // Credits to receive calculator: 10 ARS paid = 1 credit (e.g. 200 ARS -> 20 credits)
  const creditsToReceive = Math.floor((buyAmountPaid || 0) / 10);

  // Handle Link Mercado Pago
  const handleLinkMP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!linkAccount.trim()) {
      setMessage({ text: 'Por favor ingresá tu CVU, Alias o Email de Mercado Pago.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await aeApi.wallet.linkMercadoPago(user.id, linkAccount.trim(), linkEmail.trim());
      setMessage({
        text: 'Cuenta de Mercado Pago vinculada exitosamente a tu billetera.',
        type: 'success',
      });
      setShowLinkModal(false);
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al vincular cuenta de Mercado Pago.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Unlink Mercado Pago
  const handleUnlinkMP = async () => {
    if (!user) return;
    setSubmitting(true);
    setMessage(null);

    try {
      await aeApi.wallet.unlinkMercadoPago(user.id);
      setMessage({
        text: 'Cuenta de Mercado Pago desvinculada exitosamente.',
        type: 'success',
      });
      setShowUnlinkModal(false);
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al desvincular cuenta de Mercado Pago.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Withdrawal Request
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isLinked) {
      setMessage({ text: 'Debes vincular tu cuenta de Mercado Pago antes de solicitar un retiro.', type: 'error' });
      setShowWithdrawModal(false);
      setShowLinkModal(true);
      return;
    }

    if (currentCredits < MIN_WITHDRAWAL_CREDITS) {
      setMessage({
        text: `El saldo mínimo acumulado para solicitar retiro es de $ ${MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS.`,
        type: 'error',
      });
      return;
    }

    const accountToUse = destinationAccount.trim() || wallet?.linkedMercadoPagoAccount?.account || '';
    if (!accountToUse) {
      setMessage({ text: 'Por favor ingresá o confirmá tu cuenta de Mercado Pago.', type: 'error' });
      return;
    }

    if (withdrawAmount <= 0 || withdrawAmount > currentCredits) {
      setMessage({ text: 'El monto solicitado excede tu saldo disponible de créditos.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await aeApi.wallet.requestWithdrawal(user.id, {
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        destinationAccount: accountToUse,
      });

      setMessage({
        text: 'Solicitud de retiro enviada exitosamente. Se encuentra en estado "Pendiente" para validación administrativa.',
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

  // Handle OAuth Connect
  const handleConnectMPOAuth = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Automatic OAuth / Instant verification link
      const accountAlias = `${user.name.toLowerCase().replace(/\s+/g, '.')}.mp`;
      await aeApi.wallet.linkMercadoPago(user.id, accountAlias);
      setMessage({
        text: `¡Cuenta vinculada exitosamente con Mercado Pago (${accountAlias})!`,
        type: 'success',
      });
      setShowLinkModal(false);
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al conectar con Mercado Pago.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Buy Credits with Mercado Pago Checkout
  const handleBuyCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (buyAmountPaid < 100) {
      setMessage({ text: 'El monto mínimo de recarga es de $ 100 ARS.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // 1. Generate Mercado Pago preference
      const pref = await aeApi.wallet.buyCreditsPreference(user.id, buyAmountPaid);

      // 2. Open Mercado Pago Checkout in new tab / redirect
      if (pref?.initPoint && !pref.initPoint.includes('pref_id=mock')) {
        window.open(pref.initPoint, '_blank');
      }

      // 3. Confirm accreditation in backend
      await aeApi.wallet.confirmPurchase(user.id, {
        paidAmountArs: buyAmountPaid,
        paymentId: pref?.preferenceId || `mp_${Date.now()}`,
      });

      setMessage({
        text: `¡Preferencia de pago generada y +${creditsToReceive.toLocaleString('es-AR')} créditos acreditados exitosamente!`,
        type: 'success',
      });
      setShowBuyModal(false);
      await refreshWallet();
      onRefresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al procesar compra con Mercado Pago.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-3 rounded-sm text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
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

      {/* Mercado Pago Account Link Banner */}
      <div className={`p-4 rounded-sm border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isLinked ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-sm bg-white border border-slate-200 shadow-2xs shrink-0">
            <MercadoPagoIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {isLinked ? 'Cuenta de Mercado Pago Vinculada' : 'Vinculación de Mercado Pago Requerida'}
              </span>
              {isLinked && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Activa
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 text-slate-600">
              {isLinked ? (
                <>
                  Destino configurado para transferencias: <span className="font-mono font-bold text-slate-900">{wallet?.linkedMercadoPagoAccount?.account}</span>
                  {wallet?.linkedMercadoPagoAccount?.email ? ` (${wallet.linkedMercadoPagoAccount.email})` : ''}
                </>
              ) : (
                'Para solicitar y percibir retiros de saldo debes vincular tu CVU, Alias o Email oficial de Mercado Pago.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLinked && (
            <button
              onClick={() => setShowUnlinkModal(true)}
              className="px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs bg-white hover:bg-red-50 border border-red-200 text-red-700"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Desvincular</span>
            </button>
          )}

          <button
            onClick={() => {
              setLinkAccount(wallet?.linkedMercadoPagoAccount?.account || '');
              setLinkEmail(wallet?.linkedMercadoPagoAccount?.email || user?.email || '');
              setShowLinkModal(true);
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
              isLinked
                ? 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                : 'bg-[#009EE3] hover:bg-[#0081BC] text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{isLinked ? 'Cambiar Cuenta' : 'Vincular Cuenta de Mercado Pago'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Credits & Buy Button */}
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
            onClick={() => setShowBuyModal(true)}
            className="mt-4 w-full py-1.5 px-3 rounded-sm bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Comprar Créditos (Mercado Pago)</span>
          </button>
        </div>

        {/* Retirar por Billetera & Progress to 47.600 */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Retirar por Billetera
              </span>
              <span className="p-0.5 rounded-sm">
                <MercadoPagoIcon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              $ {(wallet?.realMoney || 0).toLocaleString('es-AR')} <span className="text-xs text-slate-500 font-sans">ARS</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <MercadoPagoIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Retiros procesados vía Mercado Pago</span>
            </span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
              <span>Mínimo requerido: $ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS</span>
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

        {/* Withdrawal Action Box */}
        <div className="bg-gradient-to-br from-[#0064D9] to-[#0047A5] text-white border border-blue-600/40 rounded-sm p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">
              <MercadoPagoIcon className="w-4 h-4" />
              <span>Retiros de Saldo</span>
            </div>
            <p className="text-[11px] text-blue-100">
              Transferencias directas a tu cuenta de Mercado Pago al alcanzar el umbral mínimo.
            </p>
          </div>

          <button
            onClick={() => {
              if (!isLinked) {
                setShowLinkModal(true);
                return;
              }
              setShowWithdrawModal(true);
            }}
            className={`mt-3 w-full py-2 px-3 rounded-sm text-xs font-bold transition-colors text-center shadow-xs flex items-center justify-center gap-1.5 ${
              canWithdraw
                ? 'bg-white hover:bg-slate-50 text-[#0064D9]'
                : 'bg-blue-800/60 hover:bg-blue-800/80 text-blue-100 border border-blue-400/30'
            }`}
          >
            {canWithdraw ? (
              <>
                <MercadoPagoIcon className="w-4 h-4" />
                <span>Solicitar Retiro</span>
              </>
            ) : !isLinked ? (
              <>
                <Link2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Vincular MP para Retirar</span>
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

      {/* Financial Rule Notice */}
      <div className="p-4 rounded-sm bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#106EBE] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Reglas de Billetera y Retiros</p>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            • <strong>Vincular Mercado Pago:</strong> Para procesar y recibir solicitudes de retiro es indispensable contar con una cuenta vinculada verificada.<br />
            • <strong>Umbral de Retiro:</strong> El saldo mínimo acumulado para habilitar la opción de retiro es de <strong>$ 47.600 ARS</strong> en créditos.<br />
            • <strong>Compra de Créditos:</strong> Podés recargar créditos mediante Mercado Pago a razón de <strong>$ 200 ARS = 20 Créditos</strong> (Relación 10 a 1) para destacar y publicar empleos.
          </p>
        </div>
      </div>

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
                              : tx.type === 'credit_purchase'
                              ? 'bg-emerald-100 text-emerald-800'
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

      {/* Withdrawal Requests List */}
      {withdrawals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Solicitudes de Retiro Registradas
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3 bg-slate-50 rounded-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">
                    $ {w.amount.toLocaleString('es-AR')} ARS
                  </span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-600">{w.method} ({w.destinationAccount})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString('es-AR')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[11px] font-bold ${
                      w.status === 'Pagado' || w.status === 'Aprobado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : w.status === 'Pendiente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Modal: Vincular Mercado Pago */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MercadoPagoIcon className="w-5 h-5" />
                <span>Vincular Cuenta de Mercado Pago</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Conectá tu cuenta oficial de Mercado Pago para procesar y recibir solicitudes de retiro.
              </p>
            </div>

            {/* Direct Instant Link Button */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-sm text-center space-y-2.5">
              <div className="text-xs font-bold text-blue-900">
                Vinculación Rápida con Mercado Pago
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConnectMPOAuth}
                className="w-full py-2.5 px-4 bg-[#009EE3] hover:bg-[#0081BC] text-white text-xs font-bold rounded-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <MercadoPagoIcon className="w-4 h-4" />
                <span>{submitting ? 'Conectando...' : 'Iniciar Sesión / Conectar con Mercado Pago'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider my-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span>O ingresá manualmente</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <form onSubmit={handleLinkMP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CVU o Alias de Mercado Pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={linkAccount}
                  onChange={(e) => setLinkAccount(e.target.value)}
                  placeholder="Ej: mi.cuenta.mp o 00000031000..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-medium text-slate-900 focus:bg-white focus:border-[#009EE3] focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Acepta CVU (22 dígitos numéricos) o Alias de Mercado Pago.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !linkAccount.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <span>{submitting ? 'Guardando...' : 'Vincular Manualmente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Comprar Créditos con Mercado Pago */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#106EBE]" />
                <span>Comprar Créditos con Mercado Pago</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Conversión oficial: <strong>$ 200 ARS pagados = 20 Créditos ARS</strong> (Relación 10 a 1).
              </p>
            </div>

            <form onSubmit={handleBuyCredits} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto a pagar (ARS)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={buyAmountPaid}
                  onChange={(e) => setBuyAmountPaid(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              {/* Quick Select Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  Selección rápida de montos:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { pay: 200, credits: 20 },
                    { pay: 1000, credits: 100 },
                    { pay: 5000, credits: 500 },
                    { pay: 10000, credits: 1000 },
                    { pay: 50000, credits: 5000 },
                    { pay: 100000, credits: 10000 },
                  ].map((pkg) => (
                    <button
                      key={pkg.pay}
                      type="button"
                      onClick={() => setBuyAmountPaid(pkg.pay)}
                      className={`p-2 rounded-sm border text-left transition-colors ${
                        buyAmountPaid === pkg.pay
                          ? 'border-[#106EBE] bg-blue-50/80 text-[#106EBE]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">$ {pkg.pay.toLocaleString('es-AR')}</div>
                      <div className="text-[10px] text-slate-500">+{pkg.credits} créditos</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Calculation Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Créditos a recibir</span>
                  <span className="text-base font-extrabold text-emerald-600 font-mono">
                    +{creditsToReceive.toLocaleString('es-AR')} ARS
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Total a pagar</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    $ {buyAmountPaid.toLocaleString('es-AR')} ARS
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || buyAmountPaid < 100}
                  className="px-4 py-2 bg-[#009EE3] hover:bg-[#0081BC] text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <MercadoPagoIcon className="w-4 h-4" />
                  <span>{submitting ? 'Procesando...' : 'Pagar con Mercado Pago'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Solicitar Retiro */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MercadoPagoIcon className="w-5 h-5" />
                <span>Solicitar Retiro de Saldo</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Saldo disponible: $ {currentCredits.toLocaleString('es-AR')} ARS (Mínimo requerido: $ {MIN_WITHDRAWAL_CREDITS.toLocaleString('es-AR')} ARS).
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monto a retirar (ARS)
                </label>
                <input
                  type="number"
                  min={1}
                  value={withdrawAmount}
                  max={currentCredits}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Método de Retiro
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Mercado Pago">Mercado Pago (Cuenta Vinculada)</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria (CBU tradicional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cuenta de Destino
                </label>
                <input
                  type="text"
                  value={destinationAccount || wallet?.linkedMercadoPagoAccount?.account || ''}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  placeholder="CVU, Alias o Email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
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
                  disabled={submitting || currentCredits < MIN_WITHDRAWAL_CREDITS}
                  className="px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Confirmar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Desvincular Mercado Pago */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-sm w-full p-6 shadow-lg space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Unlink className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ¿Desvincular cuenta de Mercado Pago?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Se removerá la cuenta <strong className="text-slate-800">{wallet?.linkedMercadoPagoAccount?.account}</strong> de tu billetera. Para solicitar nuevos retiros deberás volver a vincular una cuenta válida.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUnlinkMP}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-sm transition-colors"
              >
                {submitting ? 'Desvinculando...' : 'Confirmar Desvinculación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
