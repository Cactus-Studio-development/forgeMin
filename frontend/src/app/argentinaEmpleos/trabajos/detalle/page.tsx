import { Suspense } from 'react';
import JobDetailClient from '../[id]/JobDetailClient';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { Loader2 } from 'lucide-react';

export default function ArgentinaEmpleosTrabajoDetallePage() {
  return (
    <Suspense
      fallback={
        <AEShell>
          <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#106EBE] mx-auto mb-2" />
            <p className="text-xs text-slate-500">Cargando detalles de la vacante...</p>
          </div>
        </AEShell>
      }
    >
      <JobDetailClient />
    </Suspense>
  );
}
