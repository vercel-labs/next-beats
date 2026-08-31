import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'beats-user';

export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return '';
  const exists = await prisma.user.findUnique({ select: { id: true }, where: { id: userId } });
  return exists?.id ?? '';
}

export async function getCurrentUserName() {
  const userId = await verifyAuth();
  const user = await prisma.user.findUnique({ select: { name: true }, where: { id: userId } });
  return user?.name ?? 'listener';
}

export async function verifyAuth() {
  const userId = await getCurrentUser();
  if (!userId) {
    redirect('/login');
  }
  return userId;
}
