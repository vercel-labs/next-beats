import { PrefetchLink } from '@/components/ui/prefetch-link';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumArt } from '@/features/artwork/components/album-art';
import { PlayButton } from '@/features/track/components/play-button';
import { NowPlayingTrackTitle } from '@/features/track/components/track-interactions';
import type { Track } from '@/types/track';

export function AlbumCard({ track }: { track: Track }) {
  return (
    <PrefetchLink
      href={`/track/${track.id}`}
      className="group bg-card/50 hover:bg-card dark:bg-card-dark/50 dark:hover:bg-card-dark flex flex-col gap-3 rounded-lg p-3 transition-colors"
    >
      <div className="relative">
        <AlbumArt
          coverColor={track.coverColor}
          coverSeed={track.id}
          label={track.title}
          size="lg"
          className="aspect-square !h-auto !w-full shadow-lg"
        />
        <PlayButton track={track} className="card-play-btn absolute right-2 bottom-2" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <NowPlayingTrackTitle trackId={track.id}>{track.title}</NowPlayingTrackTitle>
        <span className="text-muted truncate text-xs">{track.artist}</span>
      </div>
    </PrefetchLink>
  );
}

export function AlbumCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg p-3">
      <Skeleton className="skeleton-subtle aspect-square w-full rounded-md" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="skeleton-subtle h-4 w-3/4" />
        <Skeleton className="skeleton-subtle h-3 w-1/2" />
      </div>
    </div>
  );
}
