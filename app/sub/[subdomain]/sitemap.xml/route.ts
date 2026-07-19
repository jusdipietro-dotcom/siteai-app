import { NextRequest } from 'next/server'
import {
  findPublishedProjectBySubdomain,
  publishedSiteSitemapResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  // Gate and XML shape are shared with the slug sitemap route.
  const row = await findPublishedProjectBySubdomain(params.subdomain)
  return publishedSiteSitemapResponse(row)
}
