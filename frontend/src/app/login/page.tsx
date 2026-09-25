'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { DeerIcon } from '@/components/ui/deer-icon';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Store,
  Briefcase,
  Search,
  PlusCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileText,
  Users,
  Code2,
  Crown,
  ShieldCheck,
  Wallet,
  MessageSquare,
  Sparkles,
  Layers,
  UserCheck,
  User,
  Phone,
  Check,
  Cctv,
} from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4 | 5;
type Destination = 'ris3' | 'mercado' | 'monitoreo';
type AuthMode = 'email-login' | 'oauth' | 'email-register';
type RegisterSubStep = 1 | 2 | 3;

export default function LoginPage() {
  const { loginWithGoogle, loginWithGithub, loginWithFacebook, loginWithEmail, registerWithEmail, user, loading, setAppMode } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [dest, setDest] = useState<Destination>('ris3');
  const [selectedProfile, setSelectedProfile] = useState<string>('management');
  const [authMode, setAuthMode] = useState<AuthMode>('email-login');

  // RIS3 Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration Multi-part State
  const [regStep, setRegStep] = useState<RegisterSubStep>(1);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      const hasCompleted = typeof window !== 'undefined' ? localStorage.getItem('has_completed_onboarding') : null;
      if (hasCompleted === 'true') {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    if (authMode === 'email-register') {
      if (!fullName.trim()) {
        setError('Por favor ingresa tu nombre completo.');
        setRegStep(1);
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        setRegStep(2);
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        setRegStep(2);
        return;
      }
      if (!termsAccepted) {
        setError('Debes aceptar los términos de servicio para continuar.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      if (authMode === 'email-login') {
        await loginWithEmail(email.trim(), password.trim());
      } else {
        await registerWithEmail(email.trim(), password.trim());
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_full_name', fullName.trim());
          localStorage.setItem('user_company', companyName.trim());
          localStorage.setItem('user_phone', phone.trim());
        }
      }

      // Save selected profile mode
      if (dest === 'ris3' && ['founder', 'management', 'dev'].includes(selectedProfile)) {
        setAppMode(selectedProfile as any);
      }

      router.push('/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(err.message || 'Error de autenticación.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    setError(null);
    setStep((prev) => Math.min(prev + 1, 5) as WizardStep);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none font-sans">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0070F2] via-[#0A6ED1] to-[#0284C7]" />

      {/* Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between py-3 border-b border-[#D9E1E8] mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#0070F2] rounded-lg flex items-center justify-center text-white shadow-xs">
            <DeerIcon size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-[#1C2D42] tracking-wide block leading-none">RIS3</span>
            <span className="text-[11px] text-[#556B82] font-medium">
              {dest === 'ris3' ? 'Gestión de Negocios' : 'Mercado de Oportunidades'}
            </span>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CBD5E1] shadow-2xs text-xs font-semibold text-[#556B82]">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === i
                    ? 'bg-[#0070F2] w-5'
                    : step > i
                    ? 'bg-[#0284C7]'
                    : 'bg-[#D9E1E8]'
                }`}
              />
            ))}
          </div>
          <span className="ml-1.5 text-[11px] text-[#1C2D42] font-bold">Paso {step} de 5</span>
        </div>
      </header>

      {/* Main Step Container */}
      <main className="max-w-3xl mx-auto w-full my-auto py-2">
        <AnimatePresence mode="wait">

          {/* ============================================================ */}
          {/* STEP 1: DESTINATION SELECTION                                */}
          {/* ============================================================ */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center max-w-lg mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2D42]">
                  ¿Qué deseas hacer hoy?
                </h1>
                <p className="text-sm text-[#556B82] mt-1.5">
                  Selecciona el entorno de trabajo al que deseas ingresar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Option A: RIS3 Business Management */}
                <div
                  onClick={() => {
                    setDest('ris3');
                    setSelectedProfile('management');
                    nextStep();
                  }}
                  className="bg-white border-2 border-[#D9E1E8] hover:border-[#0070F2] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Briefcase size={22} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#1C2D42]">
                        Gestión de Negocio
                      </h3>
                      <span className="text-[10px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2 py-0.5 rounded">
                        RIS3
                      </span>
                    </div>
                    <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
                      Administración comercial, radar territorial, propuestas con IA y control de proyectos.
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0070F2] group-hover:text-[#0A6ED1]">
                    <span>Ingresar al sistema</span>
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Option B: Argentina Empleos */}
                <div
                  onClick={() => {
                    setDest('mercado');
                    setSelectedProfile('talent');
                    nextStep();
                  }}
                  className="bg-white border-2 border-[#D9E1E8] hover:border-[#0284C7] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Store size={22} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#1C2D42]">
                        Argentina Empleos
                      </h3>
                      <span className="text-[10px] font-bold text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
                        Mercado
                      </span>
                    </div>
                    <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
                      Bolsa de trabajo, contratación de servicios técnicos y publicación de ofertas laborales.
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:text-[#0369A1]">
                    <span>Ingresar al portal</span>
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Option C: MONITOREO */}
                <div
                  onClick={() => {
                    router.push('/monitor/dashboard');
                  }}
                  className="bg-white border-2 border-[#D9E1E8] hover:border-[#0070F2] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0070F2] border border-blue-200 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Cctv size={22} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#1C2D42]">
                        MONITOREO
                      </h3>
                      <span className="text-[10px] font-bold text-[#0070F2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Visión IA
                      </span>
                    </div>
                    <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
                      Monitoreo operacional de cámaras IP, conteo de personas, flujo por zonas y alertas.
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0070F2] group-hover:text-[#0A6ED1]">
                    <span>Ir a Monitoreo</span>
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: TOOLS & CAPABILITIES OVERVIEW                        */}
          {/* ============================================================ */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0070F2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver</span>
                </button>

                <span className="text-[11px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2.5 py-0.5 rounded">
                  {dest === 'ris3' ? 'Funcionalidades RIS3' : 'Funcionalidades del Mercado'}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C2D42]">
                  {dest === 'ris3'
                    ? 'Herramientas del Sistema de Gestión'
                    : 'Herramientas del Mercado de Oportunidades'}
                </h2>
                <p className="text-xs text-[#556B82] mt-1">
                  {dest === 'ris3'
                    ? 'Todo lo que necesitas para operar, prospectar y dirigir tu empresa en una sola plataforma.'
                    : 'Un ecosistema ágil para conectar talento con ofertas y servicios profesionales.'}
                </p>
              </div>

              {/* Grid of Tools */}
              {dest === 'ris3' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center shrink-0 mt-0.5">
                      <Compass size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Radar Territorial</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Mapeo inteligente de empresas y detección de oportunidades por zona geográfica.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Propuestas con IA</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Generación y edición automática de propuestas comerciales y cotizaciones técnicas.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center shrink-0 mt-0.5">
                      <Layers size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Workspaces & Proyectos</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Organización de entregables, objetivos de equipo y repositorio de documentos.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center shrink-0 mt-0.5">
                      <Users size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Directorio de Leads</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Base de contactos calificados, emails verificados y seguimiento comercial.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                      <Search size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Directorio de Empleos</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Vacantes clasificadas por provincia, ciudad y modalidad (remoto o presencial).</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                      <PlusCircle size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Publicación Rápida</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Publica solicitudes de contratación o búsqueda de proveedores de servicios.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Billetera Digital</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Gestión de créditos para postulaciones y servicios sin tarifas ocultas.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C2D42]">Mensajes & Contacto</h4>
                      <p className="text-[11px] text-[#556B82] mt-0.5">Bandeja de comunicación directa entre postulantes y reclutadores.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#EEF2F6] flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-[#0070F2] hover:bg-[#0A6ED1] text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span>Ver Perfiles Personalizados</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: CUSTOM PROFILES SELECTION                            */}
          {/* ============================================================ */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0070F2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver</span>
                </button>

                <span className="text-[11px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2.5 py-0.5 rounded">
                  Perfiles a Medida
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C2D42]">
                  ¿Cuál es tu rol o perfil?
                </h2>
                <p className="text-xs text-[#556B82] mt-1">
                  La interfaz se adaptará automáticamente a las prioridades de tu perfil.
                </p>
              </div>

              {/* Profiles List */}
              {dest === 'ris3' ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedProfile('founder')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedProfile === 'founder'
                        ? 'border-[#0070F2] bg-[#F0F7FF]'
                        : 'border-[#EEF2F6] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0070F2] flex items-center justify-center shrink-0">
                        <Crown size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C2D42]">Perfil Fundador / Dirección</h4>
                        <p className="text-[11px] text-[#556B82] mt-0.5">Visión ejecutiva de ventas, prospección de leads y reportes financieros.</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className={selectedProfile === 'founder' ? 'text-[#0070F2]' : 'text-[#D9E1E8]'} />
                  </div>

                  <div
                    onClick={() => setSelectedProfile('management')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedProfile === 'management'
                        ? 'border-[#0070F2] bg-[#F0F7FF]'
                        : 'border-[#EEF2F6] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0070F2] flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C2D42]">Perfil Gestión & Proyectos</h4>
                        <p className="text-[11px] text-[#556B82] mt-0.5">Coordinación de workspaces, gestión de documentos y radar territorial.</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className={selectedProfile === 'management' ? 'text-[#0070F2]' : 'text-[#D9E1E8]'} />
                  </div>

                  <div
                    onClick={() => setSelectedProfile('dev')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedProfile === 'dev'
                        ? 'border-[#0070F2] bg-[#F0F7FF]'
                        : 'border-[#EEF2F6] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0070F2] flex items-center justify-center shrink-0">
                        <Code2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C2D42]">Perfil Técnico / Desarrollador</h4>
                        <p className="text-[11px] text-[#556B82] mt-0.5">Integración con repositorios de código, análisis técnico e IA aplicada.</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className={selectedProfile === 'dev' ? 'text-[#0070F2]' : 'text-[#D9E1E8]'} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedProfile('talent')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedProfile === 'talent'
                        ? 'border-[#0284C7] bg-[#F0F9FF]'
                        : 'border-[#EEF2F6] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C2D42]">Profesional / Candidato</h4>
                        <p className="text-[11px] text-[#556B82] mt-0.5">Busco vacantes laborales, contratos o prestar servicios especializados.</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className={selectedProfile === 'talent' ? 'text-[#0284C7]' : 'text-[#D9E1E8]'} />
                  </div>

                  <div
                    onClick={() => setSelectedProfile('employer')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedProfile === 'employer'
                        ? 'border-[#0284C7] bg-[#F0F9FF]'
                        : 'border-[#EEF2F6] bg-[#F8FAFC] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1C2D42]">Empresa / Contratante</h4>
                        <p className="text-[11px] text-[#556B82] mt-0.5">Deseo publicar ofertas de empleo o cotizar servicios profesionales.</p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className={selectedProfile === 'employer' ? 'text-[#0284C7]' : 'text-[#D9E1E8]'} />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#EEF2F6] flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-[#0070F2] hover:bg-[#0A6ED1] text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span>Continuar al Inicio de Sesión</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: AUTHENTICATION METHOD SELECTION                      */}
          {/* ============================================================ */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0070F2] rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a perfiles</span>
                </button>

                <span className="text-[11px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2.5 py-0.5 rounded">
                  {dest === 'ris3' ? 'Acceso Gestión' : 'Acceso Mercado'}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1C2D42]">
                  ¿Cómo deseas ingresar?
                </h2>
                <p className="text-xs text-[#556B82] mt-1">
                  Elige el método de acceso para tu perfil de{' '}
                  <span className="font-bold text-[#0070F2]">
                    {selectedProfile === 'founder' && 'Fundador / Dirección'}
                    {selectedProfile === 'management' && 'Gestión & Proyectos'}
                    {selectedProfile === 'dev' && 'Técnico / Desarrollador'}
                    {selectedProfile === 'talent' && 'Profesional / Candidato'}
                    {selectedProfile === 'employer' && 'Empresa / Contratante'}
                  </span>.
                </p>
              </div>

              {dest === 'ris3' ? (
                <>
                  {/* Two Main Method Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Card 1: Email Login */}
                    <div
                      onClick={() => {
                        setAuthMode('email-login');
                        nextStep();
                      }}
                      className="p-5 rounded-xl border-2 border-[#D9E1E8] hover:border-[#0070F2] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Mail size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-[#1C2D42]">
                          Correo Electrónico
                        </h3>
                        <p className="text-[11px] text-[#556B82] mt-1 leading-relaxed">
                          Ingresa con tu correo y contraseña corporativa registrada.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0070F2]">
                        <span>Entrar con correo</span>
                        <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 2: Role-based OAuth */}
                    <div
                      onClick={() => {
                        setAuthMode('oauth');
                        nextStep();
                      }}
                      className="p-5 rounded-xl border-2 border-[#D9E1E8] hover:border-[#0070F2] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          {selectedProfile === 'dev' && <Code2 size={20} />}
                          {selectedProfile === 'management' && <ShieldCheck size={20} />}
                          {selectedProfile === 'founder' && <Crown size={20} />}
                        </div>
                        <h3 className="text-sm font-bold text-[#1C2D42]">
                          {selectedProfile === 'dev' && 'Cuenta GitHub'}
                          {selectedProfile === 'management' && 'Cuenta Google'}
                          {selectedProfile === 'founder' && 'Google o Facebook'}
                        </h3>
                        <p className="text-[11px] text-[#556B82] mt-1 leading-relaxed">
                          {selectedProfile === 'dev' && 'Autenticación técnica para sincronizar repositorios.'}
                          {selectedProfile === 'management' && 'Acceso corporativo para gestión y documentos con Google.'}
                          {selectedProfile === 'founder' && 'Acceso ejecutivo para radar de negocios y leads.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0070F2]">
                        <span>Autenticación directa</span>
                        <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>

                  {/* Separate Create Account Link */}
                  <div className="pt-3 border-t border-[#EEF2F6] text-center">
                    <p className="text-xs text-[#556B82]">
                      ¿Aún no tienes una cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('email-register');
                          nextStep();
                        }}
                        className="text-[#0070F2] font-bold hover:underline cursor-pointer"
                      >
                        Crear una cuenta nueva
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] text-xs text-[#0369A1]">
                    El Mercado utiliza autenticación independiente de Google para postulaciones y publicaciones.
                  </div>

                  <Link
                    href={`/argentinaEmpleos/login?role=${selectedProfile}`}
                    className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <span>{selectedProfile === 'employer' ? 'Continuar al Acceso Empresas' : 'Continuar al Acceso Candidatos'}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: DEDICATED AUTHENTICATION / REGISTRATION STEP         */}
          {/* ============================================================ */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0070F2] rounded-2xl p-6 sm:p-8 shadow-xs max-w-lg mx-auto space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a métodos de acceso</span>
                </button>

                <span className="text-[11px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2.5 py-0.5 rounded">
                  {authMode === 'email-register' ? 'Registro' : 'Autenticación'}
                </span>
              </div>

              {/* Header Title depending on mode */}
              <div>
                <h2 className="text-xl font-bold text-[#1C2D42]">
                  {authMode === 'email-login' && 'Iniciar Sesión con Correo'}
                  {authMode === 'email-register' && 'Creación de Cuenta Corporativa'}
                  {authMode === 'oauth' && 'Autenticación Directa'}
                </h2>
                <p className="text-xs text-[#556B82] mt-1">
                  {authMode === 'email-login' && 'Ingresa tus credenciales para acceder a tu panel.'}
                  {authMode === 'email-register' && `Paso ${regStep} de 3: ${regStep === 1 ? 'Datos Personales e Identidad' : regStep === 2 ? 'Credenciales de Seguridad' : 'Confirmación y Activación'}`}
                  {authMode === 'oauth' && 'Haz clic en tu proveedor autorizado para ingresar.'}
                </p>
              </div>

              {/* Form 1A: Email Login */}
              {authMode === 'email-login' && (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0070F2] hover:bg-[#0A6ED1] active:bg-[#0050B3] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Ingresando...</span>
                    ) : (
                      <>
                        <span>Entrar a Gestión RIS3</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('email-register'); setRegStep(1); setError(null); }}
                      className="text-xs text-[#0070F2] hover:underline font-semibold cursor-pointer"
                    >
                      ¿No tienes cuenta? Crear una cuenta
                    </button>
                  </div>
                </form>
              )}

              {/* Form 1B: Multi-part Step-by-Step Registration */}
              {authMode === 'email-register' && (
                <div className="space-y-4">
                  {/* Registration Progress Bar */}
                  <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-xl border border-[#EEF2F6]">
                    {[
                      { s: 1, label: 'Identidad' },
                      { s: 2, label: 'Seguridad' },
                      { s: 3, label: 'Confirmación' },
                    ].map((stepItem) => (
                      <div
                        key={stepItem.s}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          regStep === stepItem.s
                            ? 'bg-[#0070F2] text-white shadow-2xs'
                            : regStep > stepItem.s
                            ? 'bg-[#E0F2FE] text-[#0284C7]'
                            : 'bg-transparent text-[#94A3B8]'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                          {stepItem.s}
                        </span>
                        <span className="hidden sm:inline">{stepItem.label}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Sub-Step 1: Identidad */}
                  {regStep === 1 && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                          Nombre completo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ej. Juan Carlos Pérez"
                            required
                            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                          Empresa u Organización
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ej. Acme Tech SA"
                            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                          Teléfono de contacto / WhatsApp
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej. +54 9 11 1234-5678"
                            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!fullName.trim()) {
                            setError('Ingresa tu nombre completo para continuar.');
                            return;
                          }
                          setError(null);
                          setRegStep(2);
                        }}
                        className="w-full bg-[#0070F2] hover:bg-[#0A6ED1] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer mt-2"
                      >
                        <span>Siguiente: Credenciales de Acceso</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Sub-Step 2: Credenciales */}
                  {regStep === 2 && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                          Correo corporativo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            required
                            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                            Contraseña <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                            Confirmar <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#556B82]" size={16} />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1C2D42] placeholder:text-[#94A3B8] outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setError(null); setRegStep(1); }}
                          className="flex-1 bg-white hover:bg-[#F8FAFC] text-[#556B82] border border-[#CBD5E1] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          <span>Atrás</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!email.trim()) {
                              setError('Ingresa tu correo electrónico.');
                              return;
                            }
                            if (password.length < 6) {
                              setError('La contraseña debe tener al menos 6 caracteres.');
                              return;
                            }
                            if (password !== confirmPassword) {
                              setError('Las contraseñas no coinciden.');
                              return;
                            }
                            setError(null);
                            setRegStep(3);
                          }}
                          className="flex-1 bg-[#0070F2] hover:bg-[#0A6ED1] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <span>Siguiente: Resumen</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub-Step 3: Resumen y Finalización */}
                  {regStep === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Summary Card */}
                      <div className="p-4 rounded-xl border border-[#D9E1E8] bg-[#F8FAFC] space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
                          <span className="text-[#556B82]">Titular:</span>
                          <span className="font-bold text-[#1C2D42]">{fullName}</span>
                        </div>
                        {companyName && (
                          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
                            <span className="text-[#556B82]">Empresa:</span>
                            <span className="font-medium text-[#1C2D42]">{companyName}</span>
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
                            <span className="text-[#556B82]">Teléfono:</span>
                            <span className="font-medium text-[#1C2D42]">{phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2">
                          <span className="text-[#556B82]">Correo:</span>
                          <span className="font-medium text-[#1C2D42]">{email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#556B82]">Perfil Configurado:</span>
                          <span className="font-bold text-[#0070F2]">
                            {selectedProfile === 'founder' && 'Fundador / Dirección'}
                            {selectedProfile === 'management' && 'Gestión & Proyectos'}
                            {selectedProfile === 'dev' && 'Técnico / Desarrollador'}
                          </span>
                        </div>
                      </div>

                      {/* Terms Acceptance */}
                      <label className="flex items-start gap-2 text-xs text-[#556B82] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 rounded border-[#CBD5E1] text-[#0070F2] focus:ring-[#0070F2]"
                        />
                        <span>Acepto las políticas de uso y privacidad del sistema RIS3.</span>
                      </label>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setError(null); setRegStep(2); }}
                          className="flex-1 bg-white hover:bg-[#F8FAFC] text-[#556B82] border border-[#CBD5E1] font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          <span>Atrás</span>
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 bg-[#0070F2] hover:bg-[#0A6ED1] active:bg-[#0050B3] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {submitting ? (
                            <span>Creando cuenta...</span>
                          ) : (
                            <>
                              <span>Finalizar y Crear</span>
                              <Check size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="pt-2 text-center border-t border-[#EEF2F6]">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('email-login'); setError(null); }}
                      className="text-xs text-[#0070F2] hover:underline font-semibold cursor-pointer"
                    >
                      ¿Ya tienes cuenta? Iniciar sesión
                    </button>
                  </div>
                </div>
              )}

              {/* Form 2: OAuth Providers */}
              {authMode === 'oauth' && (
                <div className="space-y-3 pt-2">
                  {/* Developer: ONLY GitHub */}
                  {selectedProfile === 'dev' && (
                    <button
                      type="button"
                      onClick={async () => {
                        setAppMode('dev');
                        await loginWithGithub();
                      }}
                      className="w-full bg-[#1C2D42] hover:bg-[#2A3F58] text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-white">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                      <span>Continuar con GitHub</span>
                    </button>
                  )}

                  {/* Management: ONLY Google */}
                  {selectedProfile === 'management' && (
                    <button
                      type="button"
                      onClick={async () => {
                        setAppMode('management');
                        await loginWithGoogle();
                      }}
                      className="w-full bg-white hover:bg-[#F8FAFC] text-[#1C2D42] border border-[#CBD5E1] rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continuar con Google</span>
                    </button>
                  )}

                  {/* Founder: Google + Facebook */}
                  {selectedProfile === 'founder' && (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          setAppMode('founder');
                          await loginWithGoogle();
                        }}
                        className="w-full bg-white hover:bg-[#F8FAFC] text-[#1C2D42] border border-[#CBD5E1] rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continuar con Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setAppMode('founder');
                          await loginWithFacebook();
                        }}
                        className="w-full bg-[#0070F2] hover:bg-[#0A6ED1] text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-white">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>Continuar con Facebook</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center py-3 border-t border-[#D9E1E8] text-xs text-[#556B82]">
        <p>© RIS3</p>
      </footer>
    </div>
  );
}
