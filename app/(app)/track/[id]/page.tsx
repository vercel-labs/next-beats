import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { TrackControls, TrackControlsSkeleton } from '@/features/track/components/track-controls';
import { TrackHeader, TrackHeaderSkeleton } from '@/features/track/components/track-header';
import { RecommendedTracks, TrackListSkeleton } from '@/features/track/components/track-row';
import { getTrack } from '@/features/track/track-queries';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/track/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);
  return { title: track.title };
}

export default function TrackPage({ params }: PageProps<'/track/[id]'>) {
  return (
    <PageWrapper>
      <Suspense
        fallback={
          <>
            <TrackHeaderSkeleton />
            <TrackControlsSkeleton />
          </>
        }
      >
        <Crossfade>
          {params.then(({ id }) => (
            <>
              <TrackHeader id={id} />
              <TrackControls id={id} />
            </>
          ))}
        </Crossfade>
      </Suspense>
      <section>
        <h2 className="mb-4">More songs you might like</h2>
        <ErrorBoundary title="Couldn't load recommendations">
          <Suspense fallback={<TrackListSkeleton count={3} />}>
            <Crossfade>
              {params.then(({ id }) => (
                <RecommendedTracks trackId={id} />
              ))}
            </Crossfade>
          </Suspense>
        </ErrorBoundary>
      </section>
    </PageWrapper>
  );
}
