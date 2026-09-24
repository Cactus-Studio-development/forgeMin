'use client';

import React, { useState } from 'react';
import { TerritoryLead } from '@/types/territory';
import {
  Phone,
  Globe,
  Mail,
  MessageCircle,
  Sparkles,
  ExternalLink,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Building2,
  Search,
  Filter,
} from 'lucide-react';

interface LeadDirectoryPanelProps {
  leads: TerritoryLead[];
  selectedLeadId: string | null;
  onSelectLead: (lead: TerritoryLead) => void;
  onGenerateProposal: (lead: TerritoryLead) => void;
  isLoading: boolean;
}

export function LeadDirectoryPanel({
  leads,
  selectedLeadId,
  onSelectLead,
  onGenerateProposal,
  isLoading,
}: LeadDirectoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.location.address && lead.location.address.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Directorio de la Zona
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {leads.length} comercios y entidades detectadas
            </p>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
            En Tiempo Real
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, rubro o calle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/50 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/50">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="pt-3 first:pt-0 p-3 rounded-xl border border-transparent space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-700/70 rounded-md animate-pulse" />
                    <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-700/50 rounded-md animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-full animate-pulse" />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-md animate-pulse" />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                  <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-md animate-pulse" />
                  <div className="h-7 w-28 bg-blue-100 dark:bg-blue-950/60 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No se encontraron comercios con los filtros actuales.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const isSelected = selectedLeadId === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className={`pt-3 first:pt-0 p-3 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {lead.name}
                      </h3>
                      {lead.rating && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-sm">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {lead.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{lead.location.address || 'Ubicación local'}</span>
                      {lead.distanceMeters !== undefined && (
                        <span className="text-blue-600 font-semibold ml-1 shrink-0">
                          • {lead.distanceMeters >= 1000 ? `${(lead.distanceMeters / 1000).toFixed(1)} km` : `${lead.distanceMeters} m`}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    lead.category === 'pharmacy'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : lead.category === 'health_clinic'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {lead.categoryLabel}
                  </span>
                </div>

                {/* Contact details */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                  {lead.contact.phone && (
                    <a
                      href={`tel:${lead.contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-medium"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{lead.contact.phone}</span>
                    </a>
                  )}

                  {lead.contact.whatsapp && (
                    <a
                      href={`https://wa.me/${lead.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-md font-medium"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-500" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {lead.contact.website && lead.contact.website.startsWith('http') ? (
                    <a
                      href={lead.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-md font-medium"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Web Oficial</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-[10px]">
                      Sin Web
                    </span>
                  )}
                </div>

                {/* Proposal Action Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{lead.openingHours || 'Horario regular'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateProposal(lead);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    Crear Propuesta IA
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
