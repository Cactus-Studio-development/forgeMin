'use client';

import React from 'react';
import { useAEAuth } from '@/lib/argentina-empleos/ae-auth-context';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { Settings, Shield, Bell, Lock, User, Globe } from 'lucide-react';

export default function ArgentinaEmpleosConfiguracionPage() {
  const { user } = useAEAuth();

  return (
    <AEShell>
      <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#106EBE]" />
            Configuración de la Cuenta
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Preferencias de cuenta, privacidad, notificaciones y seguridad.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Account info card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              Datos de Cuenta
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400">Nombre de Usuario:</span>{' '}
                <span className="font-bold text-slate-800">{user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <span className="font-bold text-slate-800">
                  {user?.email && !user.email.endsWith('@argentinaempleos.local') ? user.email : 'Usuario Verificado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Rol del Sistema:</span>{' '}
                <span className="font-bold text-[#106EBE]">{user?.role}</span>
              </div>
              <div>
                <span className="text-slate-400">Estado:</span>{' '}
                <span className="text-emerald-700 font-bold">Activo</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              Notificaciones de Empleo
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="text-[#106EBE]" />
              <span className="text-slate-700">Recibir alertas de nuevos empleos en mi provincia y ciudad</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="text-[#106EBE]" />
              <span className="text-slate-700">Recibir resúmenes semanales de oportunidades destacadas</span>
            </label>
          </div>
        </div>
      </div>
    </AEShell>
  );
}
