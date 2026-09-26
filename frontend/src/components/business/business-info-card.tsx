'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Tag,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Edit3,
  Sparkles,
  Layers,
  Share2,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import { BusinessProfile, BusinessProductOrService } from '@/types';
import { api } from '@/lib/api';

interface BusinessInfoCardProps {
  profile: BusinessProfile;
  onProfileUpdated: (updated: BusinessProfile) => void;
  onNavigateToDiagnostic?: () => void;
  onNavigateToAssistant?: () => void;
}

export function BusinessInfoCard({
  profile,
  onProfileUpdated,
  onNavigateToDiagnostic,
  onNavigateToAssistant,
}: BusinessInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BusinessProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New product / service form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  const handleStartEdit = () => {
    setFormData(JSON.parse(JSON.stringify(profile)));
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) return;
    const newItem: BusinessProductOrService = {
      id: `prod_${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory.trim() || 'General',
      price: newProdPrice.trim() || undefined,
      description: newProdDesc.trim() || undefined,
    };
    setFormData({
      ...formData,
      productsOrServices: [...(formData.productsOrServices || []), newItem],
    });
    setNewProdName('');
    setNewProdCategory('');
    setNewProdPrice('');
    setNewProdDesc('');
  };

  const handleDeleteProduct = (id: string) => {
    setFormData({
      ...formData,
      productsOrServices: (formData.productsOrServices || []).filter((p) => p.id !== id),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await api.businessBoost.saveProfile(formData);
      onProfileUpdated(res);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la información del negocio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{profile.name || 'Mi Negocio'}</h2>
                <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                  Activo en RIS3
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {profile.description || 'Configura los datos clave de tu negocio para que el Asistente RIS3 y el motor de diagnóstico operen con máxima precisión contextual.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Tag size={13} className="text-emerald-400" />
                  {profile.industry || 'Rubro no definido'}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <MapPin size={13} className="text-blue-400" />
                  {profile.location || 'Ubicación no especificada'}
                </span>
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 transition-colors"
                  >
                    <Globe size={13} className="text-violet-400" />
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 size={14} /> Guardado exitoso
              </span>
            )}
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs font-semibold border border-zinc-700 transition-all shadow-xs"
              >
                <Edit3 size={14} />
                Editar Información
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Channels */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Share2 size={14} className="text-emerald-400" />
              Contacto y Canales
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Mail size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-zinc-500 block">Email comercial</span>
                  <span className="text-zinc-200 truncate block font-medium">
                    {profile.contactEmail || 'No configurado'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Phone size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-zinc-500 block">Teléfono / WhatsApp</span>
                  <span className="text-zinc-200 truncate block font-medium">
                    {profile.contactPhone || 'No configurado'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Globe size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-zinc-500 block">Sitio Web</span>
                  <span className="text-zinc-200 truncate block font-medium">
                    {profile.website || 'No configurado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links List */}
            <div className="pt-3 border-t border-zinc-800/80">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Redes Sociales
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {profile.socialLinks?.instagram && (
                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-zinc-300 truncate">
                    <span className="text-pink-400 font-semibold mr-1">IG:</span> {profile.socialLinks.instagram}
                  </div>
                )}
                {profile.socialLinks?.whatsapp && (
                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-zinc-300 truncate">
                    <span className="text-emerald-400 font-semibold mr-1">WA:</span> {profile.socialLinks.whatsapp}
                  </div>
                )}
                {profile.socialLinks?.facebook && (
                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-zinc-300 truncate">
                    <span className="text-blue-400 font-semibold mr-1">FB:</span> {profile.socialLinks.facebook}
                  </div>
                )}
                {profile.socialLinks?.linkedin && (
                  <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-zinc-300 truncate">
                    <span className="text-blue-500 font-semibold mr-1">IN:</span> {profile.socialLinks.linkedin}
                  </div>
                )}
                {!profile.socialLinks?.instagram && !profile.socialLinks?.whatsapp && !profile.socialLinks?.facebook && !profile.socialLinks?.linkedin && (
                  <p className="text-xs text-zinc-500 italic col-span-2">Sin redes sociales vinculadas.</p>
                )}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              {onNavigateToDiagnostic && (
                <button
                  onClick={onNavigateToDiagnostic}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all border border-zinc-700/50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Ejecutar Diagnóstico IA
                  </span>
                  <span className="text-zinc-500">→</span>
                </button>
              )}
              {onNavigateToAssistant && (
                <button
                  onClick={onNavigateToAssistant}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-400 transition-all border border-emerald-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} />
                    Consultar Asistente RIS3
                  </span>
                  <span className="text-emerald-500">→</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Products & Services Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  Catálogo de Productos y Servicios
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  La IA utiliza este catálogo como fuente de verdad para generar contenido y detectar oportunidades.
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-zinc-700">
                {profile.productsOrServices?.length || 0} registrados
              </span>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {profile.productsOrServices && profile.productsOrServices.length > 0 ? (
                profile.productsOrServices.map((prod) => (
                  <div
                    key={prod.id}
                    className="group relative rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-emerald-400 mb-1 border border-zinc-700/50">
                          {prod.category || 'General'}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {prod.name}
                        </h4>
                      </div>
                      {prod.price && (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          {prod.price}
                        </span>
                      )}
                    </div>
                    {prod.description && (
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                  <Layers size={32} className="mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm text-zinc-400 font-medium">No hay productos o servicios cargados aún</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Presiona "Editar Información" para cargar tus productos y servicios principales.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Full Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl my-8 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Editar Información del Negocio</h3>
                    <p className="text-xs text-zinc-400">Actualiza los datos disponibles para la inteligencia contextual</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Nombre del Negocio *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="Ej: Panadería La Espiga"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Rubro / Industria *</label>
                    <input
                      type="text"
                      required
                      value={formData.industry || ''}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="Ej: Gastronomía, Servicios Digitales, Indumentaria"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Ubicación</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="Ej: Buenos Aires, Córdoba, Remoto"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Sitio Web</label>
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="Ej: https://minegocio.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Email de Contacto</label>
                    <input
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="contacto@minegocio.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.contactPhone || ''}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Descripción del Negocio</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                    placeholder="Describe a qué se dedica el negocio, sus clientes objetivo y su propuesta de valor..."
                  />
                </div>

                {/* Social links */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Redes Sociales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                        })
                      }
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                      placeholder="Instagram (ej: @minegocio)"
                    />
                    <input
                      type="text"
                      value={formData.socialLinks?.whatsapp || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, whatsapp: e.target.value },
                        })
                      }
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                      placeholder="WhatsApp (ej: +54 9 11 ...)"
                    />
                    <input
                      type="text"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                        })
                      }
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                      placeholder="Facebook (ej: facebook.com/minegocio)"
                    />
                    <input
                      type="text"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                        })
                      }
                      className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
                      placeholder="LinkedIn (ej: linkedin.com/company/...)"
                    />
                  </div>
                </div>

                {/* Products & Services Editor */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Productos o Servicios ({formData.productsOrServices?.length || 0})
                    </h4>
                  </div>

                  {/* Add Product Inline */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                    <span className="text-[11px] font-semibold text-emerald-400 block">Agregar nuevo producto o servicio</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Nombre *"
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        placeholder="Categoría"
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        placeholder="Precio (opcional)"
                        className="rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Descripción breve..."
                        className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold transition-all shrink-0"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </div>
                  </div>

                  {/* List of current products in form */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.productsOrServices?.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200 truncate">{p.name}</span>
                            {p.category && (
                              <span className="rounded-md bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                                {p.category}
                              </span>
                            )}
                            {p.price && <span className="text-emerald-400 font-medium">{p.price}</span>}
                          </div>
                          {p.description && (
                            <p className="text-zinc-500 text-[11px] truncate mt-0.5">{p.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/30"
                  >
                    <Save size={14} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
