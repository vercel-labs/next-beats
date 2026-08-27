import { notFound } from 'next/navigation';
import { CoverStudio } from './studio';

export default function CoverStudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <CoverStudio />;
}
