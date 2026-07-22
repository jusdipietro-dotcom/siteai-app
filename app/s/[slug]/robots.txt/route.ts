import { NextRequest } from 'next/server'
import {
  findPublishedProjectBySlug,
  publishedSiteRobotsResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Gate, plan check and body are shared with the subdomain robots route.
  const row = await findPublishedProjectBySlug(params.slug)
  return publishedSiteRobotsResponse(row)
}
