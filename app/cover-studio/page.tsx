import { notFound } from 'next/navigation';
import { CoverStudio } from './studio';

export default function CoverStudioPage() {
  if (process.env.NODE_ENV !== 'development' || process.env.COVER_STUDIO !== '1') notFound();
  return <CoverStudio />;
}
