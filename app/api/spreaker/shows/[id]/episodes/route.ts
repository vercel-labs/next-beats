import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = new URL(request.url).searchParams;
  const limit = Math.min(Math.max(Number(query.get('limit') ?? '100'), 1), 100);
  const page = Math.max(Number(query.get('page') ?? '1'), 1);
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = process.env.SPREAKER_API_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.spreaker.com/v2/shows/${encodeURIComponent(id)}/episodes?limit=${limit}&page=${page}`, { headers, next: { revalidate: 300 } });
  if (!response.ok) return NextResponse.json({ error: 'Episodes unavailable.' }, { status: response.status === 404 ? 404 : 502 });
  return NextResponse.json(await response.json());
}
