import JobDetailClient from './JobDetailClient';

export async function generateStaticParams() {
  return [{ id: 'inicio' }];
}

export default function Page() {
  return <JobDetailClient />;
}

