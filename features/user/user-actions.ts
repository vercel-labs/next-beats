'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'beats-user';

const signInSchema = z.object({
  email: z.preprocess(
    value => (typeof value === 'string' ? value.trim() : value),
    z.email('Enter a valid email address').max(254, 'Email is too long'),
  ),
});

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, ok: false as const };
  }

  let userId: string;
  try {
    const user = await prisma.user.upsert({
      where: { name: parsed.data.email },
      create: { name: parsed.data.email },
      update: {},
    });
    userId = user.id;
  } catch {
    return { error: 'Could not sign you in. Please try again.', ok: false as const };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  redirect('/');
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
