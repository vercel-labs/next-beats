'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/providers/player-provider';
import type { Track } from '@/types/track';

type Show = {
  author: string;
  description: string;
  episodeCount: number | null;
  id: string;
  imageUrl: string | null;
  title: string;
  webpageUrl: string | null;
};

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
  const [shows, setShows] = useState<Show[]>([]);
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
    Promise.all([
      fetch(`/api/spreaker/search?q=${encodeURIComponent(value)}&type=episodes`, { signal: controller.signal }),
      fetch(`/api/spreaker/search?q=${encodeURIComponent(value)}&type=shows`, { signal: controller.signal }),
    ])
      .then(async ([episodesResponse, showsResponse]) => {
        const [episodePayload, showPayload] = await Promise.all([
          episodesResponse.json().catch(() => ({})),
          showsResponse.json().catch(() => ({})),
        ]);
        if (!episodesResponse.ok) throw new Error(episodePayload.error ?? 'Podcast search failed.');
        setEpisodes(Array.isArray(episodePayload.episodes) ? episodePayload.episodes : []);
        setShows(showsResponse.ok && Array.isArray(showPayload.shows) ? showPayload.shows : []);
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
      {shows.length > 0 && <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Shows</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {shows.map(show => <a key={show.id} href={`/podcasts/show/${show.id}`} className="bg-card dark:bg-card-dark flex w-52 shrink-0 gap-3 rounded-xl p-3 transition-transform hover:-translate-y-0.5">
            {show.imageUrl ? <Image src={show.imageUrl} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-lg object-cover" unoptimized /> : <div className="bg-accent/15 h-14 w-14 shrink-0 rounded-lg" />}
            <span className="min-w-0"><strong className="line-clamp-2 text-sm">{show.title}</strong><span className="text-muted mt-1 block text-xs">{show.episodeCount ? `${show.episodeCount} episodes` : 'Public show'}</span></span>
          </a>)}
        </div>
      </section>}
      {query?.trim() && episodes.length === 0 && !isLoading && !error && <p className="text-muted">No Spreaker episodes found for this search.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {episodes.map(episode => (
          <article key={episode.id} className="bg-card dark:bg-card-dark flex gap-4 rounded-xl p-4">
            {episode.imageUrl ? <Image src={episode.imageUrl} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" unoptimized /> : <div className="bg-accent/15 h-24 w-24 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1">
              <p className="text-muted mb-1 text-xs font-medium">{episode.author}</p>
              <a href={`/podcasts/episode/${episode.id}`} className="line-clamp-2 font-semibold hover:underline">{episode.title}</a>
              <p className="text-muted mt-1 text-xs">{formatDuration(episode.duration)}</p>
              <button type="button" onClick={() => playEpisode(episode)} className="bg-accent text-accent-foreground mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"><Play className="h-3.5 w-3.5" fill="currentColor" /> {track?.id === `spreaker-${episode.id}` && isPlaying ? 'Playing' : 'Play episode'}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
