import { ViewTransition } from 'react';
import { AlbumArt } from '@/components/ui/album-art';
import { PrefetchLink } from '@/components/ui/prefetch-link';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayButton } from '@/features/track/components/play-button';
import { coverAssetPath } from '@/lib/cover-motif';
import type { PlaylistWithTracks } from '@/types/playlist';

export function PlaylistCard({ playlist }: { playlist: PlaylistWithTracks }) {
  const firstTrack = playlist.tracks[0];
  const trackIds = playlist.tracks.map(track => track.id);
  const trackCovers = playlist.tracks.map(track => coverAssetPath(track.id, track.title, 'track', 'thumb', true));

  return (
    <PrefetchLink
      href={`/playlist/${playlist.id}`}
      preloadImages={trackCovers}
      className="group bg-card/50 hover:bg-card dark:bg-card-dark/50 dark:hover:bg-card-dark flex flex-col gap-3 rounded-lg p-3 transition-colors"
    >
      <div className="relative">
        <AlbumArt
          coverColor={playlist.coverColor}
          coverSeed={playlist.id}
          label={playlist.name}
          kind="playlist"
          beatTrackIds={trackIds}
          size="lg"
          className="aspect-square !h-auto !w-full shadow-lg"
        />
        {firstTrack && (
          <PlayButton
            track={firstTrack}
            queue={playlist.tracks}
            className="card-play-btn absolute right-2 bottom-2"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-black dark:text-white">{playlist.name}</span>
        <span className="text-muted truncate text-xs">
          {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
        </span>
      </div>
    </PrefetchLink>
  );
}

export function PlaylistList({
  playlists,
  animateItems = false,
}: {
  playlists: PlaylistWithTracks[];
  animateItems?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {playlists.map(pl =>
        animateItems ? (
          <ViewTransition key={pl.id}>
            <PlaylistCard playlist={pl} />
          </ViewTransition>
        ) : (
          <PlaylistCard key={pl.id} playlist={pl} />
        ),
      )}
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="rounded-lg p-3">
      <Skeleton className="skeleton-subtle aspect-square w-full rounded-md" />
    </div>
  );
}

export function PlaylistListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <PlaylistCardSkeleton key={i} />
      ))}
    </div>
  );
}
