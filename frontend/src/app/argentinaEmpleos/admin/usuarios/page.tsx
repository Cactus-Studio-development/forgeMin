'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { GrantCreditModal } from '@/components/argentina-empleos/admin/grant-credit-modal';
import { AEUser, AEWallet } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Users,
  Search,
  Wallet,
  Shield,
  Lock,
  Unlock,
  PlusCircle,
  MapPin,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function AdminUsuariosPage() {
  const { user: currentAdmin } = useAEAuth();
  const [usersList, setUsersList] = useState<Array<AEUser & { wallet?: AEWallet }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<AEUser | null>(null);

  const loadUsers = async () => {
    if (!currentAdmin) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.listUsers(currentAdmin.id, {
        query: searchQuery,
      });
      setUsersList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      loadUsers();
    }
  }, [currentAdmin, searchQuery]);

  const toggleBlock = async (targetUser: AEUser) => {
    if (!currentAdmin) return;
    const actionText = targetUser.isBlocked ? 'desbloquear' : 'bloquear';
    if (!confirm(`¿Estás seguro de ${actionText} a ${targetUser.name}?`)) return;

    try {
      await aeApi.admin.toggleBlockUser(
        currentAdmin.id,
        targetUser.id,
        !targetUser.isBlocked,
      );
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#106EBE]" />
            Directorio y Gestión de Usuarios
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspeccioná perfiles, balances de billeteras internas, bloqueos y otorgamiento de créditos.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email o ciudad..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Tipo / Perfil</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4 text-right">Saldo Créditos</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-xs font-semibold text-[10px] bg-slate-100 text-slate-800">
                        {u.userType || 'candidato'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{u.cityName || 'Posadas'}, {u.provinceName || 'Misiones'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                          u.role === 'superadmin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      $ {(u.wallet?.internalCredits || 0).toLocaleString('es-AR')} ARS
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.isBlocked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {u.isBlocked ? 'Bloqueado' : 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {/* Grant Credit Button */}
                      <button
                        onClick={() => setSelectedUserForCredit(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#106EBE] rounded-sm font-bold text-[11px] transition-colors"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Dar Crédito</span>
                      </button>

                      {/* Block / Unblock Button */}
                      <button
                        onClick={() => toggleBlock(u)}
                        className={`p-1 rounded-sm text-xs font-semibold ${
                          u.isBlocked
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={u.isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                      >
                        {u.isBlocked ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Credit Modal */}
      <GrantCreditModal
        isOpen={Boolean(selectedUserForCredit)}
        onClose={() => setSelectedUserForCredit(null)}
        targetUser={selectedUserForCredit}
        onCreditGranted={loadUsers}
      />
    </div>
  );
}
