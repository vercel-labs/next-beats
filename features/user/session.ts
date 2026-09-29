import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE = 'beats-user';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const GUEST_USER_ID = 'guest';

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiration() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}
