'use server';

import { cookies } from 'next/headers';
import { NO_PREFETCH } from '@/components/demo/demo-queries';
import { SLOW } from '@/components/demo/demo-slow';

export async function togglePrefetch(enable: boolean) {
  const store = await cookies();
  if (enable) {
    store.delete(NO_PREFETCH);
  } else {
    store.set(NO_PREFETCH, '1', { path: '/', sameSite: 'lax' });
  }
}

export async function toggleSlow(enable: boolean) {
  const store = await cookies();
  if (enable) {
    store.set(SLOW, '1', { path: '/', sameSite: 'lax' });
  } else {
    store.delete(SLOW);
  }
}
