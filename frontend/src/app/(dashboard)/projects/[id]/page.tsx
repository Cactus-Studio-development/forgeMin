import ProjectDetail from './ProjectDetail';

export async function generateStaticParams() {
  return [{ id: 'nuevo' }];
}

export default function Page() {
  return <ProjectDetail />;
}