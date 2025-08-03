import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://heic-to-jpg.io/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin or private areas (if any)
Disallow: /api/
Disallow: /admin/
Disallow: /private/

# Explicitly allow main pages
Allow: /convert-heic-to-jpg
Allow: /heic-to-jpeg
Allow: /free-heic-converter`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  });
} 