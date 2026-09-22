import ProjectDetail from './ProjectDetail';

export function generateStaticParams() {
  return [{ id: 'nuevo' }];
}

export default function Page() {
  return <ProjectDetail />;
}