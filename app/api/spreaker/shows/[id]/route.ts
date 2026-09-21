import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = process.env.SPREAKER_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.spreaker.com/v2/shows/${encodeURIComponent(id)}`, { headers, next: { revalidate: 300 } });
  if (!response.ok) return NextResponse.json({ error: 'Show unavailable.' }, { status: response.status === 404 ? 404 : 502 });
  return NextResponse.json(await response.json());
}
