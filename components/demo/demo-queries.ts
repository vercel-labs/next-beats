import 'server-only';

import { cookies } from 'next/headers';

export const NO_PREFETCH = 'no-prefetch';

export async function isPrefetchEnabled() {
  return !(await cookies()).has(NO_PREFETCH);
}
