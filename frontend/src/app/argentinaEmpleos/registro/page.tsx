'use client';

import React from 'react';
import { AEShell } from '@/components/argentina-empleos/layout/ae-shell';
import { OnboardingWizard } from '@/components/argentina-empleos/onboarding/onboarding-wizard';

export default function ArgentinaEmpleosRegistroPage() {
  return (
    <AEShell showSidebar={false}>
      <div className="py-6">
        <OnboardingWizard />
      </div>
    </AEShell>
  );
}
