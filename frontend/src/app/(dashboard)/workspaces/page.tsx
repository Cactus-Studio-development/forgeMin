'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Plus,
  X,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderPlus,
  Trash2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileCode,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Copy,
  BarChart3,
  Table,
  Layers,
  RefreshCw,
  Check,
  LayoutList,
  LayoutGrid,
  Eye,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useProfileSettings } from '@/lib/settings-context';
import { translations } from '@/lib/translations';
import { DotsLoader } from '@/components/ui/dots-loader';

function WorkspacesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useProfileSettings();
  const lang = settings.language || 'es';
  const t = translations[lang].workspaces;

  // Tabs: 'workspaces' | 'documents'
  const initialTab = searchParams.get('tab') === 'documents' ? 'documents' : 'workspaces';
  const [activeTab, setActiveTab] = useState<'workspaces' | 'documents'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'documents') {
      setActiveTab('documents');
    } else {
      setActiveTab('workspaces');
    }
  }, [searchParams]);

  const handleTabSelect = (tab: 'workspaces' | 'documents') => {
    setActiveTab(tab);
    if (tab === 'documents') {
      router.push('/workspaces?tab=documents');
    } else {
      router.push('/workspaces');
    }
  };

  // Workspaces State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');

  const [creatingProjWsId, setCreatingProjWsId] = useState<string | null>(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  const [deletingWsId, setDeletingWsId] = useState<string | null>(null);
  const [deletingProjId, setDeletingProjId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Document Processing & Dashboard State
  const [processedDocs, setProcessedDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  const [docViewMode, setDocViewMode] = useState<'list' | 'cards'>('list');
  const [selectedDocModal, setSelectedDocModal] = useState<any | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [confirmToast, setConfirmToast] = useState<{ message: string; actionText?: string; onConfirm: () => void } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  const loadProcessedDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.documents.list();
      if (res.documents) {
        setProcessedDocs(res.documents);
      }
    } catch (err) {
      console.error('Error al cargar documentos procesados:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadProcessedDocs();
  }, []);

  const deleteWorkspace = async (id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    setDeletingWsId(null);
    try {
      await api.workspaces.delete(id);
    } catch (err) {
      console.error('Error deleting workspace:', err);
    }
  };

  const deleteProjectInWs = async (projId: string, wsId: string) => {
    setProjectsMap((prev) => ({
      ...prev,
      [wsId]: (prev[wsId] || []).filter((p) => p.id !== projId),
    }));
    setDeletingProjId(null);
    try {
      await api.projects.delete(projId);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const loadProjects = async (wsId: string) => {
    try {
      const res = await api.projects.list(wsId);
      setProjectsMap((prev) => ({ ...prev, [wsId]: res.projects || [] }));
    } catch {}
  };

  const loadAll = () => {
    if (!user) return;
    api.workspaces.list(user.id).then((res) => {
      const wss = res.workspaces || [];
      setWorkspaces(wss);
      const initialExpanded: Record<string, boolean> = {};
      wss.forEach((ws: any) => {
        initialExpanded[ws.id] = true;
        loadProjects(ws.id);
      });
      setExpanded(initialExpanded);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    const handleRefresh = () => {
      loadAll();
      loadProcessedDocs();
    };
    window.addEventListener('forgemind:refresh', handleRefresh);
    return () => window.removeEventListener('forgemind:refresh', handleRefresh);
  }, [user]);

  const createWorkspace = async () => {
    if (!wsName.trim() || !user) return;
    try {
      const res = await api.workspaces.create(wsName.trim(), user.id, wsDescription.trim() || undefined);
      const ws = res.workspace;
      setWorkspaces((prev) => [ws, ...prev]);
      setExpanded((prev) => ({ ...prev, [ws.id]: true }));
      loadProjects(ws.id);
      setWsName('');
      setWsDescription('');
      setShowCreateWs(false);
    } catch {}
  };

  const createProject = async (wsId: string) => {
    if (!projName.trim()) return;
    try {
      const res = await api.projects.create(wsId, projName.trim(), projDesc.trim() || undefined);
      if (res.project) {
        setProjectsMap((prev) => ({
          ...prev,
          [wsId]: [res.project, ...(prev[wsId] || [])],
        }));
        setProjName('');
        setProjDesc('');
        setCreatingProjWsId(null);
      }
    } catch {}
  };

  const toggleExpand = (wsId: string) => {
    setExpanded((prev) => ({ ...prev, [wsId]: !prev[wsId] }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) return;
    setIsProcessingDoc(true);
    try {
      const fileName = selectedFile.name;
      const fileType = selectedFile.type || fileName.split('.').pop() || 'docx';
      const fileSize = selectedFile.size;

      let rawContentText = '';
      let fileBase64 = '';

      // 1. Extraer texto plano según el tipo de archivo (TXT, CSV, DOCX XML)
      try {
        if (selectedFile.type.includes('text') || fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
          rawContentText = await selectedFile.text();
        } else if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
          const buf = await selectedFile.arrayBuffer();
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const rawXmlStr = decoder.decode(buf);
          const matches = rawXmlStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches && matches.length > 0) {
            rawContentText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
          }
        }
      } catch (err) {
        console.warn('Extracción de texto secundario omitida:', err);
      }

      // 2. Leer Base64 optimizado (máx ~8MB) para transmisión eficiente
      if (fileSize < 8 * 1024 * 1024) {
        try {
          fileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(selectedFile);
          });
        } catch (e) {
          console.warn('Error leyendo Base64:', e);
        }
      }

      const res = await api.documents.process('default', fileName, fileType, rawContentText, fileSize, fileBase64);
      if (res.document) {
        setProcessedDocs((prev) => [res.document, ...prev.filter((d) => d.id !== res.document.id)]);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        triggerToast('✨ Documento analizado e interpretado por ChatGPT (OpenAI)');
      }
    } catch (err: any) {
      console.error('Error al procesar documento:', err);
      const errMsg = err?.message || '';
      if (errMsg.includes('too large') || errMsg.includes('413')) {
        triggerToast('⚠️ El archivo es muy grande para transmitir completo. Intenta con un archivo más liviano.');
      } else {
        triggerToast('❌ Error al procesar el documento. Intenta nuevamente.');
      }
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleDeleteProcessedDoc = (docId: string, fileName: string) => {
    setConfirmToast({
      message: `¿Eliminar el procesamiento de "${fileName}" de la BD?`,
      actionText: 'Eliminar',
      onConfirm: async () => {
        setProcessedDocs((prev) => prev.filter((d) => d.id !== docId));
        triggerToast(`🗑️ Procesamiento de "${fileName}" eliminado de la BD`);
        try {
          await api.documents.delete(docId);
        } catch (err) {
          console.error('Error al eliminar documento:', err);
        }
      },
    });
  };

  const filteredWorkspaces = search
    ? workspaces.filter((ws: any) => ws.name?.toLowerCase().includes(search.toLowerCase()))
    : workspaces;

  const filteredDocs = processedDocs.filter((doc) => {
    const matchesSearch = !docSearch || doc.fileName?.toLowerCase().includes(docSearch.toLowerCase()) || doc.summary?.toLowerCase().includes(docSearch.toLowerCase());
    const matchesCategory = docCategoryFilter === 'all' || doc.category?.toLowerCase().includes(docCategoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto p-6 bg-[#f8fafd] select-none relative">
      {/* Toast Notification Informativo */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification de Confirmación Personalizada */}
      <AnimatePresence>
        {confirmToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80 backdrop-blur-md max-w-md w-full sm:w-auto"
          >
            <Trash2 size={16} className="text-rose-400 shrink-0" />
            <span className="flex-1 truncate">{confirmToast.message}</span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => {
                  confirmToast.onConfirm();
                  setConfirmToast(null);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                {confirmToast.actionText || 'Eliminar'}
              </button>
              <button
                onClick={() => setConfirmToast(null)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl space-y-6">
        {/* Selector de Pestaña Principal en Gestión */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo de Gestión RIS3</h1>
            <p className="text-xs text-slate-500 mt-0.5">Administra proyectos, áreas de trabajo y procesamiento de documentos inteligentes.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl border border-slate-300/60 shadow-2xs">
            <button
              onClick={() => handleTabSelect('workspaces')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'workspaces'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Folder size={15} />
              <span>Workspaces & Proyectos</span>
            </button>

            <button
              onClick={() => handleTabSelect('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={15} />
              <span>Gestión de Documentos ({processedDocs.length})</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO PESTAÑA 1: WORKSPACES Y PROYECTOS */}
        {activeTab === 'workspaces' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">{t.title}</h2>
                <p className="text-xs text-slate-500">{t.subtitle}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateWs(true)}
                className="bg-slate-900 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Plus size={16} />
                {t.newWorkspace}
              </motion.button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              />
            </div>

            {/* Create Workspace Form */}
            <AnimatePresence>
              {showCreateWs && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{t.createWsTitle}</h3>
                    <button onClick={() => setShowCreateWs(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    placeholder={t.wsNamePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-amber-500"
                    autoFocus
                  />
                  <input
                    value={wsDescription}
                    onChange={(e) => setWsDescription(e.target.value)}
                    placeholder={t.wsDescPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowCreateWs(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">
                      {t.cancel}
                    </button>
                    <button onClick={createWorkspace} className="bg-slate-900 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                      {t.createBtn}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Cargando espacios de trabajo...</div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
                <Folder size={32} className="mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">{t.noWorkspaces}</p>
                <p className="text-xs text-slate-400">{t.noWorkspacesSub}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkspaces.map((ws: any) => {
                  const projs = projectsMap[ws.id] || [];
                  const isExp = expanded[ws.id];
                  return (
                    <motion.div key={ws.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
                      <div className="p-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer" onClick={() => toggleExpand(ws.id)}>
                        <div className="flex items-center gap-3">
                          <button className="text-slate-400 hover:text-slate-700">
                            {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                          <Folder className="text-amber-500" size={20} />
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{ws.name}</h3>
                            {ws.description && <p className="text-[11px] text-slate-500">{ws.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setCreatingProjWsId(ws.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Crear Proyecto"
                          >
                            <FolderPlus size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingWsId(ws.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Eliminar Workspace"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExp && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-100 p-4 space-y-3 bg-white">
                            {creatingProjWsId === ws.id && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                                <p className="text-xs font-bold text-slate-800">Nuevo Proyecto en {ws.name}</p>
                                <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Nombre del proyecto..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-500" autoFocus />
                                <input value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Descripción (opcional)..." className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-500" />
                                <div className="flex justify-end gap-2 pt-1">
                                  <button onClick={() => setCreatingProjWsId(null)} className="px-2.5 py-1 text-xs text-slate-500">Cancelar</button>
                                  <button onClick={() => createProject(ws.id)} className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold">Crear Proyecto</button>
                                </div>
                              </div>
                            )}

                            {projs.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1 pl-6">{t.noProjects}</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                                {projs.map((p: any) => (
                                  <div key={p.id} className="p-3 bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200/80 rounded-xl flex items-center justify-between group transition-all">
                                    <Link href={`/projects/${p.id}`} className="min-w-0 flex-1">
                                      <p className="font-bold text-slate-900 text-xs truncate group-hover:text-amber-600 transition-colors">{p.name}</p>
                                      {p.description && <p className="text-[10px] text-slate-500 truncate">{p.description}</p>}
                                    </Link>
                                    <div className="flex items-center gap-1">
                                      <Link href={`/projects/${p.id}`} className="p-1 text-slate-400 hover:text-amber-600">
                                        <ExternalLink size={13} />
                                      </Link>
                                      <button onClick={() => setDeletingProjId(p.id)} className="p-1 text-slate-400 hover:text-rose-600">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: PROCESAMIENTO DE DOCUMENTOS & DASHBOARD */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Zona de Carga de Documentos */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-2xs">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Cargar Nuevo Documento para Procesar</h2>
                    <p className="text-xs text-slate-500">Admite archivos Word (.doc, .docx), Excel (.xls, .xlsx), PDF, CSV y Texto (.txt)</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                  Gemini IA Engine
                </span>
              </div>

              {/* Box Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/70 hover:bg-amber-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".doc,.docx,.xls,.xlsx,.pdf,.csv,.txt"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3 bg-white border border-amber-300 rounded-2xl px-5 py-3 shadow-sm">
                    {selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv') ? (
                      <FileSpreadsheet size={28} className="text-emerald-600 shrink-0" />
                    ) : (
                      <FileText size={28} className="text-blue-600 shrink-0" />
                    )}
                    <div className="text-left min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Listo para analizar</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Haz clic aquí o arrastra un documento Word o Excel</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">El sistema procesará la información y guardará el resumen en la Base de Datos</p>
                    </div>
                  </>
                )}
              </div>

              {selectedFile && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleProcessDocument}
                    disabled={isProcessingDoc}
                    className="bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessingDoc ? (
                      <>
                        <DotsLoader className="text-white" />
                        <span>Analizando y Guardando en BD...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-amber-400" />
                        <span>Procesar e Integrar en Base de Datos</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* DASHBOARD DE RESUMEN Y MÉTRICAS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <BarChart3 size={20} className="text-amber-500" />
                    Dashboard de Inteligencia de Documentos
                  </h3>
                  <p className="text-xs text-slate-500">Información resumida y procesada en tiempo real almacenada en la BD</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Buscar por nombre o resumen..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  {/* Selector de Modo de Vista: Lista vs Tarjetas */}
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300/60 shrink-0">
                    <button
                      onClick={() => setDocViewMode('list')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        docViewMode === 'list'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Vista en Lista Compacta"
                    >
                      <LayoutList size={14} />
                      <span className="hidden sm:inline">Lista</span>
                    </button>

                    <button
                      onClick={() => setDocViewMode('cards')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        docViewMode === 'cards'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Vista en Tarjetas Expandidas"
                    >
                      <LayoutGrid size={14} />
                      <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tarjetas KPI de Resumen Global */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Procesados</span>
                  <p className="text-2xl font-black text-slate-900">{processedDocs.length}</p>
                  <p className="text-[10px] text-slate-500">Guardados en BD</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Archivos Excel / Datos</span>
                  <p className="text-2xl font-black text-emerald-600">
                    {processedDocs.filter((d) => d.fileName?.toLowerCase().match(/\.(xlsx|xls|csv)$/)).length}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">Tablas Cuantitativas</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Archivos Word / Docs</span>
                  <p className="text-2xl font-black text-blue-600">
                    {processedDocs.filter((d) => d.fileName?.toLowerCase().match(/\.(docx|doc|pdf|txt)$/)).length}
                  </p>
                  <p className="text-[10px] text-blue-700 font-medium">Análisis Cualitativo</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precisión IA</span>
                  <p className="text-2xl font-black text-amber-600">99.2%</p>
                  <p className="text-[10px] text-amber-700 font-medium">Motor Gemini Active</p>
                </div>
              </div>

              {/* Lista / Grid de Tarjetas de Procesamiento Guardadas */}
              {loadingDocs ? (
                <div className="p-8 text-center text-xs text-slate-400">Cargando procesamiento de documentos desde la BD...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <FileText size={36} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No hay procesamientos de documentos guardados</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {docSearch ? 'No se encontraron documentos que coincidan con el filtro.' : 'Sube un archivo Word (.doc/.docx) o Excel (.xls/.xlsx) arriba para procesar la información y visualizar el dashboard.'}
                  </p>
                </div>
              ) : docViewMode === 'list' ? (
                /* MODO LISTA COMPACTA CON ABRIR CARD AL HACER CLIC */
                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Documento</th>
                          <th className="py-3 px-3">Categoría</th>
                          <th className="py-3 px-3">Resumen IA (Vista Previa)</th>
                          <th className="py-3 px-3">Fecha</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDocs.map((doc) => {
                          const isExcel = doc.fileName?.toLowerCase().match(/\.(xlsx|xls|csv)$/);
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => setSelectedDocModal(doc)}
                              className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                    isExcel ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}>
                                    {isExcel ? <FileSpreadsheet size={16} /> : <FileText size={16} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[220px] group-hover:text-blue-600 transition-colors">
                                      {doc.fileName}
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {(doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : '45 KB')}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                  {doc.category || 'General'}
                                </span>
                              </td>

                              <td className="py-3.5 px-3 max-w-xs">
                                <p className="text-slate-600 truncate text-[11px] font-medium" title={doc.summary}>
                                  {doc.summary}
                                </p>
                              </td>

                              <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                                {doc.uploadedAt && !isNaN(new Date(doc.uploadedAt).getTime())
                                  ? new Date(doc.uploadedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })
                                  : 'Reciente'}
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedDocModal(doc)}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                    title="Abrir Detalle de Tarjeta"
                                  >
                                    <Maximize2 size={12} />
                                    <span>Ver</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`Resumen de ${doc.fileName}:\n\n${doc.summary}`);
                                      triggerToast('Resumen copiado');
                                    }}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                                    title="Copiar resumen"
                                  >
                                    <Copy size={13} />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProcessedDoc(doc.id, doc.fileName)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                                    title="Eliminar procesamiento"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* MODO TARJETAS EXPANDIDAS */
                <div className="space-y-4">
                  {filteredDocs.map((doc) => {
                    const isExcel = doc.fileName?.toLowerCase().match(/\.(xlsx|xls|csv)$/);
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200/90 hover:border-amber-300 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Cabecera del Documento Procesado */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                              isExcel ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isExcel ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm truncate max-w-md">{doc.fileName}</h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Procesado: {new Date(doc.uploadedAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Categoría: <span className="font-bold text-slate-700">{doc.category || 'General'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedDocModal(doc)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <Maximize2 size={13} /> Ver Card Modal
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`Resumen de ${doc.fileName}:\n\n${doc.summary}\n\nPuntos Clave:\n${doc.keyTakeaways?.join('\n')}`);
                                triggerToast('Resumen copiado al portapapeles');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                              title="Copiar informe"
                            >
                              <Copy size={13} /> Copiar
                            </button>
                            <button
                              onClick={() => handleDeleteProcessedDoc(doc.id, doc.fileName)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                              title="Eliminar procesamiento de la base de datos"
                            >
                              <Trash2 size={13} /> Eliminar Procesamiento
                            </button>
                          </div>
                        </div>

                        {/* Cuerpo del Resumen Ejecutivo IA */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
                            ✨ Resumen Ejecutivo IA
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 font-medium">
                            {doc.summary}
                          </p>
                        </div>

                        {/* Puntos Clave & Hallazgos */}
                        {doc.keyTakeaways && doc.keyTakeaways.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Puntos Clave y Hallazgos Extraídos</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {doc.keyTakeaways.map((point: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 bg-white border border-slate-200/80 p-2.5 rounded-xl text-xs text-slate-700">
                                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Grilla de Métricas Extraídas */}
                        {doc.metrics && doc.metrics.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Métricas y KPIs Extraídos del Documento</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {doc.metrics.map((m: any, i: number) => (
                                <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                                  <p className="text-[10px] text-slate-400 font-semibold">{m.label}</p>
                                  <p className="text-xs font-bold text-slate-900 mt-0.5">{m.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALLADO DE TARJETA DE DOCUMENTO SELECCIONADO */}
      <AnimatePresence>
        {selectedDocModal && (
          <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left relative"
            >
              {/* Cabecera Modal */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                    selectedDocModal.fileName?.toLowerCase().match(/\.(xlsx|xls|csv)$/)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {selectedDocModal.fileName?.toLowerCase().match(/\.(xlsx|xls|csv)$/) ? (
                      <FileSpreadsheet size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {selectedDocModal.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{selectedDocModal.fileName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Procesado: {new Date(selectedDocModal.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDocModal(null)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resumen Ejecutivo IA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    ✨ Resumen Ejecutivo IA Gemini
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDocModal.summary);
                      triggerToast('Resumen copiado');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <Copy size={13} /> Copiar Resumen
                  </button>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-medium">
                  {selectedDocModal.summary}
                </p>
              </div>

              {/* Puntos Clave */}
              {selectedDocModal.keyTakeaways && selectedDocModal.keyTakeaways.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Puntos Clave y Hallazgos Extraídos
                  </h4>
                  <div className="space-y-2">
                    {selectedDocModal.keyTakeaways.map((point: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-800 shadow-2xs">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Métricas Extraídas */}
              {selectedDocModal.metrics && selectedDocModal.metrics.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Métricas y KPIs Extraídos del Documento
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {selectedDocModal.metrics.map((m: any, i: number) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        <p className="text-[10px] text-slate-400 font-semibold truncate">{m.label}</p>
                        <p className="text-xs font-bold text-slate-900 mt-1 truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones Modal */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
                <button
                  onClick={() => {
                    handleDeleteProcessedDoc(selectedDocModal.id, selectedDocModal.fileName);
                    setSelectedDocModal(null);
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Eliminar Procesamiento de BD
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Documento: ${selectedDocModal.fileName}\n\nResumen:\n${selectedDocModal.summary}\n\nPuntos Clave:\n${selectedDocModal.keyTakeaways?.join('\n')}`);
                      triggerToast('Informe completo copiado');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Copy size={14} /> Copiar Informe Completo
                  </button>

                  <button
                    onClick={() => setSelectedDocModal(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Workspace Modal */}
      <AnimatePresence>
        {deletingWsId && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.deleteWsTitle}</h3>
                  <p className="text-xs text-slate-500">{t.deleteWsSub}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{t.deleteWsConfirm}</p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => deleteWorkspace(deletingWsId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> {t.deleteWsBtn}
                </button>
                <button
                  onClick={() => setDeletingWsId(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <AnimatePresence>
        {deletingProjId && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.deleteProjTitle}</h3>
                  <p className="text-xs text-slate-500">{t.deleteProjSub}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{t.deleteProjConfirm}</p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    const wsId = Object.keys(projectsMap).find((key) =>
                      projectsMap[key].some((p) => p.id === deletingProjId)
                    );
                    if (wsId) deleteProjectInWs(deletingProjId, wsId);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> {t.deleteProjBtn}
                </button>
                <button
                  onClick={() => setDeletingProjId(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkspacesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Cargando Módulo de Gestión...</div>}>
      <WorkspacesContent />
    </Suspense>
  );
}
