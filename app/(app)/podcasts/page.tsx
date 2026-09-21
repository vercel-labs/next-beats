import type { Metadata } from 'next';
import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastSearch } from '@/features/podcast/components/podcast-search';

export const metadata: Metadata = {
  title: 'Podcasts',
  description: 'Discover and listen to podcasts from Spreaker.',
};

export default function PodcastsPage() {
  return (
    <PageWrapper title="Podcasts">
      <p className="text-muted mb-6 max-w-2xl">Search the Spreaker catalog and play episodes without leaving NextBeats.</p>
      <PodcastSearch />
    </PageWrapper>
  );
}
