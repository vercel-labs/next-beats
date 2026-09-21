import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { GenreBrowse, GenreBrowseSkeleton } from '@/features/genre/components/genre-browse';
import { PodcastSearch } from '@/features/podcast/components/podcast-search';
import { Search } from '@/features/search/components/search';
import { SearchResults } from '@/features/search/components/search-results';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
};

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <PageWrapper title="Search">
      <Search>
        <ErrorBoundary title="Search is taking a breather">
          <AnimatedSuspense fallback={<GenreBrowseSkeleton />}>
            {searchParams.then(sp => {
              const q = typeof sp.q === 'string' ? sp.q : '';
              if (!q) {
                return (
                  <>
                    <h2 className="mb-4">Browse All</h2>
                    <GenreBrowse />
                  </>
                );
              }
              return (
                <div className="space-y-10">
                  <section>
                    <h2 className="mb-4">Music</h2>
                    <SearchResults query={q} />
                  </section>
                  <section>
                    <div className="mb-4 flex items-baseline justify-between gap-4">
                      <h2>Podcasts</h2>
                      <span className="text-muted text-sm">From Spreaker</span>
                    </div>
                    <PodcastSearch query={q} />
                  </section>
                </div>
              );
            })}
          </AnimatedSuspense>
        </ErrorBoundary>
      </Search>
    </PageWrapper>
  );
}
