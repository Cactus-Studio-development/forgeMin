'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { GrantCreditModal } from '@/components/argentina-empleos/admin/grant-credit-modal';
import { InviteCandidateModal } from '@/components/argentina-empleos/admin/invite-candidate-modal';
import { AEAvatar } from '@/components/argentina-empleos/ui/ae-avatar';
import { AEConfirmModal } from '@/components/argentina-empleos/ui/ae-confirm-modal';
import { AEUser, AEWallet } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Users,
  Search,
  Wallet,
  Shield,
  Lock,
  Unlock,
  MapPin,
  Loader2,
  Send,
  UserCheck,
  Building2,
  UserX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export default function AdminUsuariosPage() {
  const { user: currentAdmin } = useAEAuth();
  const [usersList, setUsersList] = useState<Array<AEUser & { wallet?: AEWallet }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination & Queue State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals State
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<AEUser | null>(null);
  const [selectedUserForInvite, setSelectedUserForInvite] = useState<AEUser | null>(null);
  const [userToToggleBlock, setUserToToggleBlock] = useState<AEUser | null>(null);
  const [togglingBlock, setTogglingBlock] = useState(false);

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

  const confirmToggleBlock = async () => {
    if (!currentAdmin || !userToToggleBlock) return;
    setTogglingBlock(true);

    try {
      await aeApi.admin.toggleBlockUser(
        currentAdmin.id,
        userToToggleBlock.id,
        !userToToggleBlock.isBlocked,
      );
      setUserToToggleBlock(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingBlock(false);
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = usersList.length;
    const candidates = usersList.filter(
      (u) => (u.userType === 'candidato' || !u.userType) && u.role !== 'superadmin',
    ).length;
    const companies = usersList.filter((u) => u.userType === 'empresa').length;
    const blocked = usersList.filter((u) => u.isBlocked).length;
    return { total, candidates, companies, blocked };
  }, [usersList]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Role / Type Filter
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'superadmin' && u.role !== 'superadmin') return false;
        if (roleFilter === 'empresa' && u.userType !== 'empresa') return false;
        if (roleFilter === 'candidato' && (u.userType === 'empresa' || u.role === 'superadmin')) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === 'active' && u.isBlocked) return false;
      if (statusFilter === 'blocked' && !u.isBlocked) return false;

      return true;
    });
  }, [usersList, roleFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, pageSize]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{metrics.total}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#106EBE] rounded-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Postulantes</p>
            <p className="text-xl font-extrabold text-blue-700 mt-1">{metrics.candidates}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Empresas</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{metrics.companies}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-sm">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bloqueados</p>
            <p className="text-xl font-extrabold text-red-600 mt-1">{metrics.blocked}</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-sm">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
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
              placeholder="Buscar nombre, email o ciudad..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filters and Queue Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Role / User Type Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="ALL">Tipo / Rol: Todos</option>
                <option value="candidato">Postulantes (Candidatos)</option>
                <option value="empresa">Empresas (Empleadores)</option>
                <option value="superadmin">Superadministradores</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="ALL">Estado: Todos</option>
                <option value="active">Activos</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-center sm:justify-end">
              {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] text-[#106EBE] hover:underline font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer filtros</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Cola de carga / ver por página:</span>
              {[5, 10, 20, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`px-2 py-0.5 rounded-xs font-bold text-[11px] transition-colors ${
                    pageSize === size
                      ? 'bg-[#106EBE] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Container with Max Height */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] z-10 shadow-2xs">
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
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <AEAvatar user={u} size="sm" showBadge={true} />
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
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
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Invite Candidate (Headhunting) Button */}
                        <button
                          onClick={() => setSelectedUserForInvite(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-sm font-bold text-[11px] transition-colors"
                          title="Enviar invitación directa a postularse a una vacante"
                        >
                          <Send className="w-3 h-3 text-amber-700" />
                          <span>Invitar</span>
                        </button>

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
                          onClick={() => setUserToToggleBlock(u)}
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

        {/* Pagination Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              Mostrando <span className="font-bold text-slate-900">{startIndex + 1}</span> a{' '}
              <span className="font-bold text-slate-900">
                {Math.min(startIndex + pageSize, filteredUsers.length)}
              </span>{' '}
              de <span className="font-bold text-slate-900">{filteredUsers.length}</span> usuarios
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-slate-200 rounded-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((pageNum, idx, arr) => (
                    <React.Fragment key={pageNum}>
                      {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-7 px-2 font-bold text-xs rounded-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-[#106EBE] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-slate-200 rounded-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block/Unblock Confirmation Modal */}
      <AEConfirmModal
        isOpen={Boolean(userToToggleBlock)}
        onClose={() => setUserToToggleBlock(null)}
        onConfirm={confirmToggleBlock}
        loading={togglingBlock}
        title={
          userToToggleBlock?.isBlocked
            ? `¿Desbloquear a ${userToToggleBlock?.name}?`
            : `¿Bloquear a ${userToToggleBlock?.name}?`
        }
        description={
          userToToggleBlock?.isBlocked
            ? 'El usuario podrá volver a iniciar sesión, acceder a la plataforma y publicar ofertas con normalidad.'
            : 'El usuario no podrá acceder a la plataforma, publicar ofertas ni postularse mientras permanezca bloqueado.'
        }
        confirmText={
          userToToggleBlock?.isBlocked ? 'Sí, desbloquear usuario' : 'Sí, bloquear usuario'
        }
        cancelText="Cancelar"
        variant={userToToggleBlock?.isBlocked ? 'primary' : 'danger'}
        itemDetails={
          userToToggleBlock
            ? {
                title: userToToggleBlock.name,
                subtitle: `${userToToggleBlock.email} • Rol: ${userToToggleBlock.role}`,
                badge: userToToggleBlock.isBlocked ? 'Actualmente Bloqueado' : 'Usuario Activo',
              }
            : undefined
        }
      />

      {/* Grant Credit Modal */}
      <GrantCreditModal
        isOpen={Boolean(selectedUserForCredit)}
        onClose={() => setSelectedUserForCredit(null)}
        targetUser={selectedUserForCredit}
        onCreditGranted={loadUsers}
      />

      {/* Invite Candidate Modal */}
      <InviteCandidateModal
        isOpen={Boolean(selectedUserForInvite)}
        onClose={() => setSelectedUserForInvite(null)}
        targetCandidate={selectedUserForInvite}
      />
    </div>
  );
}

