'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Download,
  Eye,
  Camera,
  X,
  Loader2,
  Phone,
  Sparkles,
  Layers,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { AEProfileSkeleton } from '@/components/argentina-empleos/ui/ae-skeleton';
import { AEProfilePhoto, AECVAttachment } from '@/lib/argentina-empleos/types';
import { AEDocumentViewerModal } from '@/components/argentina-empleos/ui/ae-document-viewer-modal';
import { downloadDocument } from '@/lib/argentina-empleos/file-utils';
import { AEAvatar } from '@/components/argentina-empleos/ui/ae-avatar';

export default function ArgentinaEmpleosPerfilPage() {
  const { user, isSuperadmin, loading: authLoading, refreshProfile, updateUserLocal } = useAEAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'cv' | 'photos'>('info');
  const [viewingCVDoc, setViewingCVDoc] = useState<AECVAttachment | null>(null);

  const [formData, setFormData] = useState({
    userType: 'candidato',
    name: '',
    headline: '',
    bio: '',
    phone: '',
    age: 25,
    nationality: 'Argentina',
    provinceId: 'misiones',
    cityId: 'posadas',
    maritalStatus: 'Soltero/a',
    gender: 'Prefiero no especificar',
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
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Photo upload modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [pendingUploadPhoto, setPendingUploadPhoto] = useState<{ url: string; caption: string } | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<AEProfilePhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        userType: (user.userType as string) || 'candidato',
        name: user.name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        phone: user.phone || '',
        gender: (user.gender as string) || 'Prefiero no especificar',
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

  // Submit Profile Information
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
        headline: formData.headline,
        bio: formData.bio,
        phone: formData.phone,
        gender: formData.gender as any,
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

  // Handle CV Upload
  const handleCVFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ text: 'El archivo excede el límite máximo de 10 MB.', type: 'error' });
      return;
    }

    setUploadingCV(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const cvData = {
          url: base64Url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/pdf',
        };

        const updated = await aeApi.auth.attachCV(user.id, cvData);
        updateUserLocal(updated);
        await refreshProfile();
        setMessage({ text: `Curriculum "${file.name}" adjuntado exitosamente.`, type: 'success' });
        setUploadingCV(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al adjuntar el CV.', type: 'error' });
      setUploadingCV(false);
    }
  };

  // Handle CV Delete
  const handleDeleteCV = async () => {
    if (!user) return;
    setUploadingCV(true);
    setMessage(null);

    try {
      const updated = await aeApi.auth.deleteCV(user.id);
      updateUserLocal(updated);
      await refreshProfile();
      setMessage({ text: 'Curriculum Vitae eliminado correctamente.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al eliminar el CV.', type: 'error' });
    } finally {
      setUploadingCV(false);
    }
  };

  // Handle Photo Select for Modal
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhotoPreview(reader.result as string);
      setShowPhotoModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle Upload Photo Confirm (Instant modal dismiss & background skeletal upload)
  const handleConfirmAddPhoto = async () => {
    if (!user || !selectedPhotoPreview) return;
    
    const photoToUpload = {
      url: selectedPhotoPreview,
      caption: photoCaption.trim(),
    };

    // Close modal immediately and activate skeletal card
    setShowPhotoModal(false);
    setSelectedPhotoPreview(null);
    setPhotoCaption('');
    setPendingUploadPhoto(photoToUpload);
    setUploadingPhoto(true);
    setMessage(null);

    try {
      const updated = await aeApi.auth.addProfilePhoto(user.id, photoToUpload);
      updateUserLocal(updated);
      await refreshProfile();
      setPendingUploadPhoto(null);
      setMessage({ text: 'Foto publicada exitosamente en tu galería social.', type: 'success' });
    } catch (err: any) {
      setPendingUploadPhoto(null);
      setMessage({ text: err.message || 'Error al subir la foto.', type: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!user) return;
    setMessage(null);

    try {
      const updated = await aeApi.auth.deleteProfilePhoto(user.id, photoId);
      updateUserLocal(updated);
      await refreshProfile();
      if (viewingPhoto?.id === photoId) setViewingPhoto(null);
      setMessage({ text: 'Foto eliminada de tu galería.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error al eliminar la foto.', type: 'error' });
    }
  };

  const userPhotos = user?.photos || [];

  return (
    <AEShell>
      {authLoading && !user ? (
        <AEProfileSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <AEAvatar user={user} size="xl" showBadge={true} />

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                      <span>{user?.name || 'Mi Perfil'}</span>
                      {isSuperadmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Verificado Superadmin</span>
                        </span>
                      )}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#106EBE] border border-blue-200 capitalize">
                      {user?.userType || 'Candidato'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {user?.headline || 'Completá tu titular profesional para destacar ante reclutadores'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {user?.cityName || 'Posadas'}, {user?.provinceName || 'Misiones'}
                    </span>
                    {user?.cvAttachment && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        CV Adjunto
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-600">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      {userPhotos.length} {userPhotos.length === 1 ? 'Foto' : 'Fotos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-3.5 py-2 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'info'
                      ? 'bg-[#106EBE] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Datos y Perfil</span>
                </button>

                <button
                  onClick={() => setActiveTab('cv')}
                  className={`px-3.5 py-2 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'cv'
                      ? 'bg-[#106EBE] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CV Adjunto</span>
                  {user?.cvAttachment && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('photos')}
                  className={`px-3.5 py-2 rounded-sm text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'photos'
                      ? 'bg-[#106EBE] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Fotos y Galería ({userPhotos.length})</span>
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`p-3.5 rounded-sm text-xs font-semibold flex items-center gap-2 shadow-2xs ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: DATOS Y PERFIL */}
          {activeTab === 'info' && (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Datos Principales */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#106EBE]" />
                    <span>1. Información Personal y Presentación</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
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

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Titular Profesional / Especialidad (Aparece en postulaciones)
                      </label>
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => updateField('headline', e.target.value)}
                        placeholder="Ej: Desarrollador Full Stack • Diseñador UI/UX • Contador Público"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="Ej: +54 9 376 412-3456"
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
                      <label className="block font-bold text-slate-700 mb-1">
                        Género / Identidad de Género
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => updateField('gender', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                      >
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no especificar">Prefiero no especificar</option>
                      </select>
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

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">
                        Biografía y Presentación Profesional
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder="Contá brevemente tu perfil, áreas de interés y qué te motiva profesionalmente..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Formación Académica */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>2. Educación y Especialidades</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nivel Educativo</label>
                      <select
                        value={formData.educationLevel}
                        onChange={(e) => updateField('educationLevel', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                      >
                        <option value="Sin estudios formales">Sin educación formal</option>
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
                      <label className="block font-bold text-slate-700 mb-1">Carrera / Título</label>
                      <input
                        type="text"
                        value={formData.educationCareer}
                        onChange={(e) => updateField('educationCareer', e.target.value)}
                        placeholder="Ej: Licenciatura en Sistemas"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">Habilidades y Tecnologías (separadas por coma)</label>
                      <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        placeholder="Ej: React, Node.js, Ventas B2B, Liderazgo, Gestión de Equipos, Excel Avanzado"
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

          {/* TAB 2: CV ADJUNTO (DOCUMENTO) */}
          {activeTab === 'cv' && (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Curriculum Vitae Adjunto</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subí tu archivo de CV en formato PDF o Word. Al postularte a cualquier oferta laboral, los reclutadores podrán descargarlo y revisarlo al instante.
                </p>
              </div>

              {user?.cvAttachment ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-sm bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{user.cvAttachment.fileName}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          {user.cvAttachment.fileSize
                            ? `${(user.cvAttachment.fileSize / 1024 / 1024).toFixed(2)} MB`
                            : 'Documento PDF'}
                        </span>
                        <span>•</span>
                        <span>
                          Subido el{' '}
                          {new Date(user.cvAttachment.uploadedAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingCVDoc(user.cvAttachment!)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-sm border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#106EBE]" />
                      <span>Visualizar CV</span>
                    </button>

                    <button
                      onClick={() => downloadDocument(user.cvAttachment!.url, user.cvAttachment!.fileName)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar CV</span>
                    </button>

                    <button
                      onClick={handleDeleteCV}
                      disabled={uploadingCV}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-sm border border-red-200 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar CV</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed border-slate-300 hover:border-[#106EBE] bg-slate-50/60 hover:bg-blue-50/40 rounded-sm text-center cursor-pointer transition-colors space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#106EBE] flex items-center justify-center mx-auto">
                    {uploadingCV ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {uploadingCV ? 'Subiendo CV...' : 'Hacé clic para seleccionar tu CV (PDF o Word)'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Formatos compatibles: .pdf, .doc, .docx (Tamaño máximo: 10 MB)
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCVFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* TAB 3: FOTOS & FEED SOCIAL */}
          {activeTab === 'photos' && (
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    <span>Fotos y Feed Social de tu Perfil</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compartí fotos de tu espacio de trabajo, certificaciones, proyectos o fotos profesionales. Los reclutadores podrán ver tu perfil social al recibir tu postulación.
                  </p>
                </div>

                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Nueva Foto</span>
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {userPhotos.length === 0 && !pendingUploadPhoto ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-sm">
                  <Camera className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Aún no agregaste fotos a tu perfil</p>
                  <p className="text-slate-400 mt-0.5">
                    Subí fotos de tus trabajos, certificados o retrato profesional para destacar tu candidatura.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* SKELETAL LOADING CARD (Facebook / Instagram Shimmer) */}
                  {pendingUploadPhoto && (
                    <div className="bg-white border-2 border-blue-200 rounded-sm overflow-hidden shadow-xs flex flex-col justify-between animate-pulse">
                      <div className="relative aspect-4/3 bg-slate-800 overflow-hidden flex flex-col items-center justify-center">
                        <img
                          src={pendingUploadPhoto.url}
                          alt="Subiendo..."
                          className="w-full h-full object-cover blur-xs opacity-60 scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center gap-2 text-white">
                          <div className="w-8 h-8 rounded-full border-3 border-white/30 border-t-white animate-spin" />
                          <span className="text-[11px] font-bold text-white tracking-wide drop-shadow-sm">
                            Publicando foto...
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                        {pendingUploadPhoto.caption ? (
                          <p className="text-xs font-semibold text-slate-700 line-clamp-2">
                            {pendingUploadPhoto.caption}
                          </p>
                        ) : (
                          <div className="h-3.5 bg-slate-200 rounded-xs w-3/4 animate-pulse" />
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-blue-600 font-bold">Subiendo a tu perfil...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {userPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group bg-slate-50 border border-slate-200 rounded-sm overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div
                        className="relative aspect-4/3 cursor-pointer overflow-hidden bg-slate-200"
                        onClick={() => setViewingPhoto(photo)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Foto de perfil'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      </div>

                      <div className="p-3 bg-white border-t border-slate-100 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                            {photo.caption || 'Sin descripción'}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(photo.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Eliminar foto"
                          className="p-1.5 rounded-xs hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal: Facebook Style Post Modal */}
          {showPhotoModal && selectedPhotoPreview && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Facebook Header */}
                <div className="relative px-5 py-3.5 border-b border-slate-200 flex items-center justify-center">
                  <h3 className="text-sm font-bold text-slate-900">
                    Crear publicación
                  </h3>
                  <button
                    onClick={() => setShowPhotoModal(false)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
                  {/* User row (Facebook style) */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#0064D9] text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-100">
                      {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{user?.name}</div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 text-[10px] font-semibold mt-0.5">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>Público en Galería</span>
                      </div>
                    </div>
                  </div>

                  {/* Caption Textarea (Facebook style) */}
                  <div>
                    <textarea
                      rows={3}
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="¿De qué trata esta foto? Comparte detalles de tu proyecto o experiencia..."
                      className="w-full p-2 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden resize-none leading-relaxed"
                    />
                  </div>

                  {/* Image Preview Container (Facebook style card) */}
                  <div className="relative rounded-lg border border-slate-200 bg-slate-900 overflow-hidden group max-h-72 flex items-center justify-center">
                    <img
                      src={selectedPhotoPreview}
                      alt="Vista previa"
                      className="max-h-72 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(false)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all"
                      title="Eliminar o cambiar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Facebook-style Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAddPhoto}
                      className="w-full py-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white font-bold text-xs rounded-md shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <span>Publicar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lightbox Modal: Visualizar Foto Ampliada */}
          {viewingPhoto && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setViewingPhoto(null)}
            >
              <div
                className="bg-white rounded-sm max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">
                    {viewingPhoto.caption || 'Foto del Perfil'}
                  </span>
                  <button
                    onClick={() => setViewingPhoto(null)}
                    className="p-1 rounded-xs hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-[70vh] overflow-hidden rounded-sm bg-slate-900 flex items-center justify-center">
                  <img
                    src={viewingPhoto.url}
                    alt={viewingPhoto.caption || 'Foto'}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <span>
                    Subida el {new Date(viewingPhoto.createdAt).toLocaleDateString('es-AR')}
                  </span>
                  <button
                    onClick={() => handleDeletePhoto(viewingPhoto.id)}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar esta foto</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Viewer Modal for CV */}
          {viewingCVDoc && (
            <AEDocumentViewerModal
              isOpen={Boolean(viewingCVDoc)}
              onClose={() => setViewingCVDoc(null)}
              fileUrl={viewingCVDoc.url}
              fileName={viewingCVDoc.fileName}
            />
          )}
        </div>
      )}
    </AEShell>
  );
}
