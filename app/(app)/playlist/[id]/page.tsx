import { AnimatedSuspense } from '@/components/ui/animated-suspense';
import ErrorBoundary from '@/components/ui/error-boundary';
import { PageWrapper } from '@/components/ui/page-layout';
import { PlaylistBrowse } from '@/features/playlist/components/playlist-browse';
import { PlaylistListSkeleton } from '@/features/playlist/components/playlist-card';
import { PlaylistDetail, PlaylistDetailSkeleton } from '@/features/playlist/components/playlist-detail';

export default async function PlaylistDetailPage({ params }: PageProps<'/playlist/[id]'>) {
  return (
    <PageWrapper>
      <AnimatedSuspense fallback={<PlaylistDetailSkeleton />}>
        {params.then(({ id }) => (
          <>
            <PlaylistDetail id={id} />
            <section className="mt-10">
              <h2 className="mb-4">Other Playlists</h2>
              <AnimatedSuspense fallback={<PlaylistListSkeleton count={3} />}>
                <ErrorBoundary title="Couldn't load other playlists">
                  <PlaylistBrowse excludeId={id} />
                </ErrorBoundary>
              </AnimatedSuspense>
            </section>
          </>
        ))}
      </AnimatedSuspense>
    </PageWrapper>
  );
}
