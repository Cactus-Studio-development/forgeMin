'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  Send,
  UserCheck,
  ChevronRight,
  Layers,
  Code2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { OpportunityIcon } from '@/components/ui/opportunity-icon';
import { api } from '@/lib/api';
import { Company, CompanyAnalysis, Contact, Opportunity } from '@/types';

export default function ClientModePage() {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    company: Company;
    analysis: CompanyAnalysis;
    contacts: Contact[];
    opportunities: Opportunity[];
  } | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setAnalysisResult(null);
    setProposalMessage(null);
    setSelectedOpp(null);
    setDraftSuccess(false);

    try {
      const res = await api.opportunity.analyzeCompany(urlInput.trim());
      if (res && res.company) {
        setAnalysisResult(res);
        if (res.opportunities && res.opportunities.length > 0) {
          setSelectedOpp(res.opportunities[0]);
        }
      }
    } catch (err: any) {
      alert(`Error al analizar la empresa: ${err.message || 'Error de conexión'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposal = async (opp: Opportunity) => {
    setGeneratingProposal(true);
    try {
      const contactId = analysisResult?.contacts?.[0]?.id;
      const res = await api.opportunity.generateMessage({
        opportunityId: opp.id,
        contactId,
        type: 'PROPOSAL',
        language: 'es',
        tone: 'Profesional y consultivo',
      });
      if (res && res.subject) {
        setProposalMessage({ subject: res.subject, body: res.body });
      }
    } catch (err: any) {
      alert(`Error al generar la propuesta: ${err.message}`);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!proposalMessage) return;
    const recipient = analysisResult?.contacts?.[0]?.email || 'contacto@empresa.com';
    try {
      await api.opportunity.createDraft({
        accessToken: 'oauth-active',
        to: recipient,
        subject: proposalMessage.subject,
        body: proposalMessage.body,
      });
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 5000);
    } catch (err: any) {
      alert(`Error al crear borrador: ${err.message}`);
    }
  };

  const handleCopy = () => {
    if (!proposalMessage) return;
    navigator.clipboard.writeText(`${proposalMessage.subject}\n\n${proposalMessage.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Client Mode — Company Analyzer</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Inspección web, detección de brecha digital (Digital Gap) y generación de propuestas B2B basadas en evidencia.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="https://empresa.com o dominio de la empresa"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-950/80 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <>
                <OpportunityIcon size={16} className="w-4 h-4 animate-spin" />
                <span>Rastreando y analizando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Company</span>
              </>
            )}
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-zinc-500">
          <span className="text-zinc-400">Ejemplos:</span>
          {['https://stripe.com', 'https://vercel.com', 'https://shopify.com'].map((demo) => (
            <button
              key={demo}
              type="button"
              onClick={() => setUrlInput(demo)}
              className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 transition-colors"
            >
              {demo}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Company Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-zinc-100">{analysisResult.company.name}</h2>
                  <a
                    href={analysisResult.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>{analysisResult.company.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Confianza: {analysisResult.analysis.confidence}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-2 max-w-3xl">
                  {analysisResult.company.description || 'Sin descripción meta disponible.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  Modelo: {analysisResult.analysis.aiProvider}
                </span>
              </div>
            </div>

            {/* Technologies detected */}
            {analysisResult.company.technologies && analysisResult.company.technologies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Tecnologías Detectadas en el Sitio
                </span>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.company.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Code2 className="w-3 h-3 text-amber-400" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Digital Gap Analysis Cards */}
          <div>
            <h3 className="text-base font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Digital Gap Analysis (Presencia Digital)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Website / Frontend', score: analysisResult.analysis.digitalPresence.websiteScore || 'Strong' },
                { label: 'Automatización', score: analysisResult.analysis.digitalPresence.automationScore || 'Medium' },
                { label: 'Integración de IA', score: analysisResult.analysis.digitalPresence.aiIntegrationScore || 'Not detected' },
                { label: 'Experiencia Digital', score: analysisResult.analysis.digitalPresence.customerExperienceScore || 'Medium' },
                { label: 'Captación de Leads', score: analysisResult.analysis.digitalPresence.leadGenerationScore || 'Medium' },
              ].map((gap, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                  <span className="text-xs text-zinc-400 block">{gap.label}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        gap.score === 'Strong'
                          ? 'text-emerald-400'
                          : gap.score === 'Medium'
                          ? 'text-amber-400'
                          : gap.score === 'Low'
                          ? 'text-red-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {gap.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facts vs Hypotheses Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Observed Facts */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-semibold text-zinc-100">Observed Facts (Hechos Verificados)</h3>
              </div>
              <ul className="space-y-2 text-sm text-zinc-300">
                {analysisResult.analysis.observedSignals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Possible Opportunities */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <OpportunityIcon size={20} className="w-5 h-5" />
                <h3 className="text-base font-semibold text-zinc-100">Possible Opportunities (Hipótesis)</h3>
              </div>
              <div className="space-y-3">
                {analysisResult.analysis.possibleOpportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const matchedOpp = analysisResult.opportunities.find((o) => o.title === opp.title);
                      if (matchedOpp) setSelectedOpp(matchedOpp);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedOpp?.title === opp.title
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-200">{opp.title}</h4>
                      <span className="text-xs text-amber-400 font-medium">{opp.confidence}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{opp.description}</p>
                    <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                      <span>Solución sugerida:</span>
                      <span className="text-zinc-300">{opp.possibleSolution}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Proposal / Pitch */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-base font-semibold text-zinc-100">Propuesta Personalizada Basada en Evidencia</h3>
                </div>
                {selectedOpp && (
                  <button
                    onClick={() => handleGenerateProposal(selectedOpp)}
                    disabled={generatingProposal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
                  >
                    <OpportunityIcon size={14} className="w-3.5 h-3.5" />
                    <span>{generatingProposal ? 'Generando propuesta...' : 'Generate Proposal'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contacts Found & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contacts list */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <UserCheck className="w-5 h-5" />
                  <h3 className="text-base font-semibold text-zinc-100">Contactos Públicos</h3>
                </div>
                <span className="text-xs text-zinc-400">{analysisResult.contacts.length} encontrados</span>
              </div>

              {analysisResult.contacts.length === 0 ? (
                <p className="text-xs text-zinc-500">No se detectaron correos públicos explícitos en la página principal.</p>
              ) : (
                <div className="space-y-2">
                  {analysisResult.contacts.map((contact) => (
                    <div key={contact.id} className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-200">{contact.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-blue-300 border border-blue-500/20">
                          {!contact.type || contact.type.toUpperCase() === 'UNKNOWN' ? 'GENERAL' : contact.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{contact.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposal & Outreach Generator */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-base font-semibold text-zinc-100">Propuesta Personalizada Basada en Evidencia</h3>
                </div>
                {selectedOpp && (
                  <button
                    onClick={() => handleGenerateProposal(selectedOpp)}
                    disabled={generatingProposal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 transition-all"
                  >
                    <OpportunityIcon size={14} className="w-3.5 h-3.5" />
                    <span>{generatingProposal ? 'Generando propuesta...' : 'Generate Proposal'}</span>
                  </button>
                )}
              </div>

              {proposalMessage ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Asunto:</span>
                    <p className="text-sm font-medium text-zinc-200">{proposalMessage.subject}</p>
                    <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block pt-2">Cuerpo del Mensaje:</span>
                    <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {proposalMessage.body}
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
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Crear Borrador en Gmail</span>
                    </button>
                  </div>

                  {draftSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Borrador creado exitosamente en Gmail. Recuerda revisarlo antes de confirmar el envío.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Selecciona una oportunidad de la lista y haz clic en &quot;Generate Proposal&quot; para crear una propuesta personalizada con IA basada en las evidencias detectadas.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
