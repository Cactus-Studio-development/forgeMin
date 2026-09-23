'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { AEJob, AEJobApplication, AEProfilePhoto, AECVAttachment } from '@/lib/argentina-empleos/types';
import { aeApi } from '@/lib/argentina-empleos/ae-api';
import { AEDocumentViewerModal } from '@/components/argentina-empleos/ui/ae-document-viewer-modal';
import { AEConfirmModal } from '@/components/argentina-empleos/ui/ae-confirm-modal';
import { downloadDocument } from '@/lib/argentina-empleos/file-utils';
import {
  Briefcase,
  PlusCircle,
  MapPin,
  Trash2,
  ExternalLink,
  Loader2,
  EyeOff,
  Users,
  FileText,
  Image as ImageIcon,
  Phone,
  Mail,
  X,
  Eye,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  Download,
  MessageCircle,
  Send,
  MessageSquare,
} from 'lucide-react';

function getWhatsAppUrl(phone?: string, candidateName?: string, jobTitle?: string, company?: string) {
  if (!phone) return null;
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return null;
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (!clean.startsWith('54')) {
    clean = `549${clean}`;
  } else if (clean.startsWith('54') && !clean.startsWith('549') && clean.length <= 12) {
    clean = `549${clean.substring(2)}`;
  }
  const msg = `Hola ${candidateName || ''}, nos comunicamos desde ${company || 'nuestra empresa'} por tu postulación al puesto de "${jobTitle || 'vacante'}" en Argentina Empleos.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function MisPublicacionesPage() {
  const { user, isSuperadmin } = useAEAuth();
  const [jobs, setJobs] = useState<AEJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Applications Drawer / Modal
  const [selectedJobForApps, setSelectedJobForApps] = useState<AEJob | null>(null);
  const [applications, setApplications] = useState<AEJobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Candidate Profile Viewer Modal
  const [selectedCandidateApp, setSelectedCandidateApp] = useState<AEJobApplication | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<AEProfilePhoto | null>(null);
  const [viewingCVDoc, setViewingCVDoc] = useState<AECVAttachment | null>(null);

  // Direct In-App Message Modal to Candidate
  const [messagingApp, setMessagingApp] = useState<AEJobApplication | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const handleOpenSendMessage = (app: AEJobApplication) => {
    setMessagingApp(app);
    setMsgSubject(`Consulta sobre tu postulación: ${selectedJobForApps?.title || 'Vacante'}`);
    setMsgContent(`Hola ${app.candidateName}, revisamos tu postulación y nos gustaría ponernos en contacto para coordinar una entrevista.`);
    setMsgSuccess(false);
    setMsgError(null);
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messagingApp) return;
    if (!msgContent.trim()) {
      setMsgError('Por favor escribe el contenido del mensaje.');
      return;
    }

    setSendingMsg(true);
    setMsgError(null);

    try {
      await aeApi.messages.send(user.id, {
        receiverId: messagingApp.candidateId,
        subject: msgSubject.trim() || undefined,
        content: msgContent.trim(),
        jobId: messagingApp.jobId,
        jobTitle: messagingApp.jobTitle,
      });
      setMsgSuccess(true);
      setTimeout(() => {
        setMessagingApp(null);
        setMsgSuccess(false);
      }, 1500);
    } catch (err: any) {
      setMsgError(err.message || 'Error al enviar el mensaje.');
    } finally {
      setSendingMsg(false);
    }
  };

  const loadMyJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await aeApi.jobs.getMyJobs(user.id);
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyJobs();
    }
  }, [user]);

  // Load applications for a specific job
  const handleOpenApplications = async (job: AEJob) => {
    if (!user) return;
    setSelectedJobForApps(job);
    setLoadingApps(true);
    try {
      const apps = await aeApi.jobs.getApplications(job.id, user.id);
      setApplications(apps || []);
    } catch (err) {
      console.error('Error cargando postulaciones:', err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  const [jobToDelete, setJobToDelete] = useState<AEJob | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);

  const confirmDeleteJob = async () => {
    if (!user || !jobToDelete) return;
    setDeletingJob(true);
    try {
      await aeApi.jobs.deleteJob(jobToDelete.id, user.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      if (selectedJobForApps?.id === jobToDelete.id) {
        setSelectedJobForApps(null);
      }
      setJobToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingJob(false);
    }
  };

  return (
    <AEShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#106EBE]" />
              Mis Publicaciones y Gestión de Candidatos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá tus ofertas laborales, revisá los candidatos postulados, sus CVs adjuntos y sus fotos de perfil.
            </p>
          </div>
          <Link
            href="/argentinaEmpleos/publicar"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-sm shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar Nueva Vacante</span>
          </Link>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando tus publicaciones...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center space-y-3 shadow-2xs">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Aún no creaste ninguna publicación de empleo
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Publicá tu primera oportunidad laboral para recibir candidatos y ver sus perfiles completos.
            </p>
            <Link
              href="/argentinaEmpleos/publicar"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106EBE] text-white text-xs font-bold rounded-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar ahora</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{job.title}</span>
                    <span className="px-2 py-0.5 rounded-xs bg-blue-50 text-[#106EBE] text-[10px] font-bold border border-blue-200">
                      {job.modality}
                    </span>
                    <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {job.employmentType}
                    </span>
                    {job.isAnonymous && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 text-[10px]">
                        <EyeOff className="w-3 h-3" />
                        Anónima
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.cityName}, {job.provinceName}
                    </span>
                    <span>•</span>
                    <span>{job.categoryName}</span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400">
                      Publicado el {new Date(job.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenApplications(job)}
                    className="px-3.5 py-1.5 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold text-xs rounded-sm transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ver Postulaciones</span>
                  </button>

                  <Link
                    href={`/argentinaEmpleos/trabajos/detalle?id=${job.id}`}
                    className="p-2 text-slate-600 hover:text-[#106EBE] hover:bg-slate-100 rounded-sm transition-colors border border-slate-200"
                    title="Ver vacante pública"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setJobToDelete(job)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors border border-slate-200"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Applications List Modal */}
        {selectedJobForApps && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-sm max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#106EBE]" />
                    <span>Postulaciones para {selectedJobForApps.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {applications.length} {applications.length === 1 ? 'candidato postulado' : 'candidatos postulados'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJobForApps(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {loadingApps ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#106EBE] mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Cargando postulaciones...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no hay candidatos postulados para esta vacante.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#106EBE] to-blue-800 text-white flex items-center justify-center font-bold text-sm uppercase overflow-hidden shrink-0">
                            {app.candidatePhotoUrl ? (
                              <img src={app.candidatePhotoUrl} alt={app.candidateName} className="w-full h-full object-cover" />
                            ) : (
                              app.candidateName?.charAt(0) || 'C'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{app.candidateName}</span>
                              {app.candidateHeadline && (
                                <span className="text-[10px] text-slate-500 font-normal">
                                  • {app.candidateHeadline}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {isSuperadmin && app.candidateEmail && !app.candidateEmail.endsWith('@argentinaempleos.local') ? (
                                <span className="font-mono text-[10px] text-slate-600 font-bold">{app.candidateEmail}</span>
                              ) : (
                                <span className="text-emerald-700 font-semibold">Candidato Verificado</span>
                              )}
                              {isSuperadmin && app.candidatePhone && (
                                <span className="font-mono text-[10px]">• {app.candidatePhone}</span>
                              )}
                              <span>• {app.candidateCityName}, {app.candidateProvinceName}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(app.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Message */}
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xs text-xs text-slate-700 leading-relaxed">
                        &quot;{app.message}&quot;
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {app.candidatePhone && selectedJobForApps && (
                            <a
                              href={getWhatsAppUrl(app.candidatePhone, app.candidateName, selectedJobForApps.title, selectedJobForApps.company) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              title="Abrir chat directo de WhatsApp con el candidato"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleOpenSendMessage(app)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xs text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                            title="Enviar mensaje directo por la plataforma"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Mensaje</span>
                          </button>

                          {app.candidateCvAttachment ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setViewingCVDoc(app.candidateCvAttachment!)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xs text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#106EBE]" />
                                <span>Visualizar CV</span>
                              </button>

                              <button
                                onClick={() => downloadDocument(app.candidateCvAttachment!.url, app.candidateCvAttachment!.fileName)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xs text-[11px] font-bold flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Descargar CV</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Sin CV en archivo
                            </span>
                          )}

                          {app.candidatePhotos && app.candidatePhotos.length > 0 && (
                            <button
                              onClick={() => setSelectedCandidateApp(app)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xs text-[11px] font-bold flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                              <span>Ver Galería de Fotos ({app.candidatePhotos.length})</span>
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedCandidateApp(app)}
                          className="px-3 py-1 bg-[#106EBE] hover:bg-[#005A9E] text-white text-[11px] font-bold rounded-xs transition-colors"
                        >
                          Ver Perfil Completo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidate Profile & Social Feed Modal */}
        {selectedCandidateApp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-sm max-w-xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#106EBE] text-white flex items-center justify-center text-base font-black uppercase overflow-hidden">
                    {selectedCandidateApp.candidatePhotoUrl ? (
                      <img src={selectedCandidateApp.candidatePhotoUrl} alt={selectedCandidateApp.candidateName} className="w-full h-full object-cover" />
                    ) : (
                      selectedCandidateApp.candidateName?.charAt(0) || 'C'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {selectedCandidateApp.candidateName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedCandidateApp.candidateHeadline || 'Candidato'} • {selectedCandidateApp.candidateCityName}, {selectedCandidateApp.candidateProvinceName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSendMessage(selectedCandidateApp)}
                    className="px-3 py-1.5 bg-[#106EBE] hover:bg-[#005A9E] text-white text-xs font-bold rounded-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Mensaje</span>
                  </button>
                  <button
                    onClick={() => setSelectedCandidateApp(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contact Info Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xs border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mensajería y Contacto</span>
                  {isSuperadmin && selectedCandidateApp.candidateEmail && !selectedCandidateApp.candidateEmail.endsWith('@argentinaempleos.local') ? (
                    <a href={`mailto:${selectedCandidateApp.candidateEmail}`} className="font-semibold text-[#106EBE] hover:underline flex items-center gap-1 truncate font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedCandidateApp.candidateEmail}</span>
                    </a>
                  ) : (
                    <span className="text-slate-700 font-medium flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#106EBE] shrink-0" />
                      <span>Mensajería en plataforma activa</span>
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xs border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Canal WhatsApp</span>
                    {isSuperadmin && selectedCandidateApp.candidatePhone ? (
                      <span className="font-semibold text-emerald-800 flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{selectedCandidateApp.candidatePhone}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Contacto directo habilitado</span>
                      </span>
                    )}
                  </div>
                  {selectedCandidateApp.candidatePhone && selectedJobForApps && (
                    <a
                      href={getWhatsAppUrl(selectedCandidateApp.candidatePhone, selectedCandidateApp.candidateName, selectedJobForApps.title, selectedJobForApps.company) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs font-bold text-[11px] shadow-2xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Abrir Chat en WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* CV Document Box */}
              {selectedCandidateApp.candidateCvAttachment && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950 block">
                        {selectedCandidateApp.candidateCvAttachment.fileName}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Curriculum Vitae Oficial del Candidato
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewingCVDoc(selectedCandidateApp.candidateCvAttachment!)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xs border border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#106EBE]" />
                      <span>Visualizar CV</span>
                    </button>

                    <button
                      onClick={() => downloadDocument(selectedCandidateApp.candidateCvAttachment!.url, selectedCandidateApp.candidateCvAttachment!.fileName)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xs transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Social Photo Feed of Candidate */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Fotos y Portfolio Social del Candidato</span>
                </h4>

                {selectedCandidateApp.candidatePhotos && selectedCandidateApp.candidatePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedCandidateApp.candidatePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setViewingPhoto(photo)}
                        className="group relative aspect-square rounded-xs overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Foto'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-white p-1.5 text-[10px] truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xs border border-slate-200 text-center">
                    El candidato aún no adjuntó fotos a su perfil social.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Zoom Lightbox */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingPhoto(null)}
          >
            <div
              className="bg-white rounded-sm max-w-2xl w-full overflow-hidden shadow-2xl p-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  {viewingPhoto.caption || 'Foto del Candidato'}
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

        {/* Direct In-App Message Modal */}
        {messagingApp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-sm max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-sm bg-blue-100 text-[#106EBE]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Enviar Mensaje a {messagingApp.candidateName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      El candidato recibirá una notificación y el mensaje en su bandeja de mensajes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMessagingApp(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {msgSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Mensaje enviado exitosamente al candidato!</span>
                </div>
              )}

              {msgError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                  {msgError}
                </div>
              )}

              <form onSubmit={handleSendMessageSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asunto</label>
                  <input
                    type="text"
                    value={msgSubject}
                    onChange={(e) => setMsgSubject(e.target.value)}
                    placeholder="Ej: Entrevista para la vacante..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mensaje *</label>
                  <textarea
                    rows={4}
                    required
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="Escribe el mensaje para el postulante..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm text-slate-900 focus:bg-white focus:border-[#106EBE] focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMessagingApp(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg || !msgContent.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#106EBE] hover:bg-[#005A9E] text-white font-bold rounded-sm transition-colors shadow-xs"
                  >
                    {sendingMsg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AEConfirmModal
          isOpen={Boolean(jobToDelete)}
          onClose={() => setJobToDelete(null)}
          onConfirm={confirmDeleteJob}
          loading={deletingJob}
          title="¿Eliminar esta publicación de empleo?"
          description="Esta publicación se eliminará permanentemente. Los postulantes ya no podrán verla ni enviar solicitudes."
          confirmText="Sí, eliminar publicación"
          cancelText="Cancelar"
          itemDetails={
            jobToDelete
              ? {
                  title: jobToDelete.title,
                  subtitle: `${jobToDelete.company} • ${jobToDelete.cityName}, ${jobToDelete.provinceName}`,
                  badge: jobToDelete.modality,
                }
              : undefined
          }
        />
      </div>
    </AEShell>
  );
}
