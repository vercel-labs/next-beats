import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neurodiversitynation.com';
  return {
    rules: [{ allow: '/', disallow: ['/api/', '/login', '/cart', '/favorites', '/library'], userAgent: '*' }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
