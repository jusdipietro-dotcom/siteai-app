import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PublishedSite } from '@/components/site/PublishedSite'
import {
  SITE_NOT_FOUND_METADATA,
  buildPublishedSiteMetadata,
  findPublishedProjectBySubdomain,
} from '@/lib/published-site'

// ─── Subdomain-addressed public site: {subdomain}.{SITES_SUBDOMAIN_BASE} ─────
//
// Reached only through the middleware rewrite — the DB lookup cannot happen in
// middleware because that runs on the Edge runtime, where Prisma does not work.
//
// Same gate, same renderer, same metadata builder as app/s/[slug]. An
// unpublished or unpaid project 404s here exactly as it does there.

export async function generateMetadata(
  { params }: { params: { subdomain: string } }
): Promise<Metadata> {
  const row = await findPublishedProjectBySubdomain(params.subdomain)
  if (!row) return SITE_NOT_FOUND_METADATA
  return buildPublishedSiteMetadata(row)
}

export default async function SubdomainSitePage({ params }: { params: { subdomain: string } }) {
  const row = await findPublishedProjectBySubdomain(params.subdomain)
  if (!row) notFound()

  return <PublishedSite project={row} />
}
