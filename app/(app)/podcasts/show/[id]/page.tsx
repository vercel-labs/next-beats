import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastShowDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

export const metadata: Metadata = { description: 'Explore podcast episodes on NextBeats.', title: 'Podcast show' };

export default async function PodcastShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageWrapper title="Podcasts"><PodcastShowDetail id={id} /></PageWrapper>;
}
