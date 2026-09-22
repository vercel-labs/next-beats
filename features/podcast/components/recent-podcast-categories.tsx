'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Item = Record<string, unknown>;

function value(item: Item, ...keys: string[]) {
  for (const key of keys) if (typeof item[key] === 'string' && item[key]) return item[key] as string;
  return '';
}

export function RecentPodcastCategories() {
  const [episodes, setEpisodes] = useState<Item[]>([]);
  const [shows, setShows] = useState<Item[]>([]);

  useEffect(() => {
    fetch('/api/spreaker/profile').then(response => response.ok ? response.json() : null).then(data => {
      if (data) { setEpisodes(Array.isArray(data.episodes) ? data.episodes : []); setShows(Array.isArray(data.shows) ? data.shows : []); }
    }).catch(() => {});
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const show of shows) {
      const category = value(show, 'category_name', 'category', 'genre') || 'Podcasts';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [shows]);

  if (!episodes.length && !categories.length) return null;

  return <section className="mb-10 space-y-7">
    {episodes.length > 0 && <div>
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">From your Spreaker profile</p><h2 className="mt-1 text-2xl font-bold">Recent episodes</h2></div><Link href="/podcasts" className="text-accent text-sm font-semibold">View all</Link></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {episodes.slice(0, 4).map((episode, index) => { const id = value(episode, 'episode_id', 'id') || String(index); const title = value(episode, 'title', 'name', 'episode_title') || `Episode ${id}`; return <Link key={id} href={`/podcasts/episode/${id}`} className="bg-card dark:bg-card-dark rounded-xl p-4 transition-transform hover:-translate-y-0.5"><p className="line-clamp-2 font-semibold">{title}</p><p className="text-muted mt-2 text-xs">Neurodiversity Nation</p></Link>; })}
      </div>
    </div>}
    {categories.length > 0 && <div>
      <div className="mb-4"><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Browse your catalog</p><h2 className="mt-1 text-2xl font-bold">Podcast categories</h2></div>
      <div className="flex gap-2 overflow-x-auto pb-2">{categories.map(([category, count]) => <Link key={category} href={`/search?q=${encodeURIComponent(category)}`} className="bg-card dark:bg-card-dark shrink-0 rounded-full px-4 py-2 text-sm font-medium">{category}<span className="text-muted ml-2">{count}</span></Link>)}</div>
    </div>}
  </section>;
}
