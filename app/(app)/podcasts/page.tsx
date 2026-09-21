import { PageWrapper } from '@/components/ui/page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Discover and listen to podcasts from Spreaker.',
  title: 'Podcasts',
};

export default function PodcastsPage() {
  return (
    <PageWrapper title="Podcasts">
      <p className="text-muted mb-6 max-w-2xl">Search the Spreaker catalog and play episodes without leaving NextBeats.</p>
      <p className="text-muted">Use the main Search page to search music and podcasts together.</p>
    </PageWrapper>
  );
}
