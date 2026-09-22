'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  User,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Globe,
  Briefcase,
  Code2,
  Save,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserProfile, UserCv } from '@/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user-default',
    name: 'Profesional RAS3',
    professionalTitle: 'Full Stack & AI Engineer',
    description: 'Especialista en desarrollo de software escalable, agentes de IA e integraciones.',
    skills: ['TypeScript', 'React', 'Next.js', 'NestJS', 'AI Agents', 'Automation', 'Python'],
    technologies: ['React', 'Next.js', 'Node.js', 'NestJS', 'Firestore', 'Firebase', 'OpenAI', 'Gemini'],
    languages: ['Español', 'English'],
    services: ['Desarrollo Web', 'Automatización con IA', 'Sistemas a Medida', 'APIs & Integraciones'],
    preferredRoles: ['Senior Full Stack Engineer', 'AI Solutions Architect'],
    preferredIndustries: ['Tecnología', 'SaaS', 'Fintech'],
    preferredLocations: ['Remoto'],
  });

  const [cvs, setCvs] = useState<UserCv[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New CV modal/form state
  const [newCvName, setNewCvName] = useState('');
  const [newCvLang, setNewCvLang] = useState('es');
  const [newCvFile, setNewCvFile] = useState('CV_Document.pdf');

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, cvsRes] = await Promise.all([
          api.opportunity.getProfile().catch(() => null),
          api.opportunity.getCvs().catch(() => []),
        ]);
        if (profRes) setProfile(profRes);
        if (Array.isArray(cvsRes)) setCvs(cvsRes);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.opportunity.saveProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error al guardar perfil: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddCv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCvName.trim()) return;

    try {
      const newCv: UserCv = {
        id: `cv_${Date.now()}`,
        userId: profile.id,
        name: newCvName.trim(),
        language: newCvLang,
        fileName: newCvFile || 'CV_Profile.pdf',
        isDefault: cvs.length === 0,
        structuredProfile: {
          skills: profile.skills,
          experienceYears: 5,
          roles: profile.preferredRoles,
        },
      };

      await api.opportunity.saveCv(newCv);
      setCvs([...cvs, newCv]);
      setNewCvName('');
    } catch (err: any) {
      alert(`Error al agregar CV: ${err.message}`);
    }
  };

  const handleDeleteCv = async (id: string) => {
    try {
      await api.opportunity.deleteCv(id);
      setCvs(cvs.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar CV: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Professional Profile & Multi-CV</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Configura tu perfil profesional, servicios ofrecidos y versiones multilingües de CV.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details Form */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-100">Información Profesional & Servicios</h3>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Título Profesional</label>
                <input
                  type="text"
                  value={profile.professionalTitle || ''}
                  onChange={(e) => setProfile({ ...profile, professionalTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Descripción / Resumen</label>
              <textarea
                rows={3}
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Servicios Ofrecidos (Separados por coma - usados por el AI Opportunity Engine)
              </label>
              <input
                type="text"
                value={profile.services.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    services: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Habilidades y Tecnologías Principales (Separadas por coma)
              </label>
              <input
                type="text"
                value={profile.skills.join(', ')}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Guardando...' : 'Guardar Perfil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Multi-CV Management */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-100">Gestión Multi-CV</h3>
            <span className="text-xs text-zinc-500">{cvs.length} disponibles</span>
          </div>

          {/* Add CV Mini Form */}
          <form onSubmit={handleAddCv} className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-xs font-medium text-zinc-300 block">Registrar Nuevo CV</span>
            <input
              type="text"
              placeholder="Nombre (ej. CV Inglés - Developer)"
              value={newCvName}
              onChange={(e) => setNewCvName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCvLang}
                onChange={(e) => setNewCvLang(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none"
              >
                <option value="es">Español (ES)</option>
                <option value="en">Inglés (EN)</option>
              </select>
              <button
                type="submit"
                disabled={!newCvName.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar CV</span>
              </button>
            </div>
          </form>

          {/* CVs List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {cvs.map((cv) => (
              <div
                key={cv.id}
                className="p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/60 flex items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-200">{cv.name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                      {cv.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{cv.fileName}</p>
                </div>

                <div className="flex items-center gap-1">
                  {cv.isDefault && (
                    <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      Default
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteCv(cv.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
