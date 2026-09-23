'use client';

import React, { useState } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  DEFAULT_JOB_CATEGORIES,
} from '@/lib/argentina-empleos/geo-data';
import {
  Bot,
  Loader2,
  Check,
  CheckCircle2,
  X,
  Building,
  MapPin,
  Mail,
  Layers,
  Sparkles,
  Trash2,
  Edit3,
  Globe,
  Clock,
  DollarSign,
} from 'lucide-react';

interface AIJobGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobPublished: () => void;
}

interface DraftJobItem {
  id: string;
  title: string;
  description: string;
  company: string;
  categoryId: string;
  categoryName: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  modality: 'Presencial' | 'Híbrido' | 'Remoto';
  employmentType: string;
  workingDay: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  educationLevel: string;
  salary: string;
  contactInfo: string;
  isPublished?: boolean;
  publishedJobId?: string;
}

export function AIJobGeneratorModal({
  isOpen,
  onClose,
  onJobPublished,
}: AIJobGeneratorModalProps) {
  const { user } = useAEAuth();
  const [prompt, setPrompt] = useState(
    'Crear 3 ofertas de limpieza, cuidado de hogar y niñera en Posadas, Misiones',
  );
  const [jobCount, setJobCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [draftList, setDraftList] = useState<DraftJobItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('gmail.com');
  const [selectedModality, setSelectedModality] = useState<'Presencial' | 'Híbrido' | 'Remoto'>('Presencial');
  const [successCount, setSuccessCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    setSuccessCount(0);
    onClose();
  };

  const handleGenerate = async () => {
    if (!user || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessCount(0);

    try {
      const rawData = await aeApi.admin.generateAIJob(user.id, prompt, jobCount);
      const list: any[] = Array.isArray(rawData)
        ? rawData
        : rawData?.jobs && Array.isArray(rawData.jobs)
        ? rawData.jobs
        : [rawData];

      const mapped: DraftJobItem[] = list.map((item, idx) => ({
        id: `draft_${Date.now()}_${idx}`,
        title: item.title || 'Nueva Oportunidad',
        description: item.description || '',
        company: item.company || 'Particular',
        categoryId: item.categoryId || 'oficios',
        categoryName: item.categoryName || 'Oficios y Servicios',
        provinceId: item.provinceId || 'misiones',
        provinceName: item.provinceName || 'Misiones',
        cityId: item.cityId || 'posadas',
        cityName: item.cityName || 'Posadas',
        modality: item.modality || 'Presencial',
        employmentType: item.employmentType || 'Media jornada',
        workingDay: item.workingDay || 'Lunes a viernes',
        requirements: item.requirements || [],
        skills: item.skills || [],
        experienceLevel: item.experienceLevel || 'Con o sin experiencia',
        educationLevel: item.educationLevel || 'Secundario',
        salary: item.salary || '$ 280.000 ARS',
        contactInfo: item.contactInfo || `contacto.${idx + 1}@gmail.com`,
        isPublished: false,
      }));

      setDraftList(mapped);
    } catch (err: any) {
      setError(err.message || 'Error al generar las publicaciones con IA.');
    } finally {
      setLoading(false);
    }
  };

  const updateDraftItem = (id: string, field: keyof DraftJobItem, value: any) => {
    setDraftList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeDraftItem = (id: string) => {
    setDraftList((prev) => prev.filter((item) => item.id !== id));
  };

  // Bulk Apply Modality
  const applyBulkModality = (modality: 'Presencial' | 'Híbrido' | 'Remoto') => {
    setSelectedModality(modality);
    setDraftList((prev) =>
      prev.map((item) => (!item.isPublished ? { ...item, modality } : item)),
    );
  };

  // Bulk Apply Email Domain (e.g. @gmail.com, @yahoo.com, @outlook.com)
  const applyBulkEmailDomain = (domain: string) => {
    setSelectedDomain(domain);
    setDraftList((prev) =>
      prev.map((item) => {
        if (item.isPublished) return item;
        const currentEmail = item.contactInfo || '';
        const userPart = currentEmail.split('@')[0] || 'contacto';
        const cleanUserPart = userPart.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 'contacto';
        return {
          ...item,
          contactInfo: `${cleanUserPart}@${domain}`,
        };
      }),
    );
  };

  // Publish Individual Job
  const handlePublishSingle = async (item: DraftJobItem) => {
    if (!user || item.isPublished) return;
    setPublishingId(item.id);
    setError(null);

    try {
      const res = await aeApi.admin.publishAIJob(user.id, {
        title: item.title,
        description: item.description,
        company: item.company,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        provinceId: item.provinceId,
        provinceName: item.provinceName,
        cityId: item.cityId,
        cityName: item.cityName,
        modality: item.modality,
        employmentType: item.employmentType,
        workingDay: item.workingDay,
        requirements: item.requirements,
        skills: item.skills,
        experienceLevel: item.experienceLevel,
        educationLevel: item.educationLevel,
        salary: item.salary,
        contactInfo: item.contactInfo,
        sourceType: 'AI_GENERATED',
      });

      setDraftList((prev) =>
        prev.map((d) =>
          d.id === item.id ? { ...d, isPublished: true, publishedJobId: res?.id } : d,
        ),
      );
      setSuccessCount((prev) => prev + 1);
      onJobPublished();
    } catch (err: any) {
      setError(err.message || `Error al publicar "${item.title}".`);
    } finally {
      setPublishingId(null);
    }
  };

  // Publish All Pending Jobs
  const handlePublishAll = async () => {
    if (!user) return;
    const pending = draftList.filter((d) => !d.isPublished);
    if (pending.length === 0) return;

    setPublishingAll(true);
    setError(null);

    try {
      const payloadList = pending.map((item) => ({
        title: item.title,
        description: item.description,
        company: item.company,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        provinceId: item.provinceId,
        provinceName: item.provinceName,
        cityId: item.cityId,
        cityName: item.cityName,
        modality: item.modality,
        employmentType: item.employmentType,
        workingDay: item.workingDay,
        requirements: item.requirements,
        skills: item.skills,
        experienceLevel: item.experienceLevel,
        educationLevel: item.educationLevel,
        salary: item.salary,
        contactInfo: item.contactInfo,
        sourceType: 'AI_GENERATED',
      }));

      await aeApi.admin.publishAIJobsBulk(user.id, payloadList);

      setDraftList((prev) =>
        prev.map((d) => ({ ...d, isPublished: true })),
      );
      setSuccessCount((prev) => prev + pending.length);
      onJobPublished();
    } catch (err: any) {
      setError(err.message || 'Error al publicar todas las vacantes.');
    } finally {
      setPublishingAll(false);
    }
  };

  const pendingCount = draftList.filter((d) => !d.isPublished).length;
  const publishedCount = draftList.filter((d) => d.isPublished).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-sm max-w-4xl w-full max-h-[92vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="bg-[#0F1D38] p-4 text-white flex items-center justify-between border-b border-[#1E335A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-indigo-500/20 text-[#0FFCBE]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Generador de Publicaciones con IA (Superadmin Engine)
              </h3>
              <p className="text-[11px] text-slate-300">
                Generación masiva estructurada, ajuste por categorías (hogar, oficios, tech) y aprobación individual o en conjunto
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
              {error}
            </div>
          )}

          {successCount > 0 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-sm flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 text-xs">
                    ¡{successCount} vacante{successCount > 1 ? 's' : ''} publicada{successCount > 1 ? 's' : ''} con éxito!
                  </p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    Las vacantes ya están activas y disponibles en la plataforma sin salir de esta vista.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prompt and Quantity Control */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                Instrucción para la Inteligencia Artificial:
              </label>

              {/* Quantity Selector Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Cantidad a generar:</span>
                {[1, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setJobCount(num)}
                    className={`px-2.5 py-1 rounded-xs font-bold text-[11px] transition-colors ${
                      jobCount === num
                        ? 'bg-[#106EBE] text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num} {num === 1 ? 'vacante' : 'vacantes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ej: Crear 3 ofertas de limpieza, cuidado de hogar y niñera en Posadas..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-900 focus:border-[#106EBE] focus:outline-hidden shadow-2xs"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shrink-0 shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando ({jobCount})...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-[#0FFCBE]" />
                    <span>Generar {jobCount} Publicaciones</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Global Bulk Controls Bar (When Drafts Exist) */}
          {draftList.length > 0 && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-sm space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Ajustes en Conjunto para Todas las Ofertas ({draftList.length})
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">
                  {publishedCount} de {draftList.length} publicadas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Bulk Modality */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-slate-700 shrink-0">Modalidad en conjunto:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Presencial', 'Híbrido', 'Remoto'] as const).map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => applyBulkModality(mod)}
                        className={`px-2.5 py-1 rounded-xs font-bold text-[11px] transition-colors ${
                          selectedModality === mod
                            ? 'bg-indigo-700 text-white'
                            : 'bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk Email Domain */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-bold text-slate-700 shrink-0">Dominio correos:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['gmail.com', 'yahoo.com', 'outlook.com', 'empresa.com.ar'].map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => applyBulkEmailDomain(dom)}
                        className={`px-2 py-1 rounded-xs font-bold text-[11px] transition-colors ${
                          selectedDomain === dom
                            ? 'bg-indigo-700 text-white'
                            : 'bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                        }`}
                      >
                        @{dom}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Job List (Numbered 1, 2, 3...) */}
          {draftList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lista de Publicaciones Generadas ({draftList.length})
                </h4>
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={handlePublishAll}
                    disabled={publishingAll}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-sm shadow-xs transition-colors"
                  >
                    {publishingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Aprobar y Publicar Todas ({pendingCount})</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {draftList.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-sm transition-all ${
                      item.isPublished
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#106EBE]">
                            {index + 1}.
                          </span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateDraftItem(item.id, 'title', e.target.value)}
                            disabled={item.isPublished}
                            className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#106EBE] focus:bg-white focus:outline-hidden px-1 py-0.5 w-full rounded-xs"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 pl-6">
                          Empresa / Empleador:{' '}
                          <input
                            type="text"
                            value={item.company}
                            onChange={(e) => updateDraftItem(item.id, 'company', e.target.value)}
                            disabled={item.isPublished}
                            className="font-semibold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#106EBE] focus:bg-white focus:outline-hidden px-1 py-0.5 rounded-xs"
                          />
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.isPublished ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ¡Publicado!
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePublishSingle(item)}
                              disabled={publishingId === item.id || publishingAll}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm shadow-xs transition-colors"
                            >
                              {publishingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Aprobar y Publicar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDraftItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors"
                              title="Descartar esta oferta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Job Details Card (Like Image: Lugar, Horario, Sueldo, Contacto) */}
                    <div className="space-y-2 pl-6 text-xs text-slate-700">
                      <div>
                        <textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateDraftItem(item.id, 'description', e.target.value)}
                          disabled={item.isPublished}
                          placeholder="Descripción del puesto..."
                          className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xs p-2 focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 shrink-0">Lugar:</span>
                          <input
                            type="text"
                            value={`${item.cityName}, ${item.provinceName}`}
                            onChange={(e) => {
                              const parts = e.target.value.split(',');
                              updateDraftItem(item.id, 'cityName', parts[0]?.trim() || item.cityName);
                              if (parts[1]) updateDraftItem(item.id, 'provinceName', parts[1].trim());
                            }}
                            disabled={item.isPublished}
                            className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-xs text-[11px] focus:bg-white focus:border-[#106EBE]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 shrink-0">Horario:</span>
                          <input
                            type="text"
                            value={item.workingDay}
                            onChange={(e) => updateDraftItem(item.id, 'workingDay', e.target.value)}
                            disabled={item.isPublished}
                            className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-xs text-[11px] focus:bg-white focus:border-[#106EBE]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 shrink-0">Sueldo:</span>
                          <input
                            type="text"
                            value={item.salary}
                            onChange={(e) => updateDraftItem(item.id, 'salary', e.target.value)}
                            disabled={item.isPublished}
                            className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-xs text-[11px] focus:bg-white focus:border-[#106EBE]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 shrink-0">Contacto:</span>
                          <input
                            type="text"
                            value={item.contactInfo}
                            onChange={(e) => updateDraftItem(item.id, 'contactInfo', e.target.value)}
                            disabled={item.isPublished}
                            className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-xs text-[11px] focus:bg-white focus:border-[#106EBE]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Modalidad:</span>
                          <select
                            value={item.modality}
                            onChange={(e) => updateDraftItem(item.id, 'modality', e.target.value)}
                            disabled={item.isPublished}
                            className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-xs text-[11px]"
                          >
                            <option value="Presencial">Presencial</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Remoto">Remoto</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700">Categoría:</span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {draftList.length > 0 && (
              <span>
                {publishedCount} publicada{publishedCount !== 1 ? 's' : ''} • {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-sm transition-colors"
            >
              Cerrar
            </button>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handlePublishAll}
                disabled={publishingAll}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
              >
                {publishingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Aprobar y Publicar Todas ({pendingCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
