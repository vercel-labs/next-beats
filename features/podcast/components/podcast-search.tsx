'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/providers/player-provider';
import type { Track } from '@/types/track';

type Episode = {
  author: string;
  description: string;
  duration: number;
  id: string;
  imageUrl: string | null;
  publishedAt: string | null;
  title: string;
  url: string | null;
  webpageUrl: string | null;
};

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

export function PodcastSearch({ query }: { query?: string }) {
  const { playExternal, togglePlayPause, track, isPlaying } = usePlayer();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function playEpisode(episode: Episode) {
    const playbackUrl = episode.url ?? `/api/spreaker/episodes/${episode.id}/play`;
    const episodeId = `spreaker-${episode.id}`;
    if (track?.id === episodeId) {
      togglePlayPause();
      return;
    }
    const podcastTrack: Track = {
      album: episode.author,
      artist: episode.author,
      audioUrl: playbackUrl,
      coverColor: 'from-slate-500 to-slate-800',
      createdAt: new Date(episode.publishedAt ?? '1970-01-01T00:00:00.000Z'),
      duration: episode.duration,
      genre: 'Podcast',
      id: episodeId,
      isFavorite: false,
      lastPlayedAt: null,
      playCount: 0,
      title: episode.title,
      webpageUrl: episode.webpageUrl,
    };
    playExternal(podcastTrack, playbackUrl);
  }

  useEffect(() => {
    const value = query?.trim();
    if (!value) return;
    const controller = new AbortController();
    fetch(`/api/spreaker/search?q=${encodeURIComponent(value)}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error ?? 'Podcast search failed.');
        setEpisodes(Array.isArray(payload.episodes) ? payload.episodes : []);
      })
      .catch(caught => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught.message : 'Podcast search failed.');
        setEpisodes([]);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <div>
      {error && <p role="alert" className="text-destructive mb-6">{error}</p>}
      {query?.trim() && episodes.length === 0 && !isLoading && !error && <p className="text-muted">No Spreaker episodes found for this search.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {episodes.map(episode => (
          <article key={episode.id} className="bg-card dark:bg-card-dark flex gap-4 rounded-xl p-4">
            {episode.imageUrl ? <Image src={episode.imageUrl} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" unoptimized /> : <div className="bg-accent/15 h-24 w-24 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1">
              <p className="text-muted mb-1 text-xs font-medium">{episode.author}</p>
              <h2 className="line-clamp-2 font-semibold">{episode.title}</h2>
              <p className="text-muted mt-1 text-xs">{formatDuration(episode.duration)}</p>
              <button type="button" onClick={() => playEpisode(episode)} className="bg-accent text-accent-foreground mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"><Play className="h-3.5 w-3.5" fill="currentColor" /> {track?.id === `spreaker-${episode.id}` && isPlaying ? 'Playing' : 'Play episode'}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
