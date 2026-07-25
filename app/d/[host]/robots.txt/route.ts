import { NextRequest } from 'next/server'
import {
  findPublishedProjectByCustomDomain,
  publishedSiteRobotsResponse,
} from '@/lib/published-site'

export async function GET(
  _req: NextRequest,
  { params }: { params: { host: string } }
) {
  // Gate, plan check and body are shared with the subdomain and path robots
  // routes. On a custom domain the file lands at the host root
  // (cliente.com/robots.txt), where a crawler actually reads it.
  const row = await findPublishedProjectByCustomDomain(params.host)
  return publishedSiteRobotsResponse(row)
}
