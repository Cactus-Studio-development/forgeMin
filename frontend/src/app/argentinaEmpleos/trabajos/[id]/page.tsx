import JobDetailClient from './JobDetailClient';

export function generateStaticParams() {
  return [{ id: 'inicio' }];
}

export default function Page() {
  return <JobDetailClient />;
}
