'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { AEJob } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  Building,
  MapPin,
  Briefcase,
  Clock,
  Banknote,
  GraduationCap,
  Bot,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Mail,
  EyeOff,
  Loader2,
  ShieldCheck,
  Lock,
  FileText,
  Sparkles,
} from 'lucide-react';

const QUICK_RESPONSES = [
  'Me interesa la vacante y cuento con la experiencia requerida.',
  'Estoy interesado/a en la posición. Me gustaría coordinar una entrevista.',
  'Cuento con disponibilidad inmediata para sumarme al equipo.',
  'Me interesa mucho la propuesta. ¿Podrían contarme más detalles del proyecto?',
];

export default function JobDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isSuperadmin } = useAEAuth();
  const rawId = (params?.id as string) || searchParams?.get('id') || '';
  const jobId = rawId === 'inicio' && searchParams?.get('id') ? searchParams.get('id')! : rawId;

  const [job, setJob] = useState<AEJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [customMessage, setCustomMessage] = useState(QUICK_RESPONSES[0]);
  const [phone, setPhone] = useState(user?.phone || '');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleAcceptTerms = async () => {
    if (!user || !job) return;
    setAcceptingTerms(true);
    try {
      const updatedJob = await aeApi.jobs.acceptTerms(job.id, user.id);
      setJob(updatedJob);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al aceptar los términos.');
    } finally {
      setAcceptingTerms(false);
    }
  };

  const handleSendApplication = async () => {
    if (!user || !job) return;
    if (!phone.trim()) {
      setApplyError('El número de contacto telefónico o WhatsApp es un requisito obligatorio.');
      return;
    }
    setSubmittingApply(true);
    setApplyError(null);

    try {
      await aeApi.jobs.apply(job.id, user.id, customMessage, phone.trim());
      setApplied(true);
      setShowApplyModal(false);
    } catch (err: any) {
      console.error(err);
      setApplyError(err.message || 'Error al enviar la postulación.');
    } finally {
      setSubmittingApply(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      aeApi.jobs
        .getJob(jobId, user?.id)
        .then((data) => setJob(data))
        .catch((err) => {
          console.error(err);
          setError('No se pudo encontrar la vacante solicitada.');
        })
        .finally(() => setLoading(false));
    }
  }, [jobId, user?.id]);

  if (loading) {
    return (
      <AEShell>
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Cargando detalles de la vacante...</p>
        </div>
      </AEShell>
    );
  }

  if (error || !job) {
    return (
      <AEShell>
        <div className="bg-white border border-slate-200 rounded-sm p-8 text-center space-y-3">
          <p className="text-xs text-red-600 font-bold">{error || 'Vacante no disponible'}</p>
          <Link
            href="/argentinaEmpleos/trabajos"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#106EBE]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al explorador de empleos</span>
          </Link>
        </div>
      </AEShell>
    );
  }

  const hasAcceptedTerms =
    isSuperadmin ||
    job?.creatorId === user?.id ||
    (job?.acceptedTermsUserIds && user?.id && job.acceptedTermsUserIds.includes(user.id));
  const requiresTermsAcceptance = Boolean(job?.hasTermsAgreement) && !hasAcceptedTerms;
  const isGenderIneligible = Boolean(job?.isWomenOnly) && !isSuperadmin && user?.gender !== 'Femenino';

  return (
    <AEShell>
      <div className="space-y-4">
        {/* Back navigation */}
        <Link
          href="/argentinaEmpleos/trabajos"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#106EBE] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de oportunidades</span>
        </Link>

        {/* Main Job Detail Card */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-2xs overflow-hidden">
          {/* Header Banner (SAP Royal Blue) */}
          <div className="bg-gradient-to-r from-[#0064D9] to-[#0047A5] p-6 text-white border-b border-blue-600/40">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-sm bg-white/15 text-white border border-white/20 text-[11px] font-bold">
                {job.modality}
              </span>
              <span className="px-2.5 py-0.5 rounded-sm bg-white/10 text-white border border-white/15 text-[11px]">
                {job.categoryName}
              </span>
              {job.isVerifiedCompany && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-emerald-500/25 text-emerald-100 border border-emerald-300/40 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Empresa Verificada
                </span>
              )}
              {job.isWomenOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-pink-500/30 text-pink-100 border border-pink-300/50 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-pink-200" />
                  Búsqueda Exclusiva para Mujeres
                </span>
              )}
              {job.isPrivate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-purple-500/25 text-purple-100 border border-purple-300/40 text-[11px] font-bold">
                  <Lock className="w-3 h-3 text-purple-300" />
                  Publicación Privada
                </span>
              )}
              {job.hasTermsAgreement && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-amber-500/25 text-amber-100 border border-amber-300/40 text-[11px] font-bold">
                  <FileText className="w-3 h-3 text-amber-300" />
                  Acuerdo de Confidencialidad
                </span>
              )}
              {job.isAnonymous && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-white/10 text-white border border-white/15 text-[11px]">
                  <EyeOff className="w-3 h-3" />
                  Publicación Anónima
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100 mt-2">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-200" />
                <span className="font-semibold text-white">{job.company || 'Empresa Confidencial'}</span>
                {job.isVerifiedCompany && (
                  <span title="Verificado Oficial">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </span>
                )}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#F59E0B]" />
                <span>{job.cityName ? `${job.cityName}, ${job.provinceName}` : job.provinceName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-200" />
                <span>{job.employmentType}</span>
              </div>
            </div>
          </div>

          {/* Women Only Notice if Ineligible */}
          {job.isWomenOnly && (
            <div className="p-4 bg-pink-50/80 border-b border-pink-200 text-xs text-pink-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
                <span>
                  <strong>Programa de Inclusión Femenina:</strong> Esta vacante fue publicada con criterio de postulación exclusivo para mujeres.
                </span>
              </div>
              {isGenderIneligible && (
                <Link
                  href="/argentinaEmpleos/perfil"
                  className="text-pink-700 underline font-semibold text-[11px] shrink-0 hover:text-pink-900"
                >
                  Actualizar género en perfil
                </Link>
              )}
            </div>
          )}

          {/* Terms Acceptance Card (if required) */}
          {requiresTermsAcceptance && (
            <div className="p-5 bg-amber-50/90 border-b border-amber-200 text-xs text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Aceptación de Términos y Confidencialidad Requerida</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Esta es una publicación especial con términos de reserva. Debes aceptar los términos a continuación para poder acceder al detalle completo de requisitos, condiciones laborales y enviar tu postulación:
              </p>
              <div className="p-3 bg-white border border-amber-200 rounded-sm italic text-slate-700 text-xs">
                &quot;{job.termsText || 'El postulante se compromete a mantener estricta confidencialidad sobre la información del puesto y los procesos de la empresa.'}&quot;
              </div>
              <div className="pt-1">
                {user ? (
                  <button
                    onClick={handleAcceptTerms}
                    disabled={acceptingTerms}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-sm transition-colors text-xs shadow-xs"
                  >
                    {acceptingTerms ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Aceptando términos...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aceptar Términos y Ver Vacante Completa</span>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/argentinaEmpleos/login"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0064D9] hover:bg-[#0057C2] text-white font-bold rounded-sm text-xs"
                  >
                    Iniciar Sesión para Aceptar Términos
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Action Sub-bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>Salario: {job.salary || 'A convenir con la empresa'}</span>
            </div>

            <div className="flex items-center gap-3">
              {applied ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-sm border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Postulación Enviada</span>
                </div>
              ) : requiresTermsAcceptance ? (
                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-sm border border-amber-200">
                  Aceptá los términos para postularte
                </span>
              ) : isGenderIneligible ? (
                <span className="text-xs font-bold text-pink-800 bg-pink-100 px-3 py-1.5 rounded-sm border border-pink-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>Exclusivo para postulantes mujeres</span>
                </span>
              ) : user ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
                >
                  Postularme a esta Oportunidad
                </button>
              ) : (
                <Link
                  href="/argentinaEmpleos/login"
                  className="px-5 py-2 bg-[#0064D9] hover:bg-[#0057C2] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
                >
                  Iniciar Sesión para Postularme
                </Link>
              )}
            </div>
          </div>

          {/* Superadmin Internal Inspection Callout */}
          {isSuperadmin && job.isAnonymous && (
            <div className="m-5 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Vista de Superadmin:</span> Esta oferta fue publicada de forma anónima por el usuario{' '}
                <code>{job.creatorEmail}</code> ({job.creatorName}). Los usuarios estándar únicamente ven &quot;Publicación Anónima&quot;.
              </div>
            </div>
          )}

          {/* Body content */}
          <div className="p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
            {/* Description */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b border-slate-100">
                Descripción de la Posición
              </h2>
              <p className="whitespace-pre-line text-slate-600 text-xs leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b border-slate-100">
                  Requisitos Principales
                </h2>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  {job.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b border-slate-100">
                  Habilidades & Tecnologías Clave
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xs text-slate-700 font-semibold text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Experiencia Requerida</span>
                <span className="font-bold text-slate-800">{job.experienceLevel || 'No especificada'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Nivel Educativo</span>
                <span className="font-bold text-slate-800">{job.educationLevel || 'Secundario / Universitario'}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Jornada Laboral</span>
                <span className="font-bold text-slate-800">{job.workingDay || 'Jornada completa'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal with Personalized Message & Quick Responses */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Postulación para {job.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enviá un mensaje personalizado y tu perfil al creador de la vacante ({job.company}).
              </p>
            </div>

            {applyError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                {applyError}
              </div>
            )}

            {/* Candidate Summary Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Postulante:</span>
                <span className="font-bold text-slate-800">
                  {user?.name || 'Usuario'}
                  {user?.headline ? ` • ${user.headline}` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación del candidato:</span>
                <span className="text-slate-800">{user?.cityName || 'Posadas'}, {user?.provinceName || 'Misiones'}</span>
              </div>
            </div>

            {/* Quick Response Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Respuestas Rápidas Predefinidas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_RESPONSES.map((resp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomMessage(resp)}
                    className={`px-2.5 py-1 text-[11px] rounded-xs font-medium border transition-colors ${
                      customMessage === resp
                        ? 'bg-blue-50 text-[#0064D9] border-[#0064D9] font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {i === 0 && 'Me interesa'}
                    {i === 1 && 'Estoy interesado/a'}
                    {i === 2 && 'Disponibilidad inmediata'}
                    {i === 3 && 'Cuéntame más'}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone / WhatsApp Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Teléfono / WhatsApp de Contacto * (Requisito obligatorio)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +54 9 376 412-3456 o 3764123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                El creador de la vacante utilizará este número para comunicarse directamente vía WhatsApp o llamada.
              </p>
            </div>

            {/* Custom Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensaje personalizado para el reclutador *
              </label>
              <textarea
                rows={3}
                required
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escribí tu mensaje o presentación personalizada..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                disabled={submittingApply}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendApplication}
                disabled={submittingApply || !customMessage.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
              >
                {submittingApply ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando postulación...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enviar Postulación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AEShell>
  );
}
