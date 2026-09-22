import type { Metadata } from 'next';
import { AEAuthProvider } from '@/lib/argentina-empleos/ae-auth-context';

export const metadata: Metadata = {
  title: 'Argentina Empleos | Red Profesional y Oportunidades Laborales',
  description:
    'Plataforma profesional de empleos y oportunidades laborales para toda la República Argentina con enfoque corporativo y regional.',
};

export default function ArgentinaEmpleosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AEAuthProvider>{children}</AEAuthProvider>;
}
