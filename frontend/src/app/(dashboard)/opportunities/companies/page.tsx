'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Globe,
  Search,
  ExternalLink,
  Code2,
  Users,
  Layers,
  ChevronRight,
  RefreshCw,
  Mail,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company } from '@/types';

export default function CompaniesDirectoryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'contacts' | 'gap'>('overview');

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await api.opportunity.getCompanies();
        if (Array.isArray(res)) setCompanies(res);
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Companies Directory</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Directorio centralizado de empresas analizadas, tecnologías y brechas digitales.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o dominio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Layout Grid: List + Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies List */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 lg:col-span-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block px-2">
            Empresas ({filtered.length})
          </span>

          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">Cargando empresas...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">No hay empresas registradas aún.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => setSelectedCompany(comp)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedCompany?.id === comp.id
                      ? 'bg-blue-500/10 border-blue-500/40'
                      : 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-200">{comp.name}</h4>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-xs text-blue-400 block mt-0.5">{comp.domain}</span>
                  {comp.technologies && comp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {comp.technologies.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Detail View */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 lg:col-span-2 space-y-6">
          {selectedCompany ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-zinc-100">{selectedCompany.name}</h3>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>{selectedCompany.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{selectedCompany.description || 'Sin descripción'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/opportunities/clients`}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-analizar</span>
                  </a>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'tech', label: 'Tecnologías' },
                  { id: 'contacts', label: 'Contactos & Canales' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-xs text-zinc-500">Dominio Normalizado</span>
                      <p className="text-sm font-medium text-zinc-200 mt-0.5">{selectedCompany.domain}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-xs text-zinc-500">Página de Empleo</span>
                      <p className="text-sm font-medium text-zinc-200 mt-0.5">
                        {selectedCompany.careersUrl ? (
                          <a href={selectedCompany.careersUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                            Detectada
                          </a>
                        ) : (
                          'Not detected'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tech' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Stack y Frameworks Detectados
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.technologies && selectedCompany.technologies.length > 0 ? (
                      selectedCompany.technologies.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Code2 className="w-3.5 h-3.5 text-blue-400" />
                          {t}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500">No se detectaron tecnologías específicas en la superficie pública.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Métodos y Redes de Contacto
                  </span>
                  {selectedCompany.socialLinks && Object.keys(selectedCompany.socialLinks).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedCompany.socialLinks).map(([network, link]) => (
                        <a
                          key={network}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <span className="capitalize">{network}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No se encontraron redes sociales asociadas.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-zinc-500 text-xs">
              Selecciona una empresa del directorio para ver su ficha completa, tecnologías y análisis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
