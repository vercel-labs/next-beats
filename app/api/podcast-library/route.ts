import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/features/user/user-queries';
import { prisma } from '@/lib/db';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('follow'), showId: z.string().min(1), showTitle: z.string().min(1) }),
  z.object({ action: z.literal('unfollow'), showId: z.string().min(1) }),
  z.object({ action: z.literal('save'), episodeId: z.string().min(1), showId: z.string().min(1), title: z.string().min(1), imageUrl: z.string().url().nullable().optional(), webpageUrl: z.string().url().nullable().optional() }),
  z.object({ action: z.literal('unsave'), episodeId: z.string().min(1) }),
  z.object({ action: z.literal('progress'), episodeId: z.string().min(1), showId: z.string().min(1), title: z.string().min(1), duration: z.number().int().nonnegative(), position: z.number().int().nonnegative(), imageUrl: z.string().url().nullable().optional(), webpageUrl: z.string().url().nullable().optional() }),
]);

export async function GET() {
  const userId = await getCurrentUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [follows, saves, playbacks] = await Promise.all([
    prisma.podcastFollow.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.podcastEpisodeSave.findMany({ where: { userId }, orderBy: { savedAt: 'desc' } }),
    prisma.podcastPlayback.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
  ]);
  return NextResponse.json({ follows, playbacks, saves });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUser();
  if (!userId) return new NextResponse(null, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid podcast library request' }, { status: 400 });
  const body = parsed.data;

  if (body.action === 'follow') await prisma.podcastFollow.upsert({ create: { showId: body.showId, showTitle: body.showTitle, userId }, update: { showTitle: body.showTitle }, where: { userId_showId: { showId: body.showId, userId } } });
  if (body.action === 'unfollow') await prisma.podcastFollow.deleteMany({ where: { showId: body.showId, userId } });
  if (body.action === 'save') await prisma.podcastEpisodeSave.upsert({ create: { episodeId: body.episodeId, imageUrl: body.imageUrl, showId: body.showId, title: body.title, userId, webpageUrl: body.webpageUrl }, update: { imageUrl: body.imageUrl, title: body.title, webpageUrl: body.webpageUrl }, where: { userId_episodeId: { episodeId: body.episodeId, userId } } });
  if (body.action === 'unsave') await prisma.podcastEpisodeSave.deleteMany({ where: { episodeId: body.episodeId, userId } });
  if (body.action === 'progress') await prisma.podcastPlayback.upsert({ create: { duration: body.duration, episodeId: body.episodeId, imageUrl: body.imageUrl, position: body.position, showId: body.showId, title: body.title, userId, webpageUrl: body.webpageUrl }, update: { duration: body.duration, imageUrl: body.imageUrl, position: body.position, title: body.title, webpageUrl: body.webpageUrl, completed: body.duration > 0 && body.position >= body.duration }, where: { userId_episodeId: { episodeId: body.episodeId, userId } } });
  return NextResponse.json({ ok: true });
}
