'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TerritoryMapView } from '@/components/territory/territory-map-view';
import { LeadDirectoryPanel } from '@/components/territory/lead-directory-panel';
import { AIProposalModal } from '@/components/territory/ai-proposal-modal';
import { ProposalsHistoryView } from '@/components/territory/proposals-history-view';
import { TerritoryLead, BusinessCategory, CommercialProposal } from '@/types/territory';
import {
  MapPin,
  Sparkles,
  FileText,
  Layers,
  Compass,
  Building2,
  RefreshCw,
  Search,
  CheckCircle,
} from 'lucide-react';

import { api } from '@/lib/api';

export default function TerritoryMapPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'map' | 'proposals'>('map');

  // Map state (Defaults to Buenos Aires central coordinates)
  const [center, setCenter] = useState({ lat: -34.6037, lng: -58.3816 });
  const [radiusMeters, setRadiusMeters] = useState(3000);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('all');
  const [leads, setLeads] = useState<TerritoryLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<TerritoryLead | null>(null);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTargetLead, setProposalTargetLead] = useState<TerritoryLead | null>(null);
  const [savedProposals, setSavedProposals] = useState<CommercialProposal[]>([]);

  // Fetch leads from backend
  const fetchZoneLeads = useCallback(async (c = center, r = radiusMeters, cat = selectedCategory) => {
    setIsLoading(true);
    try {
      const data = await api.territory.search({
        lat: c.lat,
        lng: c.lng,
        radiusMeters: r,
        category: cat,
      });

      if (data && data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Error fetching zone leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [center, radiusMeters, selectedCategory]);

  // Initial load
  useEffect(() => {
    fetchZoneLeads();
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const data = await api.territory.getProposals();
      if (data && data.success && Array.isArray(data.proposals)) {
        setSavedProposals(data.proposals);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  const handleCenterChange = (newCenter: { lat: number; lng: number }) => {
    setCenter(newCenter);
    fetchZoneLeads(newCenter, radiusMeters, selectedCategory);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusMeters(newRadius);
    fetchZoneLeads(center, newRadius, selectedCategory);
  };

  const handleCategoryChange = (newCat: BusinessCategory) => {
    setSelectedCategory(newCat);
    fetchZoneLeads(center, radiusMeters, newCat);
  };

  const handleOpenProposalForLead = (lead: TerritoryLead) => {
    setProposalTargetLead(lead);
    setIsProposalModalOpen(true);
  };

  const handleOpenStandaloneProposal = () => {
    setProposalTargetLead(null);
    setIsProposalModalOpen(true);
  };

  const handleSaveProposal = (newProp: CommercialProposal) => {
    setSavedProposals((prev) => [newProp, ...prev.filter((p) => p.id !== newProp.id)]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] p-6 space-y-4 max-w-[1600px] mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Inteligencia Territorial & Radar de Negocios RIS3
              </h1>
              <p className="text-xs text-slate-500">
                Búsqueda geoespacial en tiempo real de empresas, farmacias y comercios con generador de propuestas IA
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle & Action */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Radar & Mapa</span>
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'proposals'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Propuestas ({savedProposals.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenStandaloneProposal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <span>Generar Propuesta IA</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[550px]">
          {/* Map Area (8 Cols) */}
          <div className="lg:col-span-8 h-full">
            <TerritoryMapView
              center={center}
              radiusMeters={radiusMeters}
              leads={leads}
              selectedCategory={selectedCategory}
              selectedLeadId={selectedLead?.id || null}
              onSelectLead={(l) => setSelectedLead(l)}
              onCenterChange={handleCenterChange}
              onRadiusChange={handleRadiusChange}
              onCategoryChange={handleCategoryChange}
              onGenerateProposal={handleOpenProposalForLead}
              isLoading={isLoading}
            />
          </div>

          {/* Directory Panel (4 Cols) */}
          <div className="lg:col-span-4 h-full">
            <LeadDirectoryPanel
              leads={leads}
              selectedLeadId={selectedLead?.id || null}
              onSelectLead={(l) => setSelectedLead(l)}
              onGenerateProposal={handleOpenProposalForLead}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <ProposalsHistoryView
          proposals={savedProposals}
          onOpenNewProposal={handleOpenStandaloneProposal}
        />
      )}

      {/* Proposal Modal */}
      <AIProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        targetLead={proposalTargetLead}
        onSaveProposal={handleSaveProposal}
      />
    </div>
  );
}
