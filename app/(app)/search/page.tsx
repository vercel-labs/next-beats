import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { GenreBrowse, GenreBrowseSkeleton } from '@/features/genre/components/genre-browse';
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
          <Suspense fallback={<GenreBrowseSkeleton />}>
            <Crossfade>
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
                return <SearchResults query={q} />;
              })}
            </Crossfade>
          </Suspense>
        </ErrorBoundary>
      </Search>
    </PageWrapper>
  );
}
