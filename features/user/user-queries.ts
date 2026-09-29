import 'server-only';

import { cacheLife } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashSessionToken, SESSION_COOKIE } from './session';

export async function getCurrentUser() {
  'use cache: private';
  cacheLife('seconds');

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return '';

  const session = await prisma.session.findUnique({
    select: { expiresAt: true, user: { select: { id: true } } },
    where: { tokenHash: hashSessionToken(token) },
  });
  if (!session || session.expiresAt <= new Date()) return '';
  return session.user.id;
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
