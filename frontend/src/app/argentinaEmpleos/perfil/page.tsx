'use client';

import React, { useState, useEffect } from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import {
  ARGENTINA_PROVINCES,
  getCitiesByProvince,
  getProvinceName,
  getCityName,
} from '@/lib/argentina-empleos/geo-data';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import {
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { AEProfileSkeleton } from '@/components/argentina-empleos/ui/ae-skeleton';

export default function ArgentinaEmpleosPerfilPage() {
  const { user, loading: authLoading, refreshProfile, updateUserLocal } = useAEAuth();

  const [formData, setFormData] = useState({
    userType: 'candidato',
    name: '',
    age: 25,
    nationality: 'Argentina',
    provinceId: 'misiones',
    cityId: 'posadas',
    maritalStatus: 'Soltero/a',
    educationLevel: 'Universitario',
    educationInstitution: '',
    educationCareer: '',
    educationStatus: 'Finalizado',
    employmentGoal: 'Estoy buscando trabajo',
    preferredModality: 'Híbrido',
    skills: '',
    experienceSummary: '',
    salaryExpectation: '',
    availability: 'Inmediata',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        userType: (user.userType as string) || 'candidato',
        name: user.name || '',
        age: user.age || 25,
        nationality: user.nationality || 'Argentina',
        provinceId: user.provinceId || 'misiones',
        cityId: user.cityId || 'posadas',
        maritalStatus: (user.maritalStatus as string) || 'Soltero/a',
        educationLevel: (user.education?.level as string) || 'Universitario',
        educationInstitution: user.education?.institution || '',
        educationCareer: user.education?.career || '',
        educationStatus: (user.education?.status as string) || 'Finalizado',
        employmentGoal: (user.employmentGoal as string) || 'Estoy buscando trabajo',
        preferredModality: (user.preferredModality as string) || 'Híbrido',
        skills: user.skills?.join(', ') || '',
        experienceSummary: user.experienceSummary || '',
        salaryExpectation: user.salaryExpectation || '',
        availability: user.availability || 'Inmediata',
      });
    }
  }, [user]);

  const updateField = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const cities = getCitiesByProvince(formData.provinceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const skillsArr = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        app: 'argentinaEmpleos',
        appType: 'argentinaEmpleos',
        userType: formData.userType as any,
        name: formData.name,
        age: Number(formData.age),
        nationality: formData.nationality,
        provinceId: formData.provinceId,
        provinceName: getProvinceName(formData.provinceId),
        cityId: formData.cityId,
        cityName: getCityName(formData.cityId),
        maritalStatus: formData.maritalStatus as any,
        education: {
          level: formData.educationLevel as any,
          institution: formData.educationInstitution,
          career: formData.educationCareer,
          status: formData.educationStatus as any,
        },
        employmentGoal: formData.employmentGoal as any,
        preferredModality: formData.preferredModality as any,
        skills: skillsArr,
        experienceSummary: formData.experienceSummary,
        salaryExpectation: formData.salaryExpectation,
        availability: formData.availability,
      };

      const updated = await aeApi.auth.updateProfile(user.id, payload);
      updateUserLocal(updated);
      await refreshProfile();

      setMessage({ text: 'Perfil profesional actualizado exitosamente.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al actualizar el perfil.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AEShell>
      {authLoading && !user ? (
        <AEProfileSkeleton />
      ) : (
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs">
          <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#106EBE]" />
                Mi Perfil Profesional
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestioná tus datos obligatorios y opcionales para la postulación y búsqueda de empleo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-sm bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                Rol: {user?.role || 'user'}
              </span>
            </div>
          </div>

        {message && (
          <div
            className={`mb-5 p-3 rounded-sm text-xs font-medium flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Mandatory Personal Data */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
              <span>1. Información Obligatoria y Ubicación</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Cuenta (App) *</label>
                <select
                  value={formData.userType}
                  onChange={(e) => updateField('userType', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold text-[#0064D9] focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="candidato">Candidato (Busco empleo)</option>
                  <option value="empresa">Empresa (Publico empleos)</option>
                  <option value="reclutador">Reclutador / Headhunter</option>
                  <option value="ambos">Ambos (Candidato y Empleador)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Edad</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nacionalidad</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Provincia *</label>
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
                <label className="block font-bold text-slate-700 mb-1">Ciudad / Localidad *</label>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="En pareja">En pareja</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no especificar">Prefiero no especificar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Education & Goal */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-100">
              2. Formación Académica y Búsqueda
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nivel Educativo</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
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
                <label className="block font-bold text-slate-700 mb-1">Institución</label>
                <input
                  type="text"
                  value={formData.educationInstitution}
                  onChange={(e) => updateField('educationInstitution', e.target.value)}
                  placeholder="Ej: Universidad Nacional de Misiones"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Carrera / Especialidad</label>
                <input
                  type="text"
                  value={formData.educationCareer}
                  onChange={(e) => updateField('educationCareer', e.target.value)}
                  placeholder="Ej: Ingeniería en Informática"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Details & Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-100">
              3. Información Opcional y Preferencias
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Modalidad Preferida</label>
                <select
                  value={formData.preferredModality}
                  onChange={(e) => updateField('preferredModality', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                >
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pretensión Salarial</label>
                <input
                  type="text"
                  value={formData.salaryExpectation}
                  onChange={(e) => updateField('salaryExpectation', e.target.value)}
                  placeholder="Ej: $ 950.000 ARS"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Habilidades y Tecnologías</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => updateField('skills', e.target.value)}
                  placeholder="Ej: TypeScript, React, PostgreSQL, Liderazgo, Comunicación"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Resumen de Experiencia Profesional</label>
                <textarea
                  rows={3}
                  value={formData.experienceSummary}
                  onChange={(e) => updateField('experienceSummary', e.target.value)}
                  placeholder="Breve descripción de trayectoria y logros principales..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios del Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
      )}
    </AEShell>
  );
}
