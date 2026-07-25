import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PublishedSite } from '@/components/site/PublishedSite'
import {
  SITE_NOT_FOUND_METADATA,
  buildPublishedSiteMetadata,
  findPublishedProjectByCustomDomain,
  recordPublishedSiteVisit,
} from '@/lib/published-site'

// ─── Custom-domain public site: cliente.com → /d/{host} ─────────────────────
//
// Reached only through the middleware rewrite — the DB lookup cannot happen in
// middleware because that runs on the Edge runtime, where Prisma does not work.
//
// Same gate, same renderer, same metadata builder as the subdomain and path
// routes. Only an ACTIVE custom domain resolves (see the loader); anything else
// 404s exactly as an unpublished project does.

export async function generateMetadata(
  { params }: { params: { host: string } }
): Promise<Metadata> {
  const row = await findPublishedProjectByCustomDomain(params.host)
  if (!row) return SITE_NOT_FOUND_METADATA
  return buildPublishedSiteMetadata(row)
}

export default async function CustomDomainSitePage({ params }: { params: { host: string } }) {
  const row = await findPublishedProjectByCustomDomain(params.host)
  if (!row) notFound()

  // Count the visit here, in the render path only — never in generateMetadata —
  // so each visit counts once even though the loader runs in both.
  recordPublishedSiteVisit(row.id)

  return <PublishedSite project={row} />
}
