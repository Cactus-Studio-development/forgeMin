'use client';

import React, { useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  DEFAULT_JOB_CATEGORIES,
} from '@/lib/argentina-empleos/geo-data';
import { Bot, Loader2, Check, X, Building, MapPin } from 'lucide-react';

interface AIJobGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobPublished: () => void;
}

export function AIJobGeneratorModal({
  isOpen,
  onClose,
  onJobPublished,
}: AIJobGeneratorModalProps) {
  const { user } = useAEAuth();
  const [prompt, setPrompt] = useState(
    'Crear una oportunidad para desarrollador frontend React en Posadas, Misiones con modalidad híbrida',
  );
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!user || !prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const draft = await aeApi.admin.generateAIJob(user.id, prompt);
      setGeneratedDraft(draft);
    } catch (err: any) {
      setError(err.message || 'Error al generar la vacante con IA.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !generatedDraft) return;
    setPublishing(true);
    setError(null);

    try {
      await aeApi.admin.publishAIJob(user.id, {
        ...generatedDraft,
        sourceType: 'AI_GENERATED',
      });
      onJobPublished();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al publicar la vacante generada.');
    } finally {
      setPublishing(false);
    }
  };

  const updateDraft = (key: string, val: any) => {
    setGeneratedDraft((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-[#0F1D38] p-4 text-white flex items-center justify-between border-b border-[#1E335A]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-indigo-500/20 text-[#0FFCBE]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Generador de Publicaciones con IA (Gemini)
              </h3>
              <p className="text-[11px] text-slate-300">
                Superadmin Engine • Generación automática de oportunidades estructuradas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
              {error}
            </div>
          )}

          {/* Prompt Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instrucción para la IA
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ej: Vacante para analista contable senior en Córdoba Capital..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-[#0FFCBE]" />
                    <span>Generar con IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Draft Review Form */}
          {generatedDraft && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase text-slate-700">
                  Revisión y Edición de la Oferta Generada
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                  sourceType: AI_GENERATED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-0.5">Título del Puesto</label>
                  <input
                    type="text"
                    value={generatedDraft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Empresa</label>
                  <input
                    type="text"
                    value={generatedDraft.company}
                    onChange={(e) => updateDraft('company', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Modalidad</label>
                  <select
                    value={generatedDraft.modality}
                    onChange={(e) => updateDraft('modality', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Remoto">Remoto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Provincia</label>
                  <input
                    type="text"
                    value={generatedDraft.provinceName}
                    onChange={(e) => updateDraft('provinceName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Ciudad</label>
                  <input
                    type="text"
                    value={generatedDraft.cityName}
                    onChange={(e) => updateDraft('cityName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-0.5">Descripción</label>
                  <textarea
                    rows={3}
                    value={generatedDraft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Salario Estimado</label>
                  <input
                    type="text"
                    value={generatedDraft.salary}
                    onChange={(e) => updateDraft('salary', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5">Contacto</label>
                  <input
                    type="text"
                    value={generatedDraft.contactInfo}
                    onChange={(e) => updateDraft('contactInfo', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-sm transition-colors"
          >
            Cerrar
          </button>
          {generatedDraft && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publicando...' : 'Aprobar y Publicar Oportunidad'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
