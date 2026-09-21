'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePlayer } from '@/providers/player-provider';
import type { Track } from '@/types/track';

type Entity = Record<string, unknown>;

function text(entity: Entity, key: string, fallback = '') { return typeof entity[key] === 'string' ? entity[key] as string : fallback; }
function number(entity: Entity, key: string) { return typeof entity[key] === 'number' ? entity[key] as number : 0; }
function normalize(value: Entity) { return (value.response && typeof value.response === 'object' ? value.response as Entity : value); }

export function PodcastShowDetail({ id }: { id: string }) {
  const [show, setShow] = useState<Entity | null>(null);
  const [episodes, setEpisodes] = useState<Entity[]>([]);
  useEffect(() => { Promise.all([fetch(`/api/spreaker/shows/${id}`).then(r => r.json()), fetch(`/api/spreaker/shows/${id}/episodes`).then(r => r.json())]).then(([showData, episodeData]) => { setShow(normalize(showData)); const items = normalize(episodeData).items; setEpisodes(Array.isArray(items) ? items as Entity[] : []); }); }, [id]);
  if (!show) return <p className="text-muted">Loading show…</p>;
  const imageUrl = text(show, 'image_url') || text(show, 'cover_url');
  return <div className="space-y-8"><header className="bg-card dark:bg-card-dark flex flex-col gap-5 rounded-2xl p-4 sm:flex-row sm:p-6"><div className="bg-accent/15 relative h-40 w-40 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">{imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />}</div><div><p className="text-muted text-xs font-semibold uppercase tracking-widest">Podcast show</p><h1 className="mt-2 text-2xl font-bold">{text(show, 'title', 'Untitled show')}</h1><p className="text-muted mt-2 line-clamp-3 text-sm">{text(show, 'description')}</p></div></header><section><h2 className="mb-4 text-lg font-semibold">Episodes</h2><div className="space-y-3">{episodes.map(episode => <EpisodeRow key={String(episode.episode_id ?? episode.id)} episode={episode} />)}</div></section></div>;
}

function EpisodeRow({ episode }: { episode: Entity }) {
  const { playExternal } = usePlayer();
  const id = String(episode.episode_id ?? episode.id ?? '');
  const title = text(episode, 'title', 'Untitled episode');
  const audioUrl = `/api/spreaker/episodes/${id}/play`;
  function play() { const track: Track = { album: text(episode, 'show_name', 'Spreaker'), artist: text(episode, 'author', 'Spreaker'), audioUrl, coverColor: 'from-slate-500 to-slate-800', createdAt: new Date(text(episode, 'published_at', '1970-01-01')), duration: number(episode, 'duration'), genre: 'Podcast', id: `spreaker-${id}`, imageUrl: text(episode, 'image_url', ''), isFavorite: false, lastPlayedAt: null, playCount: 0, title, webpageUrl: text(episode, 'site_url') }; playExternal(track, audioUrl); }
  return <article className="bg-card dark:bg-card-dark flex items-center gap-3 rounded-xl p-3"><button type="button" onClick={play} aria-label={`Play ${title}`} className="bg-accent text-accent-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full"><Play className="h-4 w-4" fill="currentColor" /></button><div className="min-w-0 flex-1"><h3 className="truncate font-medium">{title}</h3><p className="text-muted text-xs">{number(episode, 'duration') ? `${Math.floor(number(episode, 'duration') / 60)} min` : 'Podcast episode'}</p></div></article>;
}

export function PodcastEpisodeDetail({ id }: { id: string }) {
  const [episode, setEpisode] = useState<Entity | null>(null);
  useEffect(() => { fetch(`/api/spreaker/episodes/${id}`).then(r => r.json()).then(data => setEpisode(normalize(data))); }, [id]);
  if (!episode) return <p className="text-muted">Loading episode…</p>;
  return <div className="bg-card dark:bg-card-dark rounded-2xl p-6"><p className="text-muted text-xs font-semibold uppercase tracking-widest">Podcast episode</p><h1 className="mt-2 text-2xl font-bold">{text(episode, 'title', 'Untitled episode')}</h1><p className="text-muted mt-4 whitespace-pre-line">{text(episode, 'description')}</p></div>;
}
