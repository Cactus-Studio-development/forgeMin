'use client';

import React, { useEffect, useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { JobCard } from '@/components/argentina-empleos/jobs/job-card';
import { JobFilterBar } from '@/components/argentina-empleos/jobs/job-filter-bar';
import { CategorizedFeed, AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { Search, Briefcase } from 'lucide-react';
import { AEJobFeedSkeleton } from '@/components/argentina-empleos/ui/ae-skeleton';

export default function ArgentinaEmpleosTrabajosPage() {
  const { user } = useAEAuth();
  const [feed, setFeed] = useState<CategorizedFeed | null>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    query: '',
    provinceId: '',
    cityId: '',
    modality: '',
    categoryId: '',
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await aeApi.jobs.getFeed({
        ...filters,
        userProvinceId: user?.provinceId || 'misiones',
        userCityId: user?.cityId || 'posadas',
        userId: user?.id,
      });
      setFeed(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [filters, user?.provinceId, user?.cityId, user?.id, user?.gender]);

  return (
    <AEShell>
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-[#106EBE]" />
            Explorador de Oportunidades Laborales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filtrá entre miles de vacantes por provincia, ciudad, modalidad presencial/remota y especialidad.
          </p>
        </div>

        <JobFilterBar
          filters={filters}
          onChange={(up) => setFilters((prev) => ({ ...prev, ...up }))}
          onReset={() =>
            setFilters({
              query: '',
              provinceId: '',
              cityId: '',
              modality: '',
              categoryId: '',
            })
          }
        />

        {loading ? (
          <AEJobFeedSkeleton count={4} />
        ) : !feed || feed.allRanked.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center space-y-2">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No se encontraron oportunidades con los criterios seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-600 flex justify-between items-center px-1">
              <span>{feed.allRanked.length} vacantes encontradas</span>
            </div>
            {feed.allRanked.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                userProvinceId={user?.provinceId}
                userCityId={user?.cityId}
              />
            ))}
          </div>
        )}
      </div>
    </AEShell>
  );
}
