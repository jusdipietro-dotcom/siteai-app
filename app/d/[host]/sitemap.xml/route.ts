import { NextRequest } from 'next/server'
import {
  findPublishedProjectByCustomDomain,
  publishedSiteSitemapResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { host: string } }
) {
  // Gate and XML shape are shared with the subdomain and path sitemap routes.
  const row = await findPublishedProjectByCustomDomain(params.host)
  return publishedSiteSitemapResponse(row)
}
