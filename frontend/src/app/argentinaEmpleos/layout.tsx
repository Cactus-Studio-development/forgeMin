import type { Metadata } from 'next';
import { AEAuthProvider } from '@/lib/argentina-empleos/ae-auth-context';

export const metadata: Metadata = {
  title: 'Mercado RIS3 | Portal de Oportunidades y Red Profesional',
  description:
    'Portal de oportunidades, empleo y contratación de servicios profesionales para empresas y talentos.',
};

export default function ArgentinaEmpleosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AEAuthProvider>{children}</AEAuthProvider>;
}
