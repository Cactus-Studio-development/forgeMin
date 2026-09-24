'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import {
  CheckCircle2,
  Store,
  Loader2,
  Wallet,
} from 'lucide-react';

export default function MercadoLoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, loading } = useAEAuth();
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoggingIn(true);
    setError(null);
    try {
      const syncRes = (await loginWithGoogle()) as any;
      if (syncRes?.user?.onboardingCompleted || syncRes?.user?.role === 'superadmin') {
        router.push('/argentinaEmpleos');
      } else if (syncRes?.isNewUser || !syncRes?.user?.onboardingCompleted) {
        router.push('/argentinaEmpleos/registro');
      } else {
        router.push('/argentinaEmpleos');
      }
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con Google');
      setLoggingIn(false);
    }
  };

  return (
    <AEShell showSidebar={false}>
      <div className="max-w-3xl mx-auto py-6 sm:py-12">
        <div className="bg-white border border-[#D9E1E8] rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Portal Overview */}
          <div className="bg-gradient-to-br from-[#0070F2] via-[#0A6ED1] to-[#0284C7] p-6 sm:p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white mb-4">
                <Store size={22} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Mercado
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                Portal de Oportunidades & Talento
              </p>

              {/* Credit card callout */}
              <div className="mt-5 p-3.5 rounded-xl bg-white/15 border border-white/20">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-sky-200">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Crédito inicial para publicaciones</span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  $ 25.000 <span className="text-xs font-sans text-blue-100 font-normal">ARS</span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
                  <span>Ofertas laborales y servicios</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-300" />
                  <span>Publicación directa de requerimientos</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-blue-200 mt-6 pt-3 border-t border-white/20">
              Cuenta independiente del sistema de gestión RIS3.
            </div>
          </div>

          {/* Right Column: Login Action */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1C2D42]">
                  Acceso al Mercado
                </h3>
                <p className="text-xs text-[#556B82] mt-1">
                  Ingresa con tu cuenta de Google para gestionar tus postulaciones o publicaciones.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loggingIn || loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-[#CBD5E1] hover:border-[#0070F2] hover:bg-[#F8FAFC] text-[#1C2D42] font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0070F2]" />
                    <span>Conectando...</span>
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
                    <span>Ingresar con Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-6 border-t border-[#EEF2F6] text-center">
              <Link
                href="/login"
                className="text-xs text-[#0070F2] hover:underline font-semibold"
              >
                ← Volver al Sistema de Gestión RIS3
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AEShell>
  );
}
