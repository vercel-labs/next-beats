import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { TopGenresGrid, TopGenresGridSkeleton } from '@/features/genre/components/genre-browse';

export default function GenreLayout({ children }: LayoutProps<'/genre'>) {
  return (
    <PageWrapper>
      {children}
      <section className="mt-10">
        <h2 className="mb-4">Explore Other Genres</h2>
        <ErrorBoundary title="Couldn't load other genres">
          <AnimatedSuspense>
            <TopGenresGrid />
          </AnimatedSuspense>
        </ErrorBoundary>
      </section>
    </PageWrapper>
  );
}
