'use client';

import { LoaderCircle, Play, Search } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
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

export function PodcastSearch() {
  const { playExternal, track, isPlaying } = usePlayer();
  const [query, setQuery] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  function playEpisode(episode: Episode) {
    if (!episode.url) return;
    const podcastTrack: Track = {
      album: episode.author,
      artist: episode.author,
      audioUrl: episode.url,
      coverColor: 'from-slate-500 to-slate-800',
      createdAt: new Date(episode.publishedAt ?? '1970-01-01T00:00:00.000Z'),
      duration: episode.duration,
      genre: 'Podcast',
      id: `spreaker-${episode.id}`,
      isFavorite: false,
      lastPlayedAt: null,
      playCount: 0,
      title: episode.title,
      webpageUrl: episode.webpageUrl,
    };
    playExternal(podcastTrack, episode.url);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/spreaker/search?q=${encodeURIComponent(value)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Search failed.');
      setEpisodes(Array.isArray(payload.episodes) ? payload.episodes : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Search failed.');
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative mb-8 flex max-w-2xl items-center">
        <Search className="text-gray pointer-events-none absolute left-4 h-5 w-5" aria-hidden="true" />
        <label htmlFor="podcast-query" className="sr-only">Search podcasts</label>
        <input id="podcast-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search podcasts and episodes" className="!rounded-full !py-3 !pr-28 !pl-12 !text-base" />
        <button type="submit" disabled={isLoading || !query.trim()} className="bg-accent text-accent-foreground absolute right-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-label="Searching" /> : 'Search'}
        </button>
      </form>
      {error && <p role="alert" className="text-destructive mb-6">{error}</p>}
      {episodes.length === 0 && !isLoading && !error && <p className="text-muted">Search for a topic to find episodes from Spreaker.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {episodes.map(episode => (
          <article key={episode.id} className="bg-card dark:bg-card-dark flex gap-4 rounded-xl p-4">
            {episode.imageUrl ? <Image src={episode.imageUrl} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" unoptimized /> : <div className="bg-accent/15 h-24 w-24 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1">
              <p className="text-muted mb-1 text-xs font-medium">{episode.author}</p>
              <h2 className="line-clamp-2 font-semibold">{episode.title}</h2>
              <p className="text-muted mt-1 text-xs">{formatDuration(episode.duration)}</p>
              {episode.url ? <button type="button" onClick={() => playEpisode(episode)} className="bg-accent text-accent-foreground mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"><Play className="h-3.5 w-3.5" fill="currentColor" /> {track?.id === `spreaker-${episode.id}` && isPlaying ? 'Playing' : 'Play episode'}</button> : <a href={episode.webpageUrl ?? '#'} target="_blank" rel="noreferrer" className="text-accent mt-3 inline-flex items-center gap-1 text-sm font-medium"><Play className="h-3.5 w-3.5" /> Listen on Spreaker</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
