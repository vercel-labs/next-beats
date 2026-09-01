import 'server-only';

import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

export async function getGenres() {
  return getGenresCached(true);
}

async function getGenresCached(slow: boolean) {
  await delay(600, slow);
  const rows = await prisma.track.groupBy({
    _count: { genre: true },
    by: ['genre'],
    orderBy: { _count: { genre: 'desc' } },
  });
  return rows.map(r => ({
    count: r._count.genre,
    genre: r.genre,
  }));
}
