import 'server-only';

import { cacheLife, cacheTag, unstable_navigation as navigation } from 'next/cache';
import { notFound } from 'next/navigation';
import { verifyAuth } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';
import { toTrack } from '@/types/track';

const LIBRARY_PAGE_SIZE = 100;

export async function getLibrary(page: number = 1) {
  return getLibraryCached(page, true);
}

async function getLibraryCached(page: number, slow: boolean) {
  'use cache';
  cacheTag('library');
  cacheLife('hours');

  await delay(400, slow);
  const rows = await prisma.track.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * LIBRARY_PAGE_SIZE,
    take: LIBRARY_PAGE_SIZE + 1,
  });
  const hasMore = rows.length > LIBRARY_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, LIBRARY_PAGE_SIZE) : rows;
  return {
    hasMore,
    tracks: items.map(row => toTrack(row)),
  };
}

export async function getFavorites() {
  const userId = await verifyAuth();
  return getFavoritesForUser(userId, true);
}

async function getFavoritesForUser(userId: string, slow: boolean) {
  'use cache';
  cacheTag(`favorites:${userId}`);

  await delay(500, slow);
  const rows = await prisma.userFavorite.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    include: { track: true },
  });
  return rows.map(row => toTrack(row.track, { favorites: [row] }));
}

export async function getUserFavoriteIds() {
  const userId = await verifyAuth();
  return getUserFavoriteIdsForUser(userId);
}

async function getUserFavoriteIdsForUser(userId: string) {
  'use cache';
  cacheTag(`favorites:${userId}`);

  const rows = await prisma.userFavorite.findMany({
    where: { userId },
    select: { trackId: true },
  });
  return new Set(rows.map(r => r.trackId));
}

export async function getRecentlyPlayed(limit: number = 8) {
  const userId = await verifyAuth();
  return getRecentlyPlayedForUser(userId, limit, true);
}

async function getRecentlyPlayedForUser(userId: string, limit: number, slow: boolean) {
  await delay(500, slow);
  const rows = await prisma.userTrackPlay.findMany({
    where: { userId },
    orderBy: { lastPlayedAt: 'desc' },
    take: limit,
    include: { track: true },
  });
  return rows.map(row => toTrack(row.track, { trackPlays: [row] }));
}

export async function getTrack(id: string) {
  const userId = await verifyAuth();
  return getTrackForUser(id, userId, true);
}

async function getTrackForUser(id: string, userId: string, slow: boolean) {
  'use cache';
  cacheTag('tracks', `track-${id}`, `track-${id}:${userId}`);

  await delay(400, slow);
  const row = await prisma.track.findUnique({
    where: { id },
    include: {
      favorites: { where: { userId } },
    },
  });
  if (!row) notFound();
  return toTrack(row, { favorites: row.favorites });
}

export async function getMostPlayed(limit: number = 8) {
  return getMostPlayedCached(limit, true);
}

async function getMostPlayedCached(limit: number, slow: boolean) {
  await delay(700, slow);
  const rows = await prisma.track.findMany({
    orderBy: { playCount: 'desc' },
    take: limit,
    where: { playCount: { gt: 0 } },
  });
  return rows.map(row => toTrack(row));
}

export async function getDiscover(limit: number = 8) {
  const userId = await verifyAuth();
  return getDiscoverForUser(userId, limit, true);
}

async function getDiscoverForUser(userId: string, limit: number, slow: boolean) {
  'use cache';
  cacheTag(`discover:${userId}`);

  await delay(1100, slow);
  const rows = await prisma.track.findMany({
    orderBy: { playCount: 'desc' },
    take: limit,
    where: {
      favorites: { none: { userId } },
    },
  });
  return rows.map(row => toTrack(row));
}

export async function getTracksByGenre(genre: string) {
  return getTracksByGenreCached(genre, true);
}

async function getTracksByGenreCached(genre: string, slow: boolean) {
  'use cache';
  cacheTag('tracks', `genre-${genre}`);

  await delay(900, slow);
  const rows = await prisma.track.findMany({
    orderBy: { playCount: 'desc' },
    where: { genre },
  });
  return rows.map(row => toTrack(row));
}

export async function getRecommendedTracks(excludeTrackId: string, limit: number = 5) {
  await navigation();
  const userId = await verifyAuth();
  return getRecommendedTracksForUser(excludeTrackId, userId, limit, true);
}

async function getRecommendedTracksForUser(excludeTrackId: string, userId: string, limit: number, slow: boolean) {
  'use cache';
  cacheTag(`recommendations:${userId}`);

  await delay(900, slow);
  const rows = await prisma.track.findMany({
    orderBy: { playCount: 'desc' },
    take: limit,
    where: {
      id: { not: excludeTrackId },
      favorites: { none: { userId } },
    },
  });
  return rows.map(row => toTrack(row));
}

export async function searchTracks(query: string) {
  return searchTracksCached(query, true);
}

async function searchTracksCached(query: string, slow: boolean) {
  'use cache';
  cacheTag('search');
  cacheLife('hours');

  await delay(800, slow);
  const rows = await prisma.track.findMany({
    orderBy: { playCount: 'desc' },
    take: 30,
    where: {
      OR: [
        { title: { contains: query } },
        { artist: { contains: query } },
        { album: { contains: query } },
      ],
    },
  });
  return rows.map(row => toTrack(row));
}
