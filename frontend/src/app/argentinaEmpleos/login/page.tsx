'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Wallet,
  Briefcase,
  LogIn,
  Loader2,
  Award,
} from 'lucide-react';

export default function ArgentinaEmpleosLoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, loading } = useAEAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push('/argentinaEmpleos/registro');
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con Google');
      setLoggingIn(false);
    }
  };

  return (
    <AEShell showSidebar={false}>
      <div className="max-w-4xl mx-auto py-4 sm:py-8">
        <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Benefits & Welcome Credit Callout */}
          <div className="bg-gradient-to-br from-[#0064D9] via-[#0057C2] to-[#0047A5] p-5 sm:p-8 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-blue-600/30">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F59E0B] mb-2 bg-white/10 px-2 py-0.5 rounded-sm w-fit">
                <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Beneficio Exclusivo de Registro</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Argentina Empleos
              </h2>
              <p className="text-xs text-blue-100 mt-2 leading-relaxed">
                La plataforma empresarial de oportunidades laborales adaptada a las 24 provincias argentinas.
              </p>

              {/* Welcome Credit Card */}
              <div className="mt-5 p-4 rounded-sm bg-white/15 border border-white/20 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#F59E0B]">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Crédito Inicial Automático</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-white mt-1">
                  $ 25.000 <span className="text-xs font-sans text-blue-200">ARS</span>
                </div>
                <p className="text-[11px] text-blue-100 mt-1.5 leading-relaxed">
                  Se acredita de forma instantánea y única en tu billetera interna al dar de alta tu cuenta con Google.
                </p>
              </div>

              <div className="mt-5 space-y-2 text-xs text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Priorización de empleos en tu ciudad y provincia</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Publicaciones directas y anónimas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Oportunidades remotas e híbridas en todo el país</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-blue-200 mt-6 pt-4 border-t border-white/20">
              Seguridad corporativa mediante Firebase Authentication y Firestore.
            </div>
          </div>

          {/* Right Column: Google Login Action */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-sm bg-blue-50 text-[#106EBE] flex items-center justify-center mx-auto mb-3 border border-blue-200">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Acceso Profesional
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Iniciá sesión o registrate en un solo paso con tu cuenta de Google.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loggingIn || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 hover:border-[#106EBE] hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-sm transition-all shadow-2xs"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#106EBE]" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Al ingresar, aceptás los términos profesionales de uso y la política de privacidad de Argentina Empleos.
            </p>
          </div>
        </div>
      </div>
    </AEShell>
  );
}
