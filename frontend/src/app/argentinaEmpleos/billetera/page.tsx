'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { WalletSummary } from '@/components/argentina-empleos/wallet/wallet-summary';
import { AEWalletTransaction, AEWithdrawal } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { Wallet } from 'lucide-react';
import { AEWalletSkeleton } from '@/components/argentina-empleos/ui/ae-skeleton';

export default function ArgentinaEmpleosBilleteraPage() {
  const { user, refreshWallet } = useAEAuth();
  const [transactions, setTransactions] = useState<AEWalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<AEWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.wallet.getMyWallet(user.id);
      setTransactions(data.transactions || []);
      setWithdrawals(data.withdrawals || []);
      await refreshWallet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  return (
    <AEShell>
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#106EBE]" />
            Mi Billetera & Créditos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultá tu saldo disponible en créditos ARS, historial de bienvenida y solicitudes de retiro.
          </p>
        </div>

        {loading ? (
          <AEWalletSkeleton />
        ) : (
          <WalletSummary
            transactions={transactions}
            withdrawals={withdrawals}
            onRefresh={loadData}
          />
        )}
      </div>
    </AEShell>
  );
}
