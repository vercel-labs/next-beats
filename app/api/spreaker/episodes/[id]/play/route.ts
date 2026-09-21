import { NextRequest } from 'next/server';

const SPREAKER_API_URL = 'https://api.spreaker.com/v2/episodes';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return new Response('Invalid episode id.', { status: 400 });
  }

  const headers: HeadersInit = { Accept: 'audio/mpeg, audio/*;q=0.9, */*;q=0.1' };
  const token = process.env.SPREAKER_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${SPREAKER_API_URL}/${id}/play`, {
      headers,
      redirect: 'follow',
      next: { revalidate: 0 },
    });
  } catch {
    return new Response('Spreaker playback is temporarily unavailable.', { status: 502 });
  }

  if (!response.ok || !response.body) {
    return new Response('Spreaker could not start this episode.', { status: response.status || 502 });
  }

  const responseHeaders = new Headers();
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  if (contentType) responseHeaders.set('content-type', contentType);
  if (contentLength) responseHeaders.set('content-length', contentLength);
  responseHeaders.set('cache-control', 'no-store');

  return new Response(response.body, { headers: responseHeaders });
}
