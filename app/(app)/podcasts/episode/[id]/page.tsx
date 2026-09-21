import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastEpisodeDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

export const metadata: Metadata = { description: 'Listen to podcast episodes on NextBeats.', title: 'Podcast episode' };

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function PodcastEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageWrapper title="Podcasts"><PodcastEpisodeDetail id={id} /></PageWrapper>;
}
