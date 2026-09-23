'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  getProvinceName,
  getCityName,
  DEFAULT_JOB_CATEGORIES,
} from '@/lib/argentina-empleos/geo-data';
import {
  AEMaritalStatus,
  AEEducationLevel,
  AEEducationStatus,
  AEEmploymentGoal,
  AEModality,
  AEGender,
} from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

export function OnboardingWizard() {
  const router = useRouter();
  const { user, wallet, refreshProfile, refreshWallet, updateUserLocal } = useAEAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    userType: (user?.userType || 'candidato') as 'candidato' | 'empresa' | 'reclutador' | 'ambos',
    name: user?.name || '',
    gender: (user?.gender || 'Prefiero no especificar') as AEGender,
    age: user?.age || 28,
    nationality: user?.nationality || 'Argentina',
    provinceId: user?.provinceId || 'misiones',
    provinceName: user?.provinceName || 'Misiones',
    cityId: user?.cityId || 'posadas',
    cityName: user?.cityName || 'Posadas',
    maritalStatus: (user?.maritalStatus || 'Soltero/a') as AEMaritalStatus,
    educationLevel: (user?.education?.level || 'Universitario') as AEEducationLevel,
    educationInstitution: user?.education?.institution || '',
    educationCareer: user?.education?.career || '',
    educationStatus: (user?.education?.status || 'Finalizado') as AEEducationStatus,
    employmentGoal: (user?.employmentGoal || 'Estoy buscando trabajo') as AEEmploymentGoal,
    preferredModality: (user?.preferredModality || 'Híbrido') as AEModality,
    skills: user?.skills?.length ? user.skills.join(', ') : 'Desarrollo Web, Gestión, Trabajo en equipo',
    salaryExpectation: user?.salaryExpectation || '$ 850.000 - $ 1.200.000 ARS',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const cities = getCitiesByProvince(formData.provinceId);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Por favor ingresá tu nombre completo.');
        return;
      }
      if (!formData.provinceId || !formData.cityId) {
        setError('Por favor seleccioná tu provincia y ciudad.');
        return;
      }
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const profilePayload = {
        app: 'argentinaEmpleos',
        appType: 'argentinaEmpleos',
        userType: formData.userType,
        name: formData.name,
        gender: formData.gender,
        age: Number(formData.age),
        nationality: formData.nationality,
        provinceId: formData.provinceId,
        provinceName: getProvinceName(formData.provinceId),
        cityId: formData.cityId,
        cityName: getCityName(formData.cityId),
        maritalStatus: formData.maritalStatus,
        education: {
          level: formData.educationLevel,
          institution: formData.educationInstitution,
          career: formData.educationCareer,
          status: formData.educationStatus,
        },
        employmentGoal: formData.employmentGoal,
        preferredModality: formData.preferredModality,
        skills: skillsArray,
        salaryExpectation: formData.salaryExpectation,
      };

      const updated = await aeApi.auth.completeOnboarding(user.id, profilePayload);
      updateUserLocal(updated);
      await refreshWallet();
      await refreshProfile();

      // Show celebratory animation overlay with credit accreditation before redirect
      setCelebrating(true);
      setTimeout(() => {
        router.push('/argentinaEmpleos');
      }, 2400);
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Error al guardar el perfil.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
      {/* Progress Bar & Header */}
      <div className="bg-[#0064D9] p-4 sm:p-6 text-white border-b border-[#0050B3]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B] bg-white/10 px-2 py-0.5 rounded-sm">
              Paso {step} de {totalSteps}
            </span>
            <span className="text-blue-200">•</span>
            <span className="text-xs text-blue-100 font-medium">Onboarding Profesional</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-white/15 border border-white/20 text-[11px] font-bold text-white self-start sm:self-auto">
            <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Desbloquearás $ 25.000 ARS al completar</span>
          </div>
        </div>

        <div className="w-full bg-[#0047A5] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#F59E0B] h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Body */}
      <div className="p-4 sm:p-6">

        {error && (
          <div className="mb-5 p-3 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Personal & Geographic Data */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#106EBE]" />
                Datos Personales y Ubicación
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                La ubicación es fundamental para priorizar empleos geográficamente cerca tuyo.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipo de Cuenta en Argentina Empleos *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'candidato', label: 'Candidato', desc: 'Busco empleo' },
                  { id: 'empresa', label: 'Empresa', desc: 'Contratar talento' },
                  { id: 'reclutador', label: 'Reclutador', desc: 'Headhunter / RRHH' },
                  { id: 'ambos', label: 'Ambos', desc: 'Candidato y Empresa' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateField('userType', t.id)}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      formData.userType === t.id
                        ? 'border-[#0064D9] bg-blue-50/60 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{t.label}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ej: Martín Rodríguez"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Género / Identidad de Género *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no especificar">Prefiero no especificar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado Civil
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="En pareja">En pareja</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no especificar">Prefiero no especificar</option>
                </select>
              </div>

              {/* Geographic Hierarchy: Province */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Provincia *
                </label>
                <select
                  value={formData.provinceId}
                  onChange={(e) => {
                    const newProvId = e.target.value;
                    const defaultCity = getCitiesByProvince(newProvId)[0]?.id || '';
                    setFormData((prev) => ({
                      ...prev,
                      provinceId: newProvId,
                      provinceName: getProvinceName(newProvId),
                      cityId: defaultCity,
                      cityName: getCityName(defaultCity),
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  {ARGENTINA_PROVINCES.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Geographic Hierarchy: City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad / Localidad *
                </label>
                <select
                  value={formData.cityId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      cityId: cId,
                      cityName: getCityName(cId),
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Education */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#106EBE]" />
                Educación y Formación (Opcional)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Contanos tu nivel formativo alcanzado o en curso. Podés continuar aunque no tengas estudios formales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nivel Educativo
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Sin estudios formales">Sin educación formal / No tengo</option>
                  <option value="Primario">Primario</option>
                  <option value="Secundario">Secundario</option>
                  <option value="Terciario">Terciario</option>
                  <option value="Universitario">Universitario</option>
                  <option value="Posgrado / Máster">Posgrado / Máster</option>
                  <option value="Cursos / Certificaciones">Cursos / Certificaciones</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado de la Carrera
                </label>
                <select
                  value={formData.educationStatus}
                  onChange={(e) => updateField('educationStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Finalizado">Finalizado</option>
                  <option value="En curso">En curso</option>
                  <option value="Incompleto">Incompleto</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institución Educativa (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.educationInstitution}
                  onChange={(e) => updateField('educationInstitution', e.target.value)}
                  placeholder="Ej: Universidad Nacional de Misiones / UBA / UTN / Silicon Misiones"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carrera o Especialidad (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.educationCareer}
                  onChange={(e) => updateField('educationCareer', e.target.value)}
                  placeholder="Ej: Licenciatura en Sistemas / Contador Público / Tecnicatura en Desarrollo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Goal & Preferences */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#106EBE]" />
                Objetivo y Preferencias Laborales
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ¿Qué estás buscando principalmente en Argentina Empleos?
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                ¿Qué estás buscando?
              </label>
              {[
                { id: 'Estoy buscando trabajo', label: 'Estoy buscando trabajo', desc: 'Deseo postularme a vacantes y recibir recomendaciones' },
                { id: 'Quiero publicar una oferta de trabajo', label: 'Quiero publicar ofertas de trabajo', desc: 'Represento a una empresa o recluto talento' },
                { id: 'Ambas', label: 'Ambas opciones', desc: 'Explorar oportunidades y también publicar vacantes' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${
                    formData.employmentGoal === opt.id
                      ? 'border-[#106EBE] bg-blue-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="employmentGoal"
                    value={opt.id}
                    checked={formData.employmentGoal === opt.id}
                    onChange={(e) => updateField('employmentGoal', e.target.value)}
                    className="mt-0.5 text-[#106EBE]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modalidad Preferida
                </label>
                <select
                  value={formData.preferredModality}
                  onChange={(e) => updateField('preferredModality', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pretensión Salarial Estimada
                </label>
                <input
                  type="text"
                  value={formData.salaryExpectation}
                  onChange={(e) => updateField('salaryExpectation', e.target.value)}
                  placeholder="Ej: $ 900.000 ARS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Habilidades Principales (separadas por coma)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  placeholder="Ej: React, Node.js, Gestión de proyectos, SQL, Trabajo en equipo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Welcome Credit Confirmation */}
        {step === 4 && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ¡Bienvenido a Argentina Empleos!
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Tu perfil profesional se configuró exitosamente para la región{' '}
                <span className="font-bold text-[#106EBE]">
                  {formData.cityName}, {formData.provinceName}
                </span>.
              </p>
            </div>

            {/* Welcome Credit Card */}
            <div className="p-5 rounded-sm bg-gradient-to-br from-[#0064D9] to-[#0047A5] text-white border border-blue-600/40 max-w-md mx-auto shadow-md">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span>Crédito Inicial Otorgado</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-white mt-1">
                $ 25.000 <span className="text-sm font-sans font-bold text-blue-200">ARS</span>
              </div>
              <p className="text-[11px] text-blue-100 mt-2 leading-relaxed">
                Asignado en tu billetera interna para destacar publicaciones o futuros servicios dentro de la plataforma.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Usuario:</span>
                <span className="font-bold text-slate-800">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación:</span>
                <span className="font-semibold text-slate-800">{formData.cityName}, {formData.provinceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formación:</span>
                <span className="font-semibold text-slate-800">{formData.educationCareer}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              <span>{submitting ? 'Guardando...' : 'Comenzar a explorar empleos'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Celebratory Completion Overlay */}
      {celebrating && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-sm max-w-md w-full p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-300">
            {/* Animated Celebration Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                ¡Registro Completado con Éxito!
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                ¡Bienvenido a Argentina Empleos!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Tu perfil profesional se encuentra 100% activo en la región de{' '}
                <strong className="text-slate-900">{formData.cityName}, {formData.provinceName}</strong>.
              </p>
            </div>

            {/* Acreditación de Créditos Card */}
            <div className="p-4 rounded-sm bg-gradient-to-br from-[#0064D9] to-[#0047A5] text-white border border-blue-500 shadow-md">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span>Créditos de Bienvenida Acreditados</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                +$ 25.000 <span className="text-xs font-sans text-blue-200">ARS</span>
              </div>
              <p className="text-[11px] text-blue-100 mt-1">
                Disponibles inmediatamente en tu billetera de la plataforma.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium animate-pulse flex items-center justify-center gap-2">
              <span>Redirigiendo a tu feed de empleos...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
