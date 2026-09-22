import { NextResponse } from 'next/server';

const API = 'https://api.spreaker.com/v2';

export async function GET() {
  const token = process.env.SPREAKER_API_TOKEN;
  if (!token) return NextResponse.json({ error: 'Spreaker API is not configured.' }, { status: 503 });
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

  try {
    const meResponse = await fetch(`${API}/me`, { headers, next: { revalidate: 300 } });
    if (!meResponse.ok) return NextResponse.json({ error: 'Unable to load Spreaker profile.' }, { status: 502 });
    const me = await meResponse.json() as { response?: { user?: { user_id?: number | string; id?: number | string } } };
    const userId = me.response?.user?.user_id ?? me.response?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Spreaker profile could not be identified.' }, { status: 502 });

    const [showsResponse, episodesResponse] = await Promise.all([
      fetch(`${API}/users/${encodeURIComponent(String(userId))}/shows?limit=50`, { headers, next: { revalidate: 300 } }),
      fetch(`${API}/users/${encodeURIComponent(String(userId))}/episodes?limit=50`, { headers, next: { revalidate: 300 } }),
    ]);
    if (!showsResponse.ok || !episodesResponse.ok) return NextResponse.json({ error: 'Unable to load profile podcasts.' }, { status: 502 });
    const [shows, episodes] = await Promise.all([showsResponse.json(), episodesResponse.json()]);
    return NextResponse.json({ shows: shows?.response?.items ?? [], episodes: episodes?.response?.items ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unable to connect to Spreaker.' }, { status: 502 });
  }
}
