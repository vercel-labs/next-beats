import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SPREAKER_API_URL = 'https://api.spreaker.com/v2/search';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'A search query is required.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    limit: '20',
    q: query,
    type: 'episodes',
  });
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = process.env.SPREAKER_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SPREAKER_API_URL}?${params}`, {
    headers,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Spreaker could not complete the search.' }, { status: response.status });
  }

  const payload = await response.json();
  const episodes = Array.isArray(payload.response?.items) ? payload.response.items : [];

  return NextResponse.json({
    episodes: episodes.map((episode: Record<string, unknown>) => ({
      author: typeof episode.show === 'object' && episode.show ? (episode.show as Record<string, unknown>).title : 'Spreaker',
      description: typeof episode.description === 'string' ? episode.description : '',
      duration: typeof episode.duration === 'number' ? episode.duration : 0,
      id: String(episode.episode_id ?? episode.id ?? ''),
      imageUrl: typeof episode.image_url === 'string' ? episode.image_url : null,
      publishedAt: typeof episode.published_at === 'string' ? episode.published_at : null,
      title: typeof episode.title === 'string' ? episode.title : 'Untitled episode',
      url: typeof episode.audio_url === 'string' ? episode.audio_url : null,
      webpageUrl: typeof episode.site_url === 'string' ? episode.site_url : null,
    })),
  });
}
