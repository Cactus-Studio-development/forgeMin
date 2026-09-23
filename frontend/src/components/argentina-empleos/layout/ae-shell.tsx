'use client';

import React, { ReactNode } from 'react';
import { AEHeader } from './ae-header';
import { AESidebar } from './ae-sidebar';

interface AEShellProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function AEShell({ children, showSidebar = true }: AEShellProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col font-sans">
      <AEHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {showSidebar && <AESidebar />}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Argentina Empleos</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Plataforma Empresarial de Oportunidades Laborales</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Conectando talento y empresas en las 24 jurisdicciones de la República Argentina.
          </div>
        </div>
      </footer>
    </div>
  );
}

