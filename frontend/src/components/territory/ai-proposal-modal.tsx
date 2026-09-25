'use client';

import React, { useState } from 'react';
import { TerritoryLead, ProposalObjective, CommercialProposal } from '@/types/territory';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Printer,
  FileText,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  Send,
  Building,
  MapPin,
  Save,
} from 'lucide-react';

import { api } from '@/lib/api';

interface AIProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLead?: TerritoryLead | null;
  onSaveProposal?: (proposal: CommercialProposal) => void;
}

export function AIProposalModal({
  isOpen,
  onClose,
  targetLead,
  onSaveProposal,
}: AIProposalModalProps) {
  // Input fields
  const [businessName, setBusinessName] = useState(targetLead?.name || '');
  const [category, setCategory] = useState(targetLead?.categoryLabel || 'Empresa / Comercio');
  const [location, setLocation] = useState(targetLead?.location.address || 'Zona Metropolitana');
  const [phone, setPhone] = useState(targetLead?.contact.phone || '');
  const [email, setEmail] = useState(targetLead?.contact.email || '');
  const [website, setWebsite] = useState(targetLead?.contact.website || '');
  const [objective, setObjective] = useState<ProposalObjective>('digitalization');
  const [customNotes, setCustomNotes] = useState('');
  const [senderOrg, setSenderOrg] = useState('RIS3 Estrategia de Innovación & Transformación Digital');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<CommercialProposal | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'solutions'>('preview');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if lead changes
  React.useEffect(() => {
    if (targetLead) {
      setBusinessName(targetLead.name);
      setCategory(targetLead.categoryLabel);
      setLocation(targetLead.location.address || 'Zona Comercial');
      setPhone(targetLead.contact.phone || '');
      setEmail(targetLead.contact.email || '');
      setWebsite(targetLead.contact.website || '');
    }
  }, [targetLead]);

  if (!isOpen) return null;

  const objectivesList: { id: ProposalObjective; label: string; desc: string }[] = [
    { id: 'digitalization', label: 'Transformación & Canales Digitales', desc: 'Catálogos, WhatsApp Business, e-commerce local y turnos' },
    { id: 'custom_software', label: 'Desarrollo de Software a Medida', desc: 'Sistemas ERP, gestión de stock, inventarios y clientes' },
    { id: 'cloud_and_infrastructure', label: 'Infraestructura Cloud & GCP', desc: 'Migración a la nube, alta disponibilidad y bases de datos' },
    { id: 'supplies_and_logistics', label: 'Optimización de Suministros & Logística', desc: 'Rutas de entrega, control de proveedores y stock' },
    { id: 'strategic_consulting', label: 'Consultoría RIS3 & Crecimiento Regional', desc: 'Planes estratégicos de competitividad e innovación' },
    { id: 'cybersecurity', label: 'Ciberseguridad & Protección de Datos', desc: 'Auditorías, backups automáticos y cumplimiento normativo' },
    { id: 'ai_automation', label: 'Automatización con Agentes de IA', desc: 'Asistentes virtuales 24/7 para atención y ventas' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const data = await api.territory.generateProposal({
        leadId: targetLead?.id,
        leadName: businessName || 'Empresa Prospecto',
        leadCategory: category,
        leadLocation: location,
        leadContact: {
          phone,
          email,
          website,
        },
        objective,
        customNotes,
        senderOrganization: senderOrg,
      });

      if (data && data.success && data.proposal) {
        setGeneratedProposal(data.proposal);
        if (onSaveProposal) onSaveProposal(data.proposal);
      }
    } catch (err) {
      console.error('Error generating proposal:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedProposal) return;
    navigator.clipboard.writeText(generatedProposal.fullMarkdownProposal || generatedProposal.executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Generador de Propuestas Comerciales con IA (Gemini)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Crea propuestas ejecutivas de alto impacto personalizadas por negocio y rubro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Split View */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Form: Parameters (5 Cols) */}
          <div className="md:col-span-5 p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/40">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Empresa o Comercio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ej. Farmacia Central Norte / Distribuidora Austral"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rubro / Categoría
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="ej. Farmacia, Salud"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 ..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Objetivo Estratégico de la Propuesta
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as ProposalObjective)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              >
                {objectivesList.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instrucciones / Enfoque Especial (Opcional)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="ej. Hacer hincapié en la integración con sucursales de turno y catálogo digital nocturno..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Emisor de la Propuesta
              </label>
              <input
                type="text"
                value={senderOrg}
                onChange={(e) => setSenderOrg(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[11px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !businessName}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Redactando Propuesta...</span>
                </>
              ) : (
                <span>Generar Propuesta con IA</span>
              )}
            </button>
          </div>

          {/* Right Area: Proposal Result & Preview (7 Cols) */}
          <div className="md:col-span-7 p-5 flex flex-col h-full bg-white dark:bg-slate-900">
            {generatedProposal ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Result Toolbar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'preview'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Resumen Ejecutivo
                    </button>
                    <button
                      onClick={() => setActiveTab('solutions')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'solutions'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Soluciones & Alcance
                    </button>
                    <button
                      onClick={() => setActiveTab('markdown')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'markdown'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Documento Formal
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      title="Copiar contenido"
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      title="Imprimir / Exportar a PDF"
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-[11px]">PDF / Imprimir</span>
                    </button>
                  </div>
                </div>

                {/* Tab Views */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {activeTab === 'preview' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                          {generatedProposal.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {generatedProposal.executiveSummary}
                        </p>
                      </div>

                      {/* Pain Points */}
                      {generatedProposal.painPointsIdentified.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            Oportunidades & Desafíos Detectados
                          </h4>
                          <div className="space-y-1.5">
                            {generatedProposal.painPointsIdentified.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline and Budget Badges */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Plazo Estimado
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {generatedProposal.estimatedTimeline}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            Inversión Sugerida
                          </div>
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {generatedProposal.estimatedBudgetRange}
                          </div>
                        </div>
                      </div>

                      {/* Call to action */}
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold">Llamado a la acción: </span>
                        {generatedProposal.callToAction}
                      </div>
                    </div>
                  )}

                  {activeTab === 'solutions' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                        Soluciones Tecnológicas Propuestas
                      </h4>
                      {generatedProposal.proposedSolutions.map((sol, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                        >
                          <div className="font-bold text-xs text-blue-600 dark:text-blue-400">
                            {idx + 1}. {sol.name}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {sol.description}
                          </p>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/70 dark:bg-emerald-950/40 p-2 rounded-lg">
                            💡 Impacto: {sol.impact}
                          </div>
                        </div>
                      ))}

                      {generatedProposal.deliverables.length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Entregables Clave
                          </h4>
                          <div className="space-y-1">
                            {generatedProposal.deliverables.map((d, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'markdown' && (
                    <div>
                      <textarea
                        value={generatedProposal.fullMarkdownProposal}
                        onChange={(e) =>
                          setGeneratedProposal({
                            ...generatedProposal,
                            fullMarkdownProposal: e.target.value,
                          })
                        }
                        rows={16}
                        className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400 space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Listo para Redactar la Propuesta
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Configura los parámetros a la izquierda y presiona "Generar Propuesta con IA". Gemini creará una propuesta técnica y económica formal adaptada al perfil del negocio.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
