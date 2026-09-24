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
} from 'lucide-react';

type Step = 'choose-dest' | 'ris3-auth' | 'mercado-goal';

export default function LoginPage() {
  const { loginWithGoogle, loginWithGithub, loginWithFacebook, loginWithEmail, registerWithEmail, user, loading } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<Step>('choose-dest');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // RIS3 Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (authMode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password.trim());
      } else {
        await registerWithEmail(email.trim(), password.trim());
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
            <span className="text-[11px] text-[#556B82] font-medium">Portal de Acceso</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="text-xs font-semibold text-[#556B82] bg-white px-3 py-1 rounded-full border border-[#CBD5E1]">
          {currentStep === 'choose-dest' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
        </div>
      </header>

      {/* Main Step Container */}
      <main className="max-w-3xl mx-auto w-full my-auto py-2">
        <AnimatePresence mode="wait">

          {/* STEP 1: Choose Destination (RIS3 vs Mercado) */}
          {currentStep === 'choose-dest' && (
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
                  Selecciona el entorno al que deseas ingresar con tu cuenta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A: RIS3 Business Management */}
                <div
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentStep('ris3-auth');
                  }}
                  className="bg-white border-2 border-[#D9E1E8] hover:border-[#0070F2] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#0070F2]/10 text-[#0070F2] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Briefcase size={24} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#1C2D42]">
                        Gestión de Negocios
                      </h3>
                      <span className="text-[10px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2 py-0.5 rounded">
                        RIS3
                      </span>
                    </div>
                    <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
                      Acceso administrativo a radar territorial, gestión de propuestas, proyectos y clientes.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0070F2] group-hover:text-[#0A6ED1]">
                    <span>Ingresar a Gestión</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Option B: Mercado */}
                <div
                  onClick={() => {
                    setCurrentStep('mercado-goal');
                  }}
                  className="bg-white border-2 border-[#D9E1E8] hover:border-[#0284C7] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Store size={24} />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#1C2D42]">
                        Mercado
                      </h3>
                      <span className="text-[10px] font-bold text-[#0284C7] bg-[#F0F9FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
                        Oportunidades
                      </span>
                    </div>
                    <p className="text-xs text-[#556B82] mt-2 leading-relaxed">
                      Búsqueda de empleo, ofertas de servicios profesionales y publicación de requerimientos.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EEF2F6] flex items-center justify-between text-xs font-bold text-[#0284C7] group-hover:text-[#0369A1]">
                    <span>Ingresar al Mercado</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 2A: RIS3 Business Management Login/Register */}
          {currentStep === 'ris3-auth' && (
            <motion.div
              key="step-2a"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0070F2] rounded-2xl p-6 sm:p-8 shadow-xs max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCurrentStep('choose-dest');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a elegir</span>
                </button>

                <span className="text-[11px] font-bold text-[#0070F2] bg-[#0070F2]/10 px-2.5 py-0.5 rounded">
                  Gestión RIS3
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#1C2D42]">
                {authMode === 'login' ? 'Iniciar Sesión en Gestión' : 'Crear Cuenta de Gestión'}
              </h2>
              <p className="text-xs text-[#556B82] mt-1 mb-4">
                Ingresa con tu correo y contraseña corporativa.
              </p>

              {/* Mode Tabs */}
              <div className="flex bg-[#EEF2F6] p-1 rounded-xl border border-[#D9E1E8] mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-[#0070F2] shadow-xs border border-[#CBD5E1]'
                      : 'text-[#556B82] hover:text-[#1C2D42]'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white text-[#0070F2] shadow-xs border border-[#CBD5E1]'
                      : 'text-[#556B82] hover:text-[#1C2D42]'
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>

              {/* Form */}
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

                {authMode === 'login' ? (
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
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
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
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2D42] mb-1">
                        Confirmar
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
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0070F2] hover:bg-[#0A6ED1] active:bg-[#0050B3] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Ingresando...</span>
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Entrar a Gestión RIS3' : 'Registrar Cuenta'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {/* Social Login */}
              <div className="mt-5 pt-4 border-t border-[#EEF2F6]">
                <p className="text-[11px] text-[#556B82] text-center font-medium mb-2.5">
                  O ingresar con
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="bg-white hover:bg-[#F8FAFC] text-[#1C2D42] border border-[#CBD5E1] rounded-lg py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={loginWithGithub}
                    className="bg-[#1C2D42] hover:bg-[#2A3F58] text-white rounded-lg py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-white">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                    <span>GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={loginWithFacebook}
                    className="bg-[#0070F2] hover:bg-[#0A6ED1] text-white rounded-lg py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2B: Mercado Goal & Access */}
          {currentStep === 'mercado-goal' && (
            <motion.div
              key="step-2b"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#D9E1E8] border-t-4 border-t-[#0284C7] rounded-2xl p-6 sm:p-8 shadow-xs max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep('choose-dest')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#556B82] hover:text-[#1C2D42] cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Volver a elegir</span>
                </button>

                <span className="text-[11px] font-bold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-0.5 rounded border border-[#BAE6FD]">
                  Mercado
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0">
                  <Store size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1C2D42]">
                    Acceder al Mercado
                  </h2>
                  <p className="text-xs text-[#0284C7] font-semibold">
                    Portal de Oportunidades & Talento
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#556B82] mb-5">
                ¿Qué actividad principal realizarás?
              </p>

              {/* Goal options */}
              <div className="space-y-3 mb-6">
                <Link
                  href="/argentinaEmpleos/trabajos"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F8FAFC] transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                      <Search size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C2D42] group-hover:text-[#0284C7] transition-colors">
                        Explorar empleos y servicios
                      </p>
                      <p className="text-[11px] text-[#556B82]">
                        Postúlate a vacantes cerca de ti
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#CBD5E1] group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/argentinaEmpleos/publicar"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F8FAFC] transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center shrink-0">
                      <PlusCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1C2D42] group-hover:text-[#0284C7] transition-colors">
                        Publicar oferta o requerimiento
                      </p>
                      <p className="text-[11px] text-[#556B82]">
                        Encuentra talento o servicios
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#CBD5E1] group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>

              {/* Direct Login Button */}
              <div className="pt-4 border-t border-[#EEF2F6]">
                <Link
                  href="/argentinaEmpleos/login"
                  className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Iniciar Sesión en el Mercado</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
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
