import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  track: z.object({
    album: z.string().min(1),
    artist: z.string().min(1),
    audioUrl: z.string().min(1).optional(),
    coverColor: z.string().min(1),
    duration: z.number().int().nonnegative(),
    genre: z.string().min(1),
    imageUrl: z.string().url().nullable().optional(),
    title: z.string().min(1),
    webpageUrl: z.string().url().optional(),
  }).optional(),
  trackId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const userId = await getCurrentUser();
  if (!userId) return new NextResponse(null, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const { trackId, track } = parsed.data;

  if (track) {
    await prisma.track.upsert({
      create: { id: trackId, ...track },
      update: track,
      where: { id: trackId },
    });
  }

  await prisma.track.update({
    data: { playCount: { increment: 1 } },
    where: { id: trackId },
  });

  await prisma.userTrackPlay.upsert({
    create: { trackId, userId },
    update: { lastPlayedAt: new Date() },
    where: { userId_trackId: { trackId, userId } },
  });

  revalidateTag(`recently-played:${userId}`, 'max');
  revalidateTag(`discover:${userId}`, 'max');
  revalidateTag(`recommendations:${userId}`, 'max');

  return new NextResponse(null, { status: 204 });
}
