'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { SEED_PLAYLIST_IDS } from '@/features/playlist/playlist-constants';
import { verifyAuth } from '@/features/user/user-queries';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});
const idSchema = z.string().min(1);

const colors = [
  'from-violet-500 to-purple-600',
  'from-purple-400 to-violet-500',
  'from-fuchsia-500 to-purple-600',
  'from-purple-500 to-violet-700',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-violet-500',
];

export async function createPlaylist(formData: FormData) {
  const userId = await verifyAuth();
  await delay(300);
  const parsed = createPlaylistSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false as const };
  }

  const playlist = await prisma.playlist.create({
    data: {
      coverColor: colors[Math.floor(Math.random() * colors.length)],
      name: parsed.data.name,
      userId,
    },
  });
  refresh();
  return { ok: true as const, playlist };
}

export async function addToPlaylist(playlistId: string, trackId: string) {
  const userId = await verifyAuth();
  await delay(200);
  const parsedPlaylistId = idSchema.parse(playlistId);
  const parsedTrackId = idSchema.parse(trackId);
  if (SEED_PLAYLIST_IDS.has(parsedPlaylistId)) {
    return { error: "Can't modify a demo playlist", ok: false as const };
  }
  if (!(await ownsPlaylist(parsedPlaylistId, userId))) {
    return { error: 'Playlist not found', ok: false as const };
  }
  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId: parsedPlaylistId, trackId: parsedTrackId } },
  });
  if (existing) return { error: 'Already in this playlist', ok: false as const };

  const maxPos = await prisma.playlistTrack.aggregate({
    _max: { position: true },
    where: { playlistId: parsedPlaylistId },
  });

  try {
    await prisma.playlistTrack.create({
      data: {
        playlistId: parsedPlaylistId,
        position: (maxPos._max.position ?? -1) + 1,
        trackId: parsedTrackId,
      },
    });
  } catch (error) {
    // Unique violation: a racing add (rapid optimistic toggles) got there first.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Already in this playlist', ok: false as const };
    }
    throw error;
  }
  refresh();
  return { ok: true as const };
}

export async function removeFromPlaylist(playlistId: string, trackId: string) {
  const userId = await verifyAuth();
  await delay(200);
  const parsedPlaylistId = idSchema.parse(playlistId);
  const parsedTrackId = idSchema.parse(trackId);
  if (SEED_PLAYLIST_IDS.has(parsedPlaylistId)) {
    return { error: "Can't modify a demo playlist", ok: false as const };
  }
  if (!(await ownsPlaylist(parsedPlaylistId, userId))) {
    return { error: 'Playlist not found', ok: false as const };
  }
  await prisma.playlistTrack.deleteMany({
    where: { playlistId: parsedPlaylistId, trackId: parsedTrackId },
  });
  refresh();
  return { ok: true as const };
}

export async function deletePlaylist(playlistId: string) {
  const userId = await verifyAuth();
  const id = idSchema.parse(playlistId);
  if (SEED_PLAYLIST_IDS.has(id)) return { error: "Can't delete a demo playlist", ok: false as const };
  await delay(300);
  const result = await prisma.playlist.deleteMany({ where: { id, userId } });
  if (result.count === 0) return { error: 'Playlist not found', ok: false as const };
  refresh();
  return { ok: true as const };
}

async function ownsPlaylist(playlistId: string, userId: string) {
  const playlist = await prisma.playlist.findFirst({
    select: { id: true },
    where: { id: playlistId, userId },
  });
  return playlist !== null;
}
