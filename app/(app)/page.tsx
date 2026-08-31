import { AnimatedSuspense } from 'react';

import { PageWrapper } from '@/components/ui/page-layout';
import { TopGenresGrid } from '@/features/genre/components/genre-browse';
import { PlaylistBrowse } from '@/features/playlist/components/playlist-browse';
import { MostPlayed, MostPlayedSkeleton } from '@/features/track/components/most-played';
import { QuickPlayGrid, QuickPlayGridSkeleton } from '@/features/track/components/quick-play-grid';

export default function HomePage() {
  return (
    <PageWrapper title="Welcome back">
      <h2 className="mb-4">Recently Played</h2>
      <AnimatedSuspense fallback={<QuickPlayGridSkeleton />}>
        <QuickPlayGrid />
      </AnimatedSuspense>
      <h2 className="mt-10 mb-4">Most Played</h2>
      <AnimatedSuspense fallback={<MostPlayedSkeleton />}>
        <MostPlayed />
        <section className="mt-10">
          <h2 className="mb-4">Your Playlists</h2>
          <PlaylistBrowse />
        </section>
        <section className="mt-10">
          <h2 className="mb-4">Browse Genres</h2>
          <TopGenresGrid />
        </section>
      </AnimatedSuspense>
    </PageWrapper>
  );
}
