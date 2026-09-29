'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  createSessionToken,
  GUEST_USER_ID,
  getSessionExpiration,
  hashSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from './session';

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

  const token = createSessionToken();
  const session = {
    expiresAt: getSessionExpiration(),
    tokenHash: hashSessionToken(token),
  };
  try {
    // The submitted email is only a demo affordance. It never selects an account.
    await prisma.user.upsert({
      create: {
        id: GUEST_USER_ID,
        name: 'Guest',
        sessions: { create: session },
      },
      update: { sessions: { create: session } },
      where: { id: GUEST_USER_ID },
    });
  } catch {
    return { error: 'Could not sign you in. Please try again.', ok: false as const };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  redirect('/');
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } }).catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
