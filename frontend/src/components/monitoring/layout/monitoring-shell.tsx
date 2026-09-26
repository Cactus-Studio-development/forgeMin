'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MonitoringHeader } from '@/components/monitoring/layout/monitoring-header';
import { MonitoringSidebar } from '@/components/monitoring/layout/monitoring-sidebar';

export function MonitoringShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRemoteCamera = pathname?.includes('/monitor/remote-camera');

  if (isRemoteCamera) {
    return <>{children}</>;
  }

  return (
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
  );
}
