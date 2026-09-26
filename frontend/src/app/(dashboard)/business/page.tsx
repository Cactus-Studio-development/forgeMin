'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Sparkles,
  Zap,
  Layers,
  FileText,
  Globe,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { BusinessProfile, BusinessOpportunity } from '@/types';
import { api } from '@/lib/api';
import { BusinessInfoCard } from '@/components/business/business-info-card';
import { BusinessDiagnostic } from '@/components/business/business-diagnostic';
import { BusinessAssistant } from '@/components/business/business-assistant';
import { BusinessContentGenerator } from '@/components/business/business-content-generator';
import { BusinessVoiceTranslation } from '@/components/business/business-voice-translation';

export default function BusinessBoostPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'info';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [opportunities, setOpportunities] = useState<BusinessOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [assistantQuery, setAssistantQuery] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, oppsRes] = await Promise.all([
          api.businessBoost.getProfile().catch(() => null),
          api.businessBoost.getOpportunities().catch(() => []),
        ]);
        if (profRes) setProfile(profRes);
        if (Array.isArray(oppsRes)) setOpportunities(oppsRes);
      } catch (err) {
        console.error('Error loading business boost data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleConsultOpportunity = (opp: BusinessOpportunity) => {
    setAssistantQuery(
      `Oportunidad detectada: "${opp.title}". ${opp.description}. Motivo: ${opp.reason}. Acción sugerida: ${opp.suggestedAction}. ¿Cómo me recomendás ejecutar esta mejora en mi negocio paso a paso?`
    );
    setActiveTab('assistant');
  };

  const handleSendContentToAssistant = (content: string) => {
    setAssistantQuery(
      `Ayúdame a perfeccionar y crear variaciones para esta pieza comercial de mi negocio:\n\n${content}`
    );
    setActiveTab('assistant');
  };

  const tabs = [
    {
      id: 'info',
      label: 'Información del Negocio',
      icon: Building2,
      badge: profile?.productsOrServices?.length ? `${profile.productsOrServices.length} items` : undefined,
    },
    {
      id: 'diagnostic',
      label: 'Diagnóstico',
      icon: Zap,
      badge: opportunities.length ? `${opportunities.length}` : undefined,
    },
    {
      id: 'assistant',
      label: 'Asistente RIS3',
      icon: Sparkles,
      badge: 'IA',
    },
    {
      id: 'content',
      label: 'Generación de Contenido',
      icon: FileText,
    },
    {
      id: 'translation',
      label: 'Traducción & Conversación',
      icon: Globe,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw size={32} className="animate-spin text-emerald-400" />
        <p className="text-sm font-semibold text-zinc-400">
          Cargando entorno de Potenciar mi negocio...
        </p>
      </div>
    );
  }

  const currentProfile: BusinessProfile = profile || {
    id: 'biz-default',
    userId: 'user-default',
    name: 'Mi Negocio RIS3',
    industry: 'Comercio & Servicios',
    location: 'Argentina',
    description: 'Negocio comercial en RIS3',
    productsOrServices: [],
    socialLinks: {},
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
            <Store size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Potenciar mi negocio
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                RIS3 Intelligence
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Administrá tu información comercial, diagnosticá oportunidades y utilizá el Asistente RIS3 para acelerar tus ventas.
            </p>
          </div>
        </div>

        {/* Business Quick Status Card & Conectar a Clientes */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/leads?open_wizard=true"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/50 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>🚀 Conectar a Clientes</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Negocio Activo</span>
              <span className="text-zinc-200 font-semibold">{currentProfile.name || 'Sin nombre'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                active
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
              }`}
            >
              <Icon
                size={16}
                className={
                  active
                    ? tab.id === 'assistant'
                      ? 'text-emerald-400'
                      : tab.id === 'diagnostic'
                      ? 'text-amber-400'
                      : tab.id === 'content'
                      ? 'text-violet-400'
                      : tab.id === 'translation'
                      ? 'text-blue-400'
                      : 'text-emerald-400'
                    : 'text-zinc-500'
                }
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                    active ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content View */}
      <div>
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessInfoCard
                profile={currentProfile}
                onProfileUpdated={(updated) => setProfile(updated)}
                onNavigateToDiagnostic={() => setActiveTab('diagnostic')}
                onNavigateToAssistant={() => setActiveTab('assistant')}
              />
            </motion.div>
          )}

          {activeTab === 'diagnostic' && (
            <motion.div
              key="diagnostic"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessDiagnostic
                opportunities={opportunities}
                onOpportunitiesUpdated={(updated) => setOpportunities(updated)}
                onConsultOpportunity={handleConsultOpportunity}
              />
            </motion.div>
          )}

          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessAssistant
                profile={currentProfile}
                opportunities={opportunities}
                initialQuery={assistantQuery}
                onOpenContentGenerator={() => setActiveTab('content')}
                onOpenDiagnostic={() => setActiveTab('diagnostic')}
                onOpenTranslation={() => setActiveTab('translation')}
              />
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessContentGenerator
                profile={currentProfile}
                onSendToAssistant={handleSendContentToAssistant}
              />
            </motion.div>
          )}

          {activeTab === 'translation' && (
            <motion.div
              key="translation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BusinessVoiceTranslation profile={currentProfile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
