'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  getProvinceName,
  getCityName,
  DEFAULT_JOB_CATEGORIES,
} from '@/lib/argentina-empleos/geo-data';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  PlusCircle,
  EyeOff,
  Building,
  MapPin,
  Check,
  AlertCircle,
  ShieldCheck,
  Lock,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function ArgentinaEmpleosPublicarPage() {
  const router = useRouter();
  const { user } = useAEAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    categoryId: 'tecnologia',
    categoryName: 'Tecnología y Software',
    provinceId: user?.provinceId || 'misiones',
    cityId: user?.cityId || 'posadas',
    modality: 'Híbrido',
    employmentType: 'Relación de dependencia',
    workingDay: 'Jornada completa (9 a 18 hs)',
    requirements: '',
    skills: '',
    experienceLevel: 'Semi Senior (2-4 años)',
    educationLevel: 'Universitario',
    salary: '$ 900.000 - $ 1.300.000 ARS',
    contactInfo: user?.email && !user.email.endsWith('@argentinaempleos.local') ? user.email : '',
    isAnonymous: false,
    isPrivate: false,
    isVerifiedCompany: false,
    isWomenOnly: false,
    hasTermsAgreement: false,
    termsText: 'El postulante se compromete a mantener estricta confidencialidad sobre la información del puesto y los procesos de la empresa.',
    publishAs: 'company', // 'name' | 'company' | 'anonymous'
  });

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperadmin = user?.role === 'superadmin';

  const updateField = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const cities = getCitiesByProvince(formData.provinceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Debés iniciar sesión para publicar una vacante.');
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Completá título y descripción obligatorios.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const isAnon = formData.publishAs === 'anonymous';
      const companyDisplayName =
        formData.publishAs === 'anonymous'
          ? 'Publicación anónima'
          : formData.publishAs === 'name'
          ? user.name
          : formData.company || user.name;

      const reqArray = formData.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const categoryObj = DEFAULT_JOB_CATEGORIES.find((c) => c.id === formData.categoryId);

      const jobPayload = {
        title: formData.title,
        description: formData.description,
        company: companyDisplayName,
        categoryId: formData.categoryId,
        categoryName: categoryObj?.name || 'General',
        provinceId: formData.provinceId,
        provinceName: getProvinceName(formData.provinceId),
        cityId: formData.cityId,
        cityName: getCityName(formData.cityId),
        modality: formData.modality as any,
        employmentType: formData.employmentType as any,
        workingDay: formData.workingDay,
        requirements: reqArray,
        skills: skillsArray,
        experienceLevel: formData.experienceLevel,
        educationLevel: formData.educationLevel,
        salary: formData.salary,
        contactInfo: formData.contactInfo,
        isAnonymous: isAnon,
        isPrivate: Boolean(formData.isPrivate),
        isVerifiedCompany: isSuperadmin ? Boolean(formData.isVerifiedCompany) : false,
        isWomenOnly: isSuperadmin ? Boolean(formData.isWomenOnly) : false,
        hasTermsAgreement: isSuperadmin ? Boolean(formData.hasTermsAgreement) : false,
        termsText: isSuperadmin && formData.hasTermsAgreement ? formData.termsText : undefined,
        sourceType: isSuperadmin ? 'ADMIN_CREATED' : 'REAL',
      };

      const created = await aeApi.jobs.createJob(user.id, jobPayload);
      router.push(`/argentinaEmpleos/trabajos/${created.id}`);
    } catch (err: any) {
      console.error('Error publishing job:', err);
      setError(err.message || 'Error al publicar la vacante.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AEShell>
      <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#106EBE]" />
            Publicar Nueva Oportunidad Laboral
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publicá una vacante para candidatos de tu ciudad, provincia o con alcance nacional remoto.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Identity & Anonymous Option */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
            <label className="block font-bold text-slate-900">
              ¿Cómo deseás publicar esta vacante?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'company', label: 'A nombre de Empresa', desc: 'Mostrar el nombre de tu empresa' },
                { id: 'name', label: `Como ${user?.name || 'Mi nombre'}`, desc: 'Mostrar tu perfil personal' },
                { id: 'anonymous', label: 'Publicación Anónima', desc: 'Oculta tu identidad a usuarios estándar' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 border rounded-sm cursor-pointer transition-colors flex flex-col ${
                    formData.publishAs === opt.id
                      ? 'border-[#106EBE] bg-blue-50/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="publishAs"
                      value={opt.id}
                      checked={formData.publishAs === opt.id}
                      onChange={(e) => updateField('publishAs', e.target.value)}
                      className="text-[#106EBE]"
                    />
                    <span className="font-bold text-slate-800">{opt.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">{opt.desc}</span>
                </label>
              ))}
            </div>

            {formData.publishAs === 'company' && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Ej: AgroTech Misiones S.A."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Core Job Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Título de la Vacante *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Ej: Desarrollador Backend Node.js / NestJS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría / Área *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              >
                {DEFAULT_JOB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modalidad *</label>
              <select
                value={formData.modality}
                onChange={(e) => updateField('modality', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              >
                <option value="Híbrido">Híbrido</option>
                <option value="Presencial">Presencial</option>
                <option value="Remoto">Remoto</option>
              </select>
            </div>

            {/* Geographic Location of the Job */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Provincia del Puesto *</label>
              <select
                value={formData.provinceId}
                onChange={(e) => {
                  const pId = e.target.value;
                  const defCity = getCitiesByProvince(pId)[0]?.id || '';
                  setFormData((prev) => ({
                    ...prev,
                    provinceId: pId,
                    cityId: defCity,
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              >
                {ARGENTINA_PROVINCES.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ciudad del Puesto *</label>
              <select
                value={formData.cityId}
                onChange={(e) => updateField('cityId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Descripción del Puesto *</label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detalles de las responsabilidades, equipo de trabajo, objetivos..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Requisitos (uno por línea)</label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                placeholder="Experiencia mínima de 2 años&#10;Manejo de Git&#10;Residencia en la zona"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Habilidades Requeridas (separadas por coma)</label>
              <textarea
                rows={3}
                value={formData.skills}
                onChange={(e) => updateField('skills', e.target.value)}
                placeholder="React, TypeScript, SQL, Trabajo en equipo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Rango Salarial</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => updateField('salary', e.target.value)}
                placeholder="Ej: $ 950.000 - $ 1.400.000 ARS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contacto / Email de Recepción</label>
              <input
                type="text"
                required
                value={formData.contactInfo}
                onChange={(e) => updateField('contactInfo', e.target.value)}
                placeholder="rrhh@empresa.com.ar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Privacy and Special Settings */}
          <div className="space-y-3 pt-2">
            {/* Private job toggle (all users) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm flex items-start gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => updateField('isPrivate', e.target.checked)}
                className="mt-0.5 rounded text-[#106EBE] focus:ring-[#106EBE]"
              />
              <div className="text-xs">
                <label htmlFor="isPrivate" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Publicación Privada / Exclusiva
                </label>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Marcá esta vacante como privada o de contratación reservada dentro de la plataforma.
                </p>
              </div>
            </div>

            {/* Superadmin Special Options */}
            {isSuperadmin && (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-sm space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 border-b border-amber-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Opciones Especiales de Superadministrador
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isVerifiedCompany"
                    checked={formData.isVerifiedCompany}
                    onChange={(e) => updateField('isVerifiedCompany', e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <label htmlFor="isVerifiedCompany" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Empresa Verificada Oficial
                    </label>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Agrega el sello de verificación de autenticidad corporativa de Argentina Empleos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isWomenOnly"
                    checked={formData.isWomenOnly}
                    onChange={(e) => updateField('isWomenOnly', e.target.checked)}
                    className="mt-0.5 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <div className="text-xs">
                    <label htmlFor="isWomenOnly" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      Publicación Exclusiva para Mujeres (Inclusión & Diversidad)
                    </label>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Restringe la postulación exclusivamente a usuarias registradas con género femenino.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="hasTermsAgreement"
                    checked={formData.hasTermsAgreement}
                    onChange={(e) => updateField('hasTermsAgreement', e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs flex-1">
                    <label htmlFor="hasTermsAgreement" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      Publicación Especial con Aceptación Obligatoria de Términos
                    </label>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Los candidatos deberán aceptar los términos y condiciones de confidencialidad para poder desbloquear los detalles de la oferta.
                    </p>

                    {formData.hasTermsAgreement && (
                      <div className="mt-2.5">
                        <label className="block font-bold text-slate-700 mb-1">
                          Texto del Acuerdo o Términos de Confidencialidad
                        </label>
                        <textarea
                          rows={3}
                          value={formData.termsText}
                          onChange={(e) => updateField('termsText', e.target.value)}
                          placeholder="Escribe los términos y condiciones de confidencialidad que el usuario debe aceptar..."
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-sm text-xs focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{publishing ? 'Publicando...' : 'Publicar Vacante Ahora'}</span>
            </button>
          </div>
        </form>
      </div>
    </AEShell>
  );
}
