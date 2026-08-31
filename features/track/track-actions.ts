'use server';

import { revalidateTag, updateTag } from 'next/cache';
import { z } from 'zod';
import { verifyAuth } from '@/features/user/user-queries';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { delay } from '@/lib/utils';

const trackIdSchema = z.string().min(1);

export async function toggleFavorite(trackId: string) {
  const userId = await verifyAuth();
  await delay(200);
  const id = trackIdSchema.parse(trackId);

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_trackId: { trackId: id, userId } },
  });

  if (existing) {
    await prisma.userFavorite.deleteMany({
      where: { trackId: id, userId },
    });
  } else {
    try {
      await prisma.userFavorite.create({
        data: { trackId: id, userId },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  updateTag(`track-${id}:${userId}`);
  updateTag(`favorites:${userId}`);
  revalidateTag(`discover:${userId}`, 'max');
  revalidateTag(`recommendations:${userId}`, 'max');
  return { ok: true as const };
}
