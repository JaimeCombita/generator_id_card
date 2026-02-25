import type { MetadataRoute } from 'next';

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://app-carnets.jcengine.co';

  if (rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')) {
    return rawSiteUrl;
  }

  return `https://${rawSiteUrl}`;
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
