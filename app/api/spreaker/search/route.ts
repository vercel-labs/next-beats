import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SPREAKER_API_URL = 'https://api.spreaker.com/v2/search';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  const type = request.nextUrl.searchParams.get('type') === 'shows' ? 'shows' : 'episodes';
  if (!query) {
    return NextResponse.json({ error: 'A search query is required.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    limit: '20',
    q: query,
    type,
  });
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = process.env.SPREAKER_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${SPREAKER_API_URL}?${params}`, {
      headers,
      next: { revalidate: 300 },
    });
  } catch {
    return NextResponse.json(
      { error: 'Spreaker is temporarily unavailable. Please try again.' },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? 502 : response.status;
    return NextResponse.json(
      { error: 'Spreaker could not complete the search.' },
      { status },
    );
  }

  let payload: { response?: { items?: unknown[] } };
  try {
    payload = await response.json();
  } catch {
    return NextResponse.json(
      { error: 'Spreaker returned an invalid response.' },
      { status: 502 },
    );
  }

  const episodes = Array.isArray(payload.response?.items) ? payload.response.items : [];
  const normalizedEpisodes = episodes.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const episode = item as Record<string, unknown>;
    const show = episode.show && typeof episode.show === 'object'
      ? episode.show as Record<string, unknown>
      : null;
    const id = episode.episode_id ?? episode.id;
    if (id === undefined || id === null) return [];

    return [{
      author: typeof show?.title === 'string' ? show.title : 'Spreaker',
      description: typeof episode.description === 'string' ? episode.description : '',
      duration: typeof episode.duration === 'number' ? episode.duration : 0,
      id: String(id),
      imageUrl: [episode.image_url, episode.image_original_url, episode.image_medium_url, show?.image_url].find(value => typeof value === 'string' && value.length > 0) as string | undefined ?? null,
      publishedAt: typeof episode.published_at === 'string' ? episode.published_at : null,
      title: typeof episode.title === 'string' ? episode.title : 'Untitled episode',
      url: `/api/spreaker/episodes/${String(id)}/play`,
      webpageUrl: typeof episode.site_url === 'string' ? episode.site_url : null,
    }];
  });

  if (type === 'shows') {
    const shows = episodes.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const show = item as Record<string, unknown>;
      const id = show.show_id ?? show.id;
      if (id === undefined || id === null) return [];
      return [{
        author: typeof show.author === 'string' ? show.author : 'Spreaker',
        description: typeof show.description === 'string' ? show.description : '',
        episodeCount: typeof show.episodes_count === 'number' ? show.episodes_count : null,
        id: String(id),
        imageUrl: [show.image_url, show.image_original_url, show.image_medium_url].find(value => typeof value === 'string' && value.length > 0) as string | undefined ?? null,
        title: typeof show.title === 'string' ? show.title : 'Untitled show',
        webpageUrl: typeof show.site_url === 'string' ? show.site_url : null,
      }];
    });
    return NextResponse.json({ shows });
  }

  return NextResponse.json({ episodes: normalizedEpisodes });
}
