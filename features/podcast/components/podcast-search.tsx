'use client';

import { LoaderCircle, Play, Search } from 'lucide-react';
import { useState } from 'react';

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
  const [query, setQuery] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/spreaker/search?q=${encodeURIComponent(value)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Search failed.');
      setEpisodes(payload.episodes ?? []);
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
            {episode.imageUrl ? <img src={episode.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" /> : <div className="bg-accent/15 h-24 w-24 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1">
              <p className="text-muted mb-1 text-xs font-medium">{episode.author}</p>
              <h2 className="line-clamp-2 font-semibold">{episode.title}</h2>
              <p className="text-muted mt-1 text-xs">{formatDuration(episode.duration)}</p>
              {episode.url ? <audio className="mt-3 h-8 w-full" controls preload="none" src={episode.url}><track kind="captions" /></audio> : <a href={episode.webpageUrl ?? '#'} target="_blank" rel="noreferrer" className="text-accent mt-3 inline-flex items-center gap-1 text-sm font-medium"><Play className="h-3.5 w-3.5" /> Listen on Spreaker</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
