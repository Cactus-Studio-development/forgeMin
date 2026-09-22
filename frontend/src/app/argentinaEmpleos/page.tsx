'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { JobCard } from '@/components/argentina-empleos/jobs/job-card';
import { JobFilterBar } from '@/components/argentina-empleos/jobs/job-filter-bar';
import { CategorizedFeed, AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  MapPin,
  Search,
  PlusCircle,
  Briefcase,
  Building2,
  TrendingUp,
  Globe,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { AEJobFeedSkeleton } from '@/components/argentina-empleos/ui/ae-skeleton';

export default function ArgentinaEmpleosFeedPage() {
  const { user, wallet, loading: authLoading } = useAEAuth();

  const [feed, setFeed] = useState<CategorizedFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState({
    query: '',
    provinceId: '',
    cityId: '',
    modality: '',
    categoryId: '',
  });

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aeApi.jobs.getFeed({
        ...filters,
        userProvinceId: user?.provinceId || 'misiones',
        userCityId: user?.cityId || 'posadas',
      });
      setFeed(data);
    } catch (err: any) {
      console.error('Error loading feed:', err);
      setError('No se pudo cargar el feed de empleos. Asegurate de que el backend esté en ejecución.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadFeed();
    }
  }, [authLoading, filters, user?.provinceId, user?.cityId]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      provinceId: '',
      cityId: '',
      modality: '',
      categoryId: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.query || filters.provinceId || filters.cityId || filters.modality || filters.categoryId,
  );

  return (
    <AEShell>
      {/* Onboarding Incomplete Alert Banner */}
      {user && !user.onboardingCompleted && (
        <div className="mb-5 p-4 rounded-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-700/50">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Completá tu Onboarding Profesional
              </h4>
              <p className="text-xs text-amber-100 mt-0.5">
                Configurá tu ubicación y carrera para recibir recomendaciones exactas en tu ciudad y provincia.
              </p>
            </div>
          </div>
          <Link
            href="/argentinaEmpleos/registro"
            className="px-4 py-1.5 rounded-sm bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shrink-0"
          >
            Completar Ahora
          </Link>
        </div>
      )}

      {/* Hero Welcome & Quick Stats (SAP Enterprise Style) */}
      <div className="bg-gradient-to-r from-[#0064D9] via-[#0057C2] to-[#0047A5] rounded-sm p-6 sm:p-8 text-white mb-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative accent pill */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span>Plataforma Corporativa de Empleo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bienvenido a su portal de empleo
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              Acceda a vacantes cerca de usted, gestione sus publicaciones, utilice herramientas de IA y consulte su saldo de créditos en un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/argentinaEmpleos/publicar"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-white hover:bg-slate-50 text-[#0064D9] text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
              <span>Publicar Oferta</span>
            </Link>
            <Link
              href="/argentinaEmpleos/trabajos"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-[#0047A5] hover:bg-[#003B8A] text-white border border-white/20 text-xs font-bold transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Explorar Trabajos</span>
            </Link>
          </div>
        </div>
      </div>


      {/* Filter Bar */}
      <JobFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Main Feed Sections */}
      {loading ? (
        <AEJobFeedSkeleton count={4} />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-sm p-8 text-center shadow-2xs">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-700 font-medium mb-3">{error}</p>
          <button
            onClick={loadFeed}
            className="px-4 py-1.5 bg-[#106EBE] text-white text-xs font-bold rounded-sm hover:bg-[#005A9E]"
          >
            Reintentar
          </button>
        </div>
      ) : !feed || feed.allRanked.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center shadow-2xs space-y-3">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            No se encontraron ofertas con los filtros actuales
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Probá quitando algunos filtros o publicá la primera vacante en tu localidad.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#106EBE] text-white text-xs font-bold rounded-sm hover:bg-[#005A9E]"
          >
            Ver todas las ofertas
          </button>
        </div>
      ) : hasActiveFilters ? (
        /* Flat filtered view */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resultados de la Búsqueda ({feed.allRanked.length})
            </h2>
          </div>
          <div className="space-y-3">
            {feed.allRanked.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userProvinceId={user?.provinceId}
                userCityId={user?.cityId}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Geographic 4-Tier Categorized Sections */
        <div className="space-y-8">
          {/* 1. TRABAJOS CERCA DE VOS (Same City) */}
          {feed.nearYou.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Trabajos Cerca de Vos ({user?.cityName || 'Posadas'} • {user?.provinceName || 'Misiones'})
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 ml-auto">
                  {feed.nearYou.length} disponibles
                </span>
              </div>
              <div className="space-y-3">
                {feed.nearYou.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userProvinceId={user?.provinceId}
                    userCityId={user?.cityId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. OTROS TRABAJOS EN TU PROVINCIA (Same Province) */}
          {feed.sameProvince.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-[#106EBE]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Otros Trabajos en tu Provincia ({user?.provinceName || 'Misiones'})
                </h2>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200 ml-auto">
                  {feed.sameProvince.length} disponibles
                </span>
              </div>
              <div className="space-y-3">
                {feed.sameProvince.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userProvinceId={user?.provinceId}
                    userCityId={user?.cityId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. TRABAJOS REMOTOS (National Scope) */}
          {feed.remote.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Globe className="w-4 h-4 text-purple-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Trabajos Remotos (Alcance Nacional)
                </h2>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200 ml-auto">
                  {feed.remote.length} disponibles
                </span>
              </div>
              <div className="space-y-3">
                {feed.remote.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userProvinceId={user?.provinceId}
                    userCityId={user?.cityId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. OTRAS OPORTUNIDADES (Other Provinces in Argentina) */}
          {feed.otherProvinces.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Otras Oportunidades en Argentina
                </h2>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200 ml-auto">
                  {feed.otherProvinces.length} disponibles
                </span>
              </div>
              <div className="space-y-3">
                {feed.otherProvinces.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userProvinceId={user?.provinceId}
                    userCityId={user?.cityId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AEShell>
  );
}
