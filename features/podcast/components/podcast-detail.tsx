'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/providers/player-provider';
import type { Track } from '@/types/track';

type Entity = Record<string, unknown>;

function text(entity: Entity, key: string, fallback = '') { return typeof entity[key] === 'string' && entity[key].trim() ? entity[key] as string : fallback; }
function episodeTitle(entity: Entity) { return text(entity, 'title') || text(entity, 'name') || text(entity, 'episode_title') || `Episode ${String(entity.episode_id ?? entity.id ?? '')}`; }
function number(entity: Entity, key: string) { return typeof entity[key] === 'number' ? entity[key] as number : 0; }
function normalize(value: Entity) { return (value.response && typeof value.response === 'object' ? value.response as Entity : value); }

export function PodcastShowDetail({ id }: { id: string }) {
  const [show, setShow] = useState<Entity | null>(null);
  const [episodes, setEpisodes] = useState<Entity[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([fetch(`/api/spreaker/shows/${id}`).then(r => r.json()), fetch(`/api/spreaker/shows/${id}/episodes`).then(r => r.json())]).then(([showData, episodeData]) => { if (showData.error || episodeData.error) { setError(showData.error ?? episodeData.error); return; } setShow(normalize(showData)); const items = normalize(episodeData).items; setEpisodes(Array.isArray(items) ? items as Entity[] : []); }).catch(() => setError('This podcast is unavailable right now.')); }, [id]);
  if (error) return <p className="text-muted" role="alert">{error}</p>;
  if (!show) return <p className="text-muted">Loading show…</p>;
  const imageUrl = text(show, 'image_url') || text(show, 'cover_url');
  const title = text(show, 'title', 'Podcast show');
  return <div className="space-y-8">
    <header className="bg-card dark:bg-card-dark overflow-hidden rounded-2xl">
      <div className="from-accent/15 via-background to-background grid gap-6 bg-gradient-to-br p-4 sm:grid-cols-[9rem_1fr] sm:p-6">
        <div className="bg-accent/15 relative aspect-square w-full overflow-hidden rounded-xl sm:w-36">
          {imageUrl ? <Image src={imageUrl} alt={`${title} cover`} fill sizes="(max-width: 640px) 100vw, 144px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-accent">NN</div>}
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-accent text-xs font-bold uppercase tracking-[0.18em]">Discover podcasts</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted mt-3 line-clamp-4 max-w-2xl text-sm leading-6">{text(show, 'description', 'Listen to the latest conversations from Neurodiversity Nation.')}</p>
          <div className="text-muted mt-4 flex items-center gap-3 text-xs font-medium"><span>{episodes.length} episodes</span><span aria-hidden="true">•</span><span>Spreaker podcast</span></div>
        </div>
      </div>
    </header>
    <section>
      <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-muted text-xs font-semibold uppercase tracking-[0.16em]">Latest from the show</p><h2 className="mt-1 text-2xl font-bold">Recent episodes</h2></div><span className="text-muted hidden text-sm sm:block">Tap an episode to listen</span></div>
      <div className="space-y-3">{episodes.map(episode => <EpisodeRow key={String(episode.episode_id ?? episode.id)} episode={episode} />)}</div>
    </section>
  </div>;
}

function EpisodeRow({ episode }: { episode: Entity }) {
  const { playExternal } = usePlayer();
  const id = String(episode.episode_id ?? episode.id ?? '');
  const title = episodeTitle(episode);
  const audioUrl = `/api/spreaker/episodes/${id}/play`;
  function play() { const track: Track = { album: text(episode, 'show_name', 'Spreaker'), artist: text(episode, 'author', 'Spreaker'), audioUrl, coverColor: 'from-slate-500 to-slate-800', createdAt: new Date(text(episode, 'published_at', '1970-01-01')), duration: number(episode, 'duration'), genre: 'Podcast', id: `spreaker-${id}`, imageUrl: text(episode, 'image_url', ''), isFavorite: false, lastPlayedAt: null, playCount: 0, title, webpageUrl: text(episode, 'site_url') }; playExternal(track, audioUrl); }
  return <article className="bg-card dark:bg-card-dark flex items-center gap-3 rounded-xl p-3"><button type="button" onClick={play} aria-label={`Play ${title}`} className="bg-accent text-accent-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full"><Play className="h-4 w-4" fill="currentColor" /></button><div className="min-w-0 flex-1"><h3 className="truncate font-medium">{title}</h3><p className="text-muted text-xs">{number(episode, 'duration') ? `${Math.floor(number(episode, 'duration') / 60)} min` : 'Podcast episode'}</p></div></article>;
}

export function PodcastEpisodeDetail({ id }: { id: string }) {
  const [episode, setEpisode] = useState<Entity | null>(null);
  useEffect(() => { fetch(`/api/spreaker/episodes/${id}`).then(r => r.json()).then(data => setEpisode(normalize(data))); }, [id]);
  if (!episode) return <p className="text-muted">Loading episode…</p>;
  return <div className="bg-card dark:bg-card-dark rounded-2xl p-6"><p className="text-muted text-xs font-semibold uppercase tracking-widest">Podcast episode</p><h1 className="mt-2 text-2xl font-bold">{episodeTitle(episode)}</h1><p className="text-muted mt-4 whitespace-pre-line">{text(episode, 'description')}</p></div>;
}
