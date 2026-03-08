import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseJSON<T>(val: unknown, fallback: T): T {
  if (typeof val !== 'string') return fallback
  try { return JSON.parse(val) as T } catch { return fallback }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const row = await prisma.project.findFirst({
    where: { slug: params.slug, status: 'published' },
    select: { plan: true, businessData: true, updatedAt: true },
  })

  if (!row) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Solo para planes Essential y Professional
  const bd = parseJSON<{ seo?: { sitemapEnabled?: boolean } }>(row.businessData, {})
  if (!bd.seo?.sitemapEnabled) {
    return new NextResponse('Not found', { status: 404 })
  }

  const base = `https://sites.automaticialab.com/${params.slug}`
  const lastmod = row.updatedAt.toISOString().split('T')[0]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
