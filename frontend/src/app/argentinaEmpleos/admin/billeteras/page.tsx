'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { GrantCreditModal } from '@/components/argentina-empleos/admin/grant-credit-modal';
import { AEUser, AEWallet } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Wallet,
  Search,
  ShieldCheck,
  PlusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function AdminBilleterasPage() {
  const { user: currentAdmin } = useAEAuth();
  const [usersList, setUsersList] = useState<Array<AEUser & { wallet?: AEWallet }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AEUser | null>(null);

  const loadWallets = async () => {
    if (!currentAdmin) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.listUsers(currentAdmin.id, { query: search });
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      loadWallets();
    }
  }, [currentAdmin, search]);

  const totalIssued = usersList.reduce(
    (acc, u) => acc + (u.wallet?.internalCredits || 0),
    0,
  );

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

      {loading ? (
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
                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
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
                      <span>Otorgar Crédito</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GrantCreditModal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        targetUser={selectedUser}
        onCreditGranted={loadWallets}
      />
    </div>
  );
}
