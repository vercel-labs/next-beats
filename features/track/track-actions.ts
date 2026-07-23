'use server';

import { refresh } from 'next/cache';
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
    where: { userId_trackId: { userId, trackId: id } },
  });

  if (existing) {
    await prisma.userFavorite.deleteMany({
      where: { userId, trackId: id },
    });
  } else {
    try {
      await prisma.userFavorite.create({
        data: { userId, trackId: id },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
        throw error;
      }
    }
  }

  refresh();
  return { ok: true as const };
}
