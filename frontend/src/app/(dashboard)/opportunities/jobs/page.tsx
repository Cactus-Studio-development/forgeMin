'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  ExternalLink,
  Target,
  Layers,
  Code2,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { OpportunityIcon } from '@/components/ui/opportunity-icon';
import { api } from '@/lib/api';
import { Job, JobAnalysis, Opportunity } from '@/types';

export default function JobModePage() {
  const [jobInput, setJobInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobResult, setJobResult] = useState<{
    job: Job;
    analysis: JobAnalysis;
    opportunity: Opportunity;
  } | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobInput.trim()) return;

    setLoading(true);
    setJobResult(null);
    setApplicationMessage(null);
    setDraftSuccess(false);

    try {
      const res = await api.opportunity.analyzeJob(jobInput.trim());
      if (res && res.job) {
        setJobResult(res);
      }
    } catch (err: any) {
      alert(`Error al analizar la oferta: ${err.message || 'Error de conexión'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!jobResult) return;
    setGeneratingMessage(true);
    try {
      const res = await api.opportunity.generateMessage({
        opportunityId: jobResult.opportunity.id,
        type: 'JOB_APPLICATION',
        language: jobResult.job.language || 'es',
        tone: 'Profesional y persuasivo',
      });
      if (res && res.subject) {
        setApplicationMessage({ subject: res.subject, body: res.body });
      }
    } catch (err: any) {
      alert(`Error al generar mensaje de postulación: ${err.message}`);
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!applicationMessage || !jobResult) return;
    try {
      await api.opportunity.createDraft({
        accessToken: 'oauth-active',
        to: 'recruiting@empresa.com',
        subject: applicationMessage.subject,
        body: applicationMessage.body,
      });
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 5000);
    } catch (err: any) {
      alert(`Error al crear borrador: ${err.message}`);
    }
  };

  const handleCopy = () => {
    if (!applicationMessage) return;
    navigator.clipboard.writeText(`${applicationMessage.subject}\n\n${applicationMessage.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Job Mode — Job Opportunity Analyzer</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Extracción de requisitos, compatibilidad semántica con tu perfil, selección automática de CV y generación de postulación.
            </p>
          </div>
        </div>
      </div>

      {/* Job Input Form */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="https://empresa.com/jobs/senior-developer o pega el texto/requisitos de la vacante"
              value={jobInput}
              onChange={(e) => setJobInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !jobInput.trim()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <OpportunityIcon size={16} className="w-4 h-4 animate-spin" />
                  <span>Analizando oferta...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Result */}
      {jobResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Main Job Info */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-zinc-100">{jobResult.job.title}</h2>
                  <span className="text-sm text-emerald-400 font-medium">{jobResult.job.companyName}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {jobResult.job.applicationMethod || 'Direct Application'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                  <span>📍 {jobResult.job.location || 'Remoto'}</span>
                  <span>💼 {jobResult.job.employmentType || 'Full-time'}</span>
                  <span>💰 {jobResult.job.salary || 'A convenir'}</span>
                  <span>🌐 Idioma: {jobResult.job.language === 'en' ? 'Inglés' : 'Español'}</span>
                </div>
              </div>

              {/* Heuristic Score Badge */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-3xl font-bold text-emerald-400">{jobResult.analysis.heuristicScore}%</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Match Heurístico RAS3</span>
              </div>
            </div>

            {/* Technologies */}
            {jobResult.job.technologies && jobResult.job.technologies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Tecnologías Requeridas
                </span>
                <div className="flex flex-wrap gap-2">
                  {jobResult.job.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Semantic Match Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: 'Skills Match', val: jobResult.analysis.matchSignals.skills },
              { label: 'Experiencia', val: jobResult.analysis.matchSignals.experience },
              { label: 'Idioma', val: jobResult.analysis.matchSignals.language },
              { label: 'Ubicación / Timezone', val: jobResult.analysis.matchSignals.location },
              { label: 'Industria', val: jobResult.analysis.matchSignals.industry },
            ].map((m, i) => (
              <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400">{m.label}</span>
                <span
                  className={`text-sm font-bold block ${
                    m.val === 'High' ? 'text-emerald-400' : m.val === 'Medium' ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  {m.val}
                </span>
              </div>
            ))}
          </div>

          {/* Strong Matches vs Missing Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-semibold text-zinc-100">Strong Matches & Fortalezas</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobResult.analysis.matchedSkills.map((s, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                    ✓ {s}
                  </span>
                ))}
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300 pt-2">
                {jobResult.analysis.strengths.map((str, idx) => (
                  <li key={idx}>• {str}</li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-semibold text-zinc-100">Missing / Weaker Areas & Precauciones</h3>
              </div>
              {jobResult.analysis.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobResult.analysis.missingSkills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
                      ⚠ {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No se detectaron brechas críticas en las tecnologías requeridas.</p>
              )}
              <ul className="space-y-1.5 text-xs text-zinc-400 pt-2">
                {jobResult.analysis.concerns.map((c, idx) => (
                  <li key={idx}>• {c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Multi-CV Selection & Message Generation */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-base font-semibold text-zinc-100">CV Recomendado y Mensaje de Postulación</h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  CV Seleccionado automáticamente por IA: <span className="text-zinc-200 font-medium">{jobResult.analysis.recommendedCvName || 'CV Principal'}</span>
                </p>
              </div>

              <button
                onClick={handleGenerateMessage}
                disabled={generatingMessage}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap"
              >
                <OpportunityIcon size={16} className="w-4 h-4" />
                <span>{generatingMessage ? 'Redactando postulación...' : 'Generate Application Message'}</span>
              </button>
            </div>

            {applicationMessage && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Asunto:</span>
                  <p className="text-sm font-medium text-zinc-200">{applicationMessage.subject}</p>
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block pt-2">Cuerpo del Mensaje:</span>
                  <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {applicationMessage.body}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado al portapapeles' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={handleCreateDraft}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Crear Borrador en Gmail</span>
                  </button>
                </div>

                {draftSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Borrador creado en Gmail exitosamente con el CV seleccionado.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
