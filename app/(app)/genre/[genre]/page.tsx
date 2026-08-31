import { AnimatedSuspense } from '@/components/ui/animated-suspense';
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
    <div>
      <AnimatedSuspense>
        {params.then(({ genre }) => {
          const label = decodeURIComponent(genre);
          return (
            <>
              <h1 className="mb-6 text-3xl font-bold capitalize">{label}</h1>
              <GenreTracks genre={label} />
            </>
          );
        })}
      </AnimatedSuspense>
    </div>
  );
}
