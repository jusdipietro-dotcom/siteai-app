import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PublishedSite } from '@/components/site/PublishedSite'
import {
  SITE_NOT_FOUND_METADATA,
  buildPublishedSiteMetadata,
  findPublishedProjectBySlug,
  recordPublishedSiteVisit,
} from '@/lib/published-site'

// ─── Path-addressed public site: {SITES_DOMAIN}/{slug} ───────────────────────
//
// Rendering, SEO and the publish gate all live in the shared modules so this
// route and the subdomain route (app/sub/[subdomain]) cannot drift apart.
//
// Canonical note: when the project has a subdomain, buildPublishedSiteMetadata
// emits the subdomain URL as canonical even here. Reaching a site by path stays
// valid — it just stops competing with the subdomain in search results.

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const row = await findPublishedProjectBySlug(params.slug)
  if (!row) return SITE_NOT_FOUND_METADATA
  return buildPublishedSiteMetadata(row)
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const row = await findPublishedProjectBySlug(params.slug)
  if (!row) notFound()

  // Count the visit here, in the render path only — never in generateMetadata —
  // so each visit counts once even though the loader runs in both.
  recordPublishedSiteVisit(row.id)

  return <PublishedSite project={row} />
}
