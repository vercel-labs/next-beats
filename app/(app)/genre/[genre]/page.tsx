import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { Skeleton } from '@/components/ui/skeleton';
import { GenreTracks } from '@/features/genre/components/genre-tracks';
import { TrackListSkeleton } from '@/features/track/components/track-row';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: PageProps<'/genre/[genre]'>): Promise<Metadata> {
  const { genre } = await params;
  const label = decodeURIComponent(genre);
  return { title: label.charAt(0).toUpperCase() + label.slice(1) };
}

export default function GenreDetailPage({ params }: PageProps<'/genre/[genre]'>) {
  return (
    <>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-6 h-9 w-40" />
            <TrackListSkeleton count={5} showIndex showMore />
          </>
        }
      >
        <Crossfade>
          {params.then(({ genre }) => {
            const label = decodeURIComponent(genre);
            return (
              <>
                <h1 className="mb-6 text-3xl font-bold capitalize">{label}</h1>
                <GenreTracks genre={label} />
              </>
            );
          })}
        </Crossfade>
      </Suspense>
    </>
  );
}
