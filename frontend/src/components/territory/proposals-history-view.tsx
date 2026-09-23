'use client';

import React, { useState } from 'react';
import { CommercialProposal } from '@/types/territory';
import {
  FileText,
  Clock,
  DollarSign,
  Copy,
  Check,
  Printer,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Search,
  Building,
} from 'lucide-react';

interface ProposalsHistoryViewProps {
  proposals: CommercialProposal[];
  onOpenNewProposal: () => void;
}

export function ProposalsHistoryView({
  proposals,
  onOpenNewProposal,
}: ProposalsHistoryViewProps) {
  const [selectedProposal, setSelectedProposal] = useState<CommercialProposal | null>(
    proposals.length > 0 ? proposals[0] : null,
  );
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = proposals.filter(
    (p) =>
      p.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.leadCategory.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[calc(100vh-210px)] min-h-[500px]">
      {/* Left List (5 Cols) */}
      <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Historial de Propuestas RIS3
              </h2>
              <p className="text-xs text-slate-500">
                {proposals.length} propuestas registradas
              </p>
            </div>
            <button
              onClick={onOpenNewProposal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Nueva Propuesta</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay propuestas registradas aún.
            </div>
          ) : (
            filtered.map((prop) => {
              const isSelected = selectedProposal?.id === prop.id;
              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {prop.leadName}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      {prop.leadCategory}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate mb-2">
                    {prop.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(prop.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold text-emerald-600">
                      {prop.estimatedBudgetRange}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail (8 Cols) */}
      <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        {selectedProposal ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedProposal.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedProposal.leadName}</span> ({selectedProposal.leadCategory})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedProposal.fullMarkdownProposal)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-2 uppercase tracking-wider">
                  Resumen Ejecutivo
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedProposal.executiveSummary}
                </p>
              </div>

              {/* Solutions Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                  Soluciones & Alcance Estratégico
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedProposal.proposedSolutions.map((sol, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="font-bold text-xs text-blue-600 dark:text-blue-400">
                        {sol.name}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {sol.description}
                      </p>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Impacto: {sol.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Plazo Estimado</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedProposal.estimatedTimeline}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">Rango de Inversión</div>
                  <div className="text-xs font-bold text-emerald-600">{selectedProposal.estimatedBudgetRange}</div>
                </div>
              </div>

              {/* Full markdown */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Documento Completo
                </h4>
                <pre className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedProposal.fullMarkdownProposal}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-xs">Selecciona una propuesta del listado para ver su detalle.</p>
          </div>
        )}
      </div>
    </div>
  );
}
