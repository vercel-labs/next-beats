import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neurodiversitynation.com';
  const now = new Date();
  return [
    { changeFrequency: 'daily', lastModified: now, priority: 1, url: baseUrl },
    { changeFrequency: 'daily', lastModified: now, priority: 0.95, url: `${baseUrl}/podcasts` },
    { changeFrequency: 'daily', lastModified: now, priority: 0.9, url: `${baseUrl}/podcasts/show/5972496` },
    { changeFrequency: 'weekly', lastModified: now, priority: 0.6, url: `${baseUrl}/merch` },
  ];
}
