import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastSearch } from '@/features/podcast/components/podcast-search';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: 'Discover and listen to podcasts from Spreaker.',
  title: 'Podcasts',
};

export default function PodcastsPage() {
  return (
    <PageWrapper title="Podcasts">
      <p className="text-muted mb-6 max-w-2xl">Search the Spreaker catalog and play episodes without leaving NextBeats.</p>
      <PodcastSearch />
    </PageWrapper>
  );
}
