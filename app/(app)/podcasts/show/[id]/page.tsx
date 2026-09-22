import { PageWrapper } from '@/components/ui/page-layout';
import { PodcastShowDetail } from '@/features/podcast/components/podcast-detail';
import type { Metadata } from 'next';

type SpreakerEntity = Record<string, unknown>;
const fallbackTitle = 'Neurodiversity Nation: Amplifying Voices';
const fallbackDescription = 'Listen to Neurodiversity Nation conversations about lived experience, education, advocacy, and inclusive care.';

async function getShowMetadata(id: string): Promise<SpreakerEntity> {
  try {
    const response = await fetch(`https://api.spreaker.com/v2/shows/${encodeURIComponent(id)}`, { headers: process.env.SPREAKER_API_TOKEN ? { Authorization: `Bearer ${process.env.SPREAKER_API_TOKEN}` } : undefined, next: { revalidate: 300 } });
    const data = await response.json() as SpreakerEntity;
    const responseData = data.response && typeof data.response === 'object' ? data.response as SpreakerEntity : data;
    return responseData.show && typeof responseData.show === 'object' ? responseData.show as SpreakerEntity : responseData;
  } catch { return {}; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const show = await getShowMetadata(id);
  const title = typeof show.title === 'string' ? show.title : fallbackTitle;
  const description = typeof show.description === 'string' && show.description.trim() ? show.description : fallbackDescription;
  const image = typeof show.image_url === 'string' ? show.image_url : undefined;
  return { alternates: { canonical: `/podcasts/show/${id}` }, description, openGraph: { description, images: image ? [{ alt: `${title} cover`, height: 1200, url: image, width: 1200 }] : undefined, siteName: 'Neurodiversity Nation: Amplifying Voices', title, type: 'website', url: `/podcasts/show/${id}` }, title, twitter: { card: image ? 'summary_large_image' : 'summary', description, images: image ? [image] : undefined, title } };
}

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default async function PodcastShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageWrapper title="Podcasts"><PodcastShowDetail id={id} /></PageWrapper>;
}
