'use client';

import React, { useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { AEUser } from '@/lib/argentina-empleos/types';
import { Wallet, ShieldCheck, AlertCircle, Check, X } from 'lucide-react';

interface GrantCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: AEUser | null;
  onCreditGranted: () => void;
}

export function GrantCreditModal({
  isOpen,
  onClose,
  targetUser,
  onCreditGranted,
}: GrantCreditModalProps) {
  const { user } = useAEAuth();
  const [amount, setAmount] = useState(10000);
  const [reason, setReason] = useState('Bono especial de bienvenida o destaque');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (amount <= 0) {
      setError('El monto debe ser superior a $0 ARS.');
      return;
    }
    if (!reason.trim()) {
      setError('Por favor especificá el motivo del crédito adicional.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await aeApi.admin.grantCredits(user.id, {
        targetUserId: targetUser.id,
        amount: Number(amount),
        reason,
      });
      onCreditGranted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al otorgar crédito.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-sm bg-amber-100 text-amber-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Otorgar Crédito Adicional
              </h3>
              <p className="text-[11px] text-slate-500">
                Acción exclusiva de Superadmin con registro de auditoría
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
            {error}
          </div>
        )}

        {/* User Card Target */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Usuario Destino:</span>
            <span className="font-bold text-slate-900">{targetUser.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email:</span>
            <span className="text-slate-700 font-mono text-[11px]">{targetUser.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ubicación:</span>
            <span className="text-slate-700">{targetUser.cityName}, {targetUser.provinceName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Monto en Créditos ARS *
            </label>
            <input
              type="number"
              min={100}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm font-mono font-bold text-slate-900 focus:border-[#106EBE] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Motivo o Justificación del Otorgamiento *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Bono especial de fidelización, compensación, etc."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-slate-900 focus:border-[#106EBE] focus:outline-hidden"
            />
          </div>

          <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-sm text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Esta operación registrará una transacción <code>admin_credit</code> y un evento inmutable en el log de auditoría.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold rounded-sm transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{submitting ? 'Otorgando...' : 'Confirmar Otorgamiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
