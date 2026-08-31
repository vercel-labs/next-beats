import {  ViewTransition } from 'react';
import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { TopGenresGrid } from '@/features/genre/components/genre-browse';
import { Discover, DiscoverSkeleton } from '@/features/track/components/discover';
import { FavoritesFeed } from '@/features/track/components/favorites-feed';
import { TrackListSkeleton } from '@/features/track/components/track-row';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liked Tracks',
};

export default function FavoritesPage() {
  return (
    <PageWrapper title="Liked Tracks">
      <AnimatedSuspense fallback={<TrackListSkeleton count={5} showIndex />}>
        
          <FavoritesFeed />
          <ViewTransition>
            <section>
              <h2 className="mt-10 mb-4">You Might Also Like</h2>
              <ErrorBoundary title="Couldn't load recommendations">
                <AnimatedSuspense fallback={<DiscoverSkeleton />}>
                  <Discover />
                  
                    <section className="mt-10">
                      <h2 className="mb-4">Explore Genres</h2>
                      <TopGenresGrid />
                    </section>
                  
                </AnimatedSuspense>
              </ErrorBoundary>
            </section>
          </ViewTransition>
        
      </AnimatedSuspense>
    </PageWrapper>
  );
}
