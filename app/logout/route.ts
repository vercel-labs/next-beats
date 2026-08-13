import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'beats-user';

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
