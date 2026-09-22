import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastShowDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

const FEATURED_SHOW_ID = '5972496';

export const metadata: Metadata = {
  description: 'Listen to Neurodiversity Nation: Amplifying Voices on NextBeats.',
  title: 'Neurodiversity Nation: Amplifying Voices',
};

export default function PodcastsPage() {
  return (
    <PageWrapper>
      <PodcastShowDetail id={FEATURED_SHOW_ID} />
    </PageWrapper>
  );
}
