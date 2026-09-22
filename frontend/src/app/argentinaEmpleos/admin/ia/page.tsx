'use client';

import React, { useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AIJobGeneratorModal } from '@/components/argentina-empleos/admin/ai-job-generator-modal';
import { Cpu, Bot, Zap, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function AdminIAPage() {
  const { user } = useAEAuth();
  const [showModal, setShowModal] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);

  const predefinedPrompts = [
    'Crear una vacante para Desarrollador Fullstack React y NestJS en Posadas, Misiones (Híbrido)',
    'Crear una oferta para Contador Público / Auditor Financiero en Rosario, Santa Fe (Presencial)',
    'Crear una oportunidad de Diseñador UX/UI Senior Remoto para toda Argentina',
    'Crear una vacante para Ejecutivo Comercial B2B en Córdoba Capital (Jornada Completa)',
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#106EBE]" />
            Generador de Empleo Automatizado con IA (Gemini)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generá publicaciones realistas y estructuradas marcadas con <code>sourceType: AI_GENERATED</code> para poblar categorías y regiones.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors shadow-xs"
        >
          <Bot className="w-4 h-4 text-[#0FFCBE]" />
          <span>Abrir Generador IA</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-sm text-xs text-indigo-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-indigo-900">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>Regla de Publicaciones Demostrativas e IA</span>
        </div>
        <p className="leading-relaxed">
          Las vacantes generadas por este módulo permiten dinamizar el ecosistema laboral en fases de lanzamiento. Las publicaciones son revisadas y aprobadas por el Superadmin antes de su difusión en el feed regional.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Plantillas Rápidas de Generación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {predefinedPrompts.map((p, i) => (
            <div
              key={i}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between gap-3 hover:border-[#106EBE] transition-colors"
            >
              <span className="text-slate-800 font-medium">{p}</span>
              <button
                onClick={() => setShowModal(true)}
                className="px-2.5 py-1 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-[11px] rounded-xs shrink-0"
              >
                Generar
              </button>
            </div>
          ))}
        </div>
      </div>

      <AIJobGeneratorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onJobPublished={() => setPublishedCount((prev) => prev + 1)}
      />
    </div>
  );
}
