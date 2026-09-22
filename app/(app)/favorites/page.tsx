import { ViewTransition } from 'react';
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
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#171717] p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-2xl"><p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Your favorites</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">The conversations worth returning to.</h1><p className="mt-3 text-sm leading-6 text-white/65">Save meaningful episodes and tracks here so they are always within reach.</p></div>
      </section>
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
