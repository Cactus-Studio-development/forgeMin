'use client';

import React, { useState, useEffect } from 'react';
import { AEUser, AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import {
  X,
  Send,
  Briefcase,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCandidate: AEUser | null;
}

export function InviteCandidateModal({
  isOpen,
  onClose,
  targetCandidate,
}: InviteCandidateModalProps) {
  const { user: currentAdmin } = useAEAuth();
  const [jobs, setJobs] = useState<AEJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentAdmin) {
      setLoadingJobs(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      aeApi.jobs
        .getFeed({})
        .then((feed) => {
          const list = feed.allRanked || [];
          setJobs(list);
          if (list.length > 0) {
            setSelectedJobId(list[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg('Error al cargar la lista de vacantes activas');
        })
        .finally(() => setLoadingJobs(false));
    }
  }, [isOpen, currentAdmin]);

  if (!isOpen || !targetCandidate) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !selectedJobId) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await aeApi.jobs.inviteCandidate(currentAdmin.id, {
        jobId: selectedJobId,
        candidateId: targetCandidate.id,
        customMessage: customMessage.trim() || undefined,
      });

      setSuccessMsg(res.message || 'Invitación enviada exitosamente.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setCustomMessage('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al enviar la invitación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#106EBE]" />
            <h3 className="text-sm font-bold text-slate-900">
              Invitar a Postularse (Headhunting)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Candidate Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Candidato seleccionado:</span>
            <span className="font-bold text-slate-800">{targetCandidate.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Perfil / Titular:</span>
            <span className="text-slate-700">{targetCandidate.headline || 'Sin titular especificado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ubicación:</span>
            <span className="text-slate-700">
              {targetCandidate.cityName || 'Posadas'}, {targetCandidate.provinceName || 'Misiones'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Seleccionar Vacante para la Invitación *
            </label>
            {loadingJobs ? (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-sm flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#106EBE]" />
                <span>Cargando vacantes activas...</span>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-slate-400 text-xs italic">
                No hay vacantes activas disponibles en este momento.
              </p>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company} ({j.modality})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nota Personalizada / Mensaje Directo (Opcional)
            </label>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ej: Hola, revisamos tu perfil y creemos que tu experiencia encaja perfecto con lo que busca la empresa..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedJobId || loadingJobs}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando invitación...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Invitación Directa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
