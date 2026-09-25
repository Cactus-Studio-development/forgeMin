import type { Metadata } from 'next';
import { MonitoringProvider } from '@/lib/monitoring/monitoring-context';
import { MonitoringHeader } from '@/components/monitoring/layout/monitoring-header';
import { MonitoringSidebar } from '@/components/monitoring/layout/monitoring-sidebar';

export const metadata: Metadata = {
  title: 'MONITOREO | RIS3 Ecosistema',
  description: 'Plataforma empresarial de monitoreo, analítica de video y visión artificial.',
};

export default function MonitoringRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MonitoringProvider>
      <div className="min-h-screen flex flex-col bg-[#EDF1F5] text-[#1C2D42]">
        <MonitoringHeader />
        <div className="flex-1 flex overflow-hidden">
          <MonitoringSidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MonitoringProvider>
  );
}
