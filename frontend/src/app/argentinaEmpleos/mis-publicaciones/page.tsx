'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Trash2,
  ExternalLink,
  Loader2,
  EyeOff,
} from 'lucide-react';

export default function MisPublicacionesPage() {
  const { user } = useAEAuth();
  const [jobs, setJobs] = useState<AEJob[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.jobs.getMyJobs(user.id);
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyJobs();
    }
  }, [user]);

  const handleDelete = async (jobId: string) => {
    if (!user || !confirm('¿Estás seguro de eliminar esta publicación?')) return;
    try {
      await aeApi.jobs.deleteJob(jobId, user.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AEShell>
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#106EBE]" />
              Mis Publicaciones
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá las ofertas de empleo creadas por tu cuenta.
            </p>
          </div>
          <Link
            href="/argentinaEmpleos/publicar"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Vacante</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando tus publicaciones...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center space-y-3 shadow-2xs">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Aún no creaste ninguna publicación de empleo
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Publicá tu primera oportunidad laboral para recibir candidatos en tu región.
            </p>
            <Link
              href="/argentinaEmpleos/publicar"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] text-white text-xs font-bold rounded-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar ahora</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{job.title}</span>
                    <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {job.modality}
                    </span>
                    {job.isAnonymous && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 text-[10px]">
                        <EyeOff className="w-3 h-3" />
                        Anónima
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.cityName}, {job.provinceName}</span>
                    <span>•</span>
                    <span>{job.categoryName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/argentinaEmpleos/trabajos/${job.id}`}
                    className="p-2 text-slate-600 hover:text-[#106EBE] hover:bg-slate-100 rounded-sm transition-colors"
                    title="Ver vacante"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                    title="Eliminar vacante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AEShell>
  );
}
