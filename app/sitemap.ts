import type { MetadataRoute } from 'next';

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://app-carnets.jcengine.co';

  if (rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')) {
    return rawSiteUrl;
  }

  return `https://${rawSiteUrl}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/upload`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
