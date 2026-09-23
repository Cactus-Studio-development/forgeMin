'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AIJobGeneratorModal } from '@/components/argentina-empleos/admin/ai-job-generator-modal';
import { AEConfirmModal } from '@/components/argentina-empleos/ui/ae-confirm-modal';
import { AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { DEFAULT_JOB_CATEGORIES } from '@/lib/argentina-empleos/geo-data';
import {
  Briefcase,
  Bot,
  MapPin,
  Building,
  Trash2,
  ExternalLink,
  PlusCircle,
  Loader2,
  Search,
  Filter,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  RotateCcw,
} from 'lucide-react';

export default function AdminTrabajosPage() {
  const { user } = useAEAuth();
  const [jobs, setJobs] = useState<AEJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<AEJob | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [modalityFilter, setModalityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Pagination & Queue State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const loadJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.listAllJobs(user.id);
      setJobs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const confirmDelete = async () => {
    if (!user || !jobToDelete) return;
    setDeleting(true);
    try {
      await aeApi.jobs.deleteJob(jobToDelete.id, user.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      setJobToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = jobs.length;
    const aiCount = jobs.filter((j) => j.sourceType === 'AI_GENERATED').length;
    const adminCount = jobs.filter((j) => j.sourceType === 'ADMIN_CREATED').length;
    const realCount = jobs.filter((j) => j.sourceType === 'REAL' || !j.sourceType).length;
    const remoteCount = jobs.filter((j) => j.modality === 'Remoto').length;
    return { total, aiCount, adminCount, realCount, remoteCount };
  }, [jobs]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesCompany = job.company?.toLowerCase().includes(q);
        const matchesEmail = job.creatorEmail?.toLowerCase().includes(q);
        const matchesCity = job.cityName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesEmail && !matchesCity) {
          return false;
        }
      }

      // Source Filter
      if (sourceFilter !== 'ALL' && job.sourceType !== sourceFilter) {
        return false;
      }

      // Modality Filter
      if (modalityFilter !== 'ALL' && job.modality !== modalityFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'ALL' && job.categoryId !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, sourceFilter, modalityFilter, categoryFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sourceFilter, modalityFilter, categoryFilter, pageSize]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceFilter('ALL');
    setModalityFilter('ALL');
    setCategoryFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Vacantes</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{metrics.total}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#106EBE] rounded-sm">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Generadas por IA</p>
            <p className="text-xl font-extrabold text-indigo-700 mt-1">{metrics.aiCount}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-sm">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Creadas por Admin</p>
            <p className="text-xl font-extrabold text-blue-700 mt-1">{metrics.adminCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-sm">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Empresas / Reales</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{metrics.realCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-sm">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#106EBE]" />
              Moderación y Control de Oportunidades
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisá y filtrá todas las vacantes publicadas por usuarios, administradores y generadas por IA.
            </p>
          </div>

          <button
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors shadow-xs shrink-0"
          >
            <Bot className="w-4 h-4 text-[#0FFCBE]" />
            <span>Generar Vacante IA</span>
          </button>
        </div>

        {/* Filters and Queue Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar puesto, empresa, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>

            {/* Source Type Filter */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="ALL">Origen: Todos</option>
                <option value="AI_GENERATED">Generados por IA</option>
                <option value="ADMIN_CREATED">Creados por Superadmin</option>
                <option value="REAL">Empresas / Reales</option>
              </select>
            </div>

            {/* Modality Filter */}
            <div>
              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="ALL">Modalidad: Todas</option>
                <option value="Presencial">Presencial</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Remoto">Remoto</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="ALL">Categoría: Todas</option>
                {DEFAULT_JOB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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

            {(searchQuery || sourceFilter !== 'ALL' || modalityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-[#106EBE] hover:underline font-bold self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Container with Max Height */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando publicaciones...</p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] z-10 shadow-2xs">
                <tr>
                  <th className="py-3 px-4">Puesto / Empresa</th>
                  <th className="py-3 px-4">Ubicación & Modalidad</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4">Publicador</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No se encontraron vacantes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{job.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{job.company}</span>
                          {job.isAnonymous && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                              Anónima
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{job.cityName}, {job.provinceName}</div>
                        <span className="text-[10px] text-slate-500">{job.modality}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                            job.sourceType === 'AI_GENERATED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : job.sourceType === 'ADMIN_CREATED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {job.sourceType || 'REAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 font-mono">
                        {job.creatorEmail}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link
                          href={`/argentinaEmpleos/trabajos/detalle?id=${job.id}`}
                          className="p-1 text-slate-600 hover:text-[#106EBE] inline-block"
                          title="Ver detalle"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setJobToDelete(job)}
                          className="p-1 text-slate-400 hover:text-red-600 inline-block"
                          title="Eliminar vacante"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        {!loading && filteredJobs.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              Mostrando <span className="font-bold text-slate-900">{startIndex + 1}</span> a{' '}
              <span className="font-bold text-slate-900">
                {Math.min(startIndex + pageSize, filteredJobs.length)}
              </span>{' '}
              de <span className="font-bold text-slate-900">{filteredJobs.length}</span> vacantes
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

      {/* Delete Confirmation Modal */}
      <AEConfirmModal
        isOpen={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="¿Eliminar esta publicación como superadmin?"
        description="Esta acción removerá la vacante de la plataforma de forma definitiva. Ningún candidato podrá verla ni postularse."
        confirmText="Sí, eliminar vacante"
        cancelText="Cancelar"
        itemDetails={
          jobToDelete
            ? {
                title: jobToDelete.title,
                subtitle: `${jobToDelete.company} • ${jobToDelete.cityName}, ${jobToDelete.provinceName}`,
                badge: jobToDelete.sourceType,
              }
            : undefined
        }
      />

      {/* AI Modal */}
      <AIJobGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onJobPublished={loadJobs}
      />
    </div>
  );
}
