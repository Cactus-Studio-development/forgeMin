'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AIJobGeneratorModal } from '@/components/argentina-empleos/admin/ai-job-generator-modal';
import { AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Briefcase,
  Bot,
  MapPin,
  Building,
  Trash2,
  ExternalLink,
  EyeOff,
  PlusCircle,
  Loader2,
} from 'lucide-react';

export default function AdminTrabajosPage() {
  const { user } = useAEAuth();
  const [jobs, setJobs] = useState<AEJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);

  const loadJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.admin.listAllJobs(user.id);
      setJobs(data);
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

  const handleDelete = async (jobId: string) => {
    if (!user || !confirm('¿Eliminar esta publicación como superadmin?')) return;
    try {
      await aeApi.jobs.deleteJob(jobId, user.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden space-y-4">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#106EBE]" />
            Moderación y Control de Oportunidades
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisá todas las vacantes publicadas por usuarios, administradores y generadas por IA.
          </p>
        </div>

        <button
          onClick={() => setShowAIModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors shadow-xs"
        >
          <Bot className="w-4 h-4 text-[#0FFCBE]" />
          <span>Generar Vacante IA</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando publicaciones...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Puesto / Empresa</th>
                <th className="py-3 px-4">Ubicación & Modalidad</th>
                <th className="py-3 px-4">Origen (sourceType)</th>
                <th className="py-3 px-4">Publicador</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay vacantes registradas.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
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
                        {job.sourceType}
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
                        href={`/argentinaEmpleos/trabajos/${job.id}`}
                        className="p-1 text-slate-600 hover:text-[#106EBE] inline-block"
                        title="Ver detalle"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(job.id)}
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

      {/* AI Modal */}
      <AIJobGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onJobPublished={loadJobs}
      />
    </div>
  );
}
