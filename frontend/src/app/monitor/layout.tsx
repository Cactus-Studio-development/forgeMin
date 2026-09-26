import type { Metadata } from 'next';
import { MonitoringProvider } from '@/lib/monitoring/monitoring-context';
import { MonitoringShell } from '@/components/monitoring/layout/monitoring-shell';

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
      <MonitoringShell>
        {children}
      </MonitoringShell>
    </MonitoringProvider>
  );
}
