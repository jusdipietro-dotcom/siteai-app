import { NextRequest } from 'next/server'
import {
  findPublishedProjectBySlug,
  publishedSiteSitemapResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Gate and XML shape are shared with the subdomain sitemap route.
  const row = await findPublishedProjectBySlug(params.slug)
  return publishedSiteSitemapResponse(row)
}
