import { NextRequest } from 'next/server'
import {
  findPublishedProjectBySubdomain,
  publishedSiteRobotsResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  // Gate, plan check and body are shared with the slug robots route.
  const row = await findPublishedProjectBySubdomain(params.subdomain)
  return publishedSiteRobotsResponse(row)
}
