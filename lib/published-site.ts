/**
 * Shared data access, SEO metadata and sitemap generation for published sites.
 *
 * A published project is served from two addressing modes (path and
 * subdomain). Everything that must stay identical between them lives here —
 * most importantly the publish gate. Duplicating the gate per route is how an
 * unpaid site eventually leaks through one of them.
 */

import type { Metadata } from 'next'
import { NextResponse } from 'next/server'
import type { Project } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { publishedSiteUrl } from '@/lib/site-domain'
import {
  absoluteSiteImageUrl,
  hasProfessionalSeo,
  parseSeoKeywords,
} from '@/lib/site-seo'
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'
import { normalizeCustomDomain, isValidCustomDomain } from '@/lib/custom-domain'
import type { BusinessData } from '@/types'

/**
 * The publish gate, defined once.
 *
 * `hasPaid` is required alongside `status`, not implied by it. Defense in
 * depth: if any future code path ever flips `status` without going through the
 * paid publish endpoint, an unpaid site still does not render.
 *
 * Billing suspension flows through here too rather than through a second check
 * at each route — a parallel gate is how one addressing mode ends up serving a
 * site the other one refuses. It is a function rather than a const because the
 * grace branch is time-dependent: a project whose `graceUntil` has passed is
 * excluded at READ time, so an elapsed grace period takes the site down even
 * though nothing has rewritten the row. There is no scheduler to rely on.
 */
function publishedGate(now: Date = new Date()) {
  return {
    status: 'published',
    hasPaid: true,
    OR: [
      { billingStatus: 'active' },
      { billingStatus: 'grace', graceUntil: { gt: now } },
    ],
  }
}

/**
 * Parses a JSON column, falling back instead of throwing.
 *
 * A single unparseable row must never take down a whole list: callers map this
 * over every project a user owns, so a throw here would turn one corrupt row
 * into a 500 for the entire response. `context` is optional and only used to
 * log which column of which row fell back, so corruption is visible in the
 * logs rather than silently papered over.
 */
export function parseJSON<T>(val: unknown, fallback: T, context?: string): T {
  if (typeof val !== 'string') {
    if (context && val != null) {
      console.warn(`[parseJSON] ${context}: expected string, got ${typeof val} — using fallback`)
    }
    return fallback
  }
  try {
    return JSON.parse(val) as T
  } catch (err) {
    if (context) {
      console.error(`[parseJSON] ${context}: corrupt JSON — using fallback`, err)
    }
    return fallback
  }
}

/** Resolves a published project by its path slug, or null. */
export async function findPublishedProjectBySlug(
  slug: string
): Promise<Project | null> {
  if (!slug) return null
  return prisma.project.findFirst({ where: { slug, ...publishedGate() } })
}

/**
 * Resolves a published project by its subdomain, or null.
 *
 * The input is normalized and validated before it reaches the database:
 * subdomains are stored lowercase, so an un-normalized lookup would miss, and
 * a reserved/malformed label can never match a stored value anyway.
 */
export async function findPublishedProjectBySubdomain(
  subdomain: string
): Promise<Project | null> {
  if (!subdomain) return null
  const normalized = normalizeSubdomain(subdomain)
  if (!validateSubdomain(normalized).valid) return null
  return prisma.project.findFirst({
    where: { subdomain: normalized, ...publishedGate() },
  })
}

/**
 * Resolves a published project by its custom domain, or null.
 *
 * Only an ACTIVE custom domain matches: a 'pending'/'verified' domain has no
 * cert/route in Traefik yet, so traffic could not reach us on it anyway, and
 * refusing to serve it here keeps the render gate honest. The host is
 * normalized (scheme/port/www stripped) the same way it is stored.
 */
export async function findPublishedProjectByCustomDomain(
  host: string
): Promise<Project | null> {
  const normalized = normalizeCustomDomain(host)
  if (!normalized || !isValidCustomDomain(normalized)) return null
  return prisma.project.findFirst({
    where: { customDomain: normalized, customDomainStatus: 'active', ...publishedGate() },
  })
}

/**
 * Records one anonymous visit to a published project by bumping `Project.views`.
 *
 * Fire-and-forget by design: telemetry must never delay or break rendering, so
 * the update is not awaited and any error is swallowed (logged only). Losing a
 * count under load is acceptable; blocking a public page render is not.
 *
 * MUST be called exactly ONCE per request, and only from the page component —
 * never from the shared loaders. Both public routes call their loader twice per
 * request (once in `generateMetadata`, once in the component), so incrementing
 * inside a loader would count every visit twice.
 */
export function recordPublishedSiteVisit(projectId: string): void {
  prisma.project
    .update({ where: { id: projectId }, data: { views: { increment: 1 } } })
    .catch((err) => {
      console.error(`[recordPublishedSiteVisit] ${projectId}: failed to count visit`, err)
    })
}

/** Metadata returned when the gate rejects the request. */
export const SITE_NOT_FOUND_METADATA: Metadata = { title: 'Sitio no encontrado' }

/**
 * SEO metadata for a published project, shared by both addressing modes.
 *
 * The canonical URL always points at `publishedSiteUrl`, so a project that has
 * a subdomain declares the subdomain as canonical even when it was reached
 * through the path URL. Projects without a subdomain keep the path URL — which
 * is exactly the previous behavior.
 *
 * Two tiers of output:
 *   - `keywords` for EVERY paid site. The owner has been typing them into the
 *     wizard and the settings screen since day one and nothing ever emitted
 *     them, so Essential's advertised "SEO básico (título, descripción,
 *     keywords)" was false. Not plan-gated: both tiers advertise it.
 *   - The OpenGraph/Twitter IMAGE only for Professional, through the shared
 *     `hasProfessionalSeo` gate. The title/description pair in those cards
 *     predates this and stays available to both tiers; the image is the part
 *     that turns a shared link into a card, and it is the paid differentiator.
 *
 * The image tags are omitted entirely rather than emitted empty when the owner
 * has no usable hero image — a blank og:image is worse than none.
 */
export function buildPublishedSiteMetadata(project: Project): Metadata {
  const bd = parseJSON<BusinessData>(project.businessData, {} as BusinessData)
  const title = bd.seo?.title || project.name
  const description = bd.seo?.description || bd.description || ''
  const canonical = publishedSiteUrl(project)

  const keywords = parseSeoKeywords(bd.seo?.keywords)
  const shareImage = hasProfessionalSeo(project)
    ? absoluteSiteImageUrl(bd.heroImage, canonical)
    : null

  return {
    title,
    description,
    ...(keywords.length > 0 && { keywords }),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(shareImage && { images: [shareImage] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(shareImage && { images: [shareImage] }),
    },
  }
}

/**
 * Renders the sitemap for a published project.
 *
 * Takes the already-gated project (or null) so both routes share the 404
 * shape: unknown/unpublished/unpaid and "sitemap disabled" are indistinguishable
 * from the outside.
 */
export function publishedSiteSitemapResponse(
  project: Project | null
): NextResponse {
  const notFound = new NextResponse('Not found', { status: 404 })
  if (!project) return notFound

  // Solo para planes Essential y Professional
  const bd = parseJSON<{ seo?: { sitemapEnabled?: boolean } }>(
    project.businessData,
    {}
  )
  if (!bd.seo?.sitemapEnabled) return notFound

  const base = publishedSiteUrl(project)
  const lastmod = project.updatedAt.toISOString().split('T')[0]

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

/**
 * Renders robots.txt for a published project — Professional plan only.
 *
 * Same contract as `publishedSiteSitemapResponse`: takes the already-gated
 * project (or null) so both addressing modes share one 404 shape, and an
 * Essential site is indistinguishable from a project that does not exist.
 *
 * The `Sitemap:` line is emitted only when the sitemap route will actually
 * answer — that route 404s when the owner turned `seo.sitemapEnabled` off, and
 * pointing a crawler at a 404 is worse than saying nothing.
 *
 * KNOWN LIMIT, worth stating plainly: crawlers only read robots.txt at the ROOT
 * of a host. In subdomain mode the canonical URL IS the root
 * (`https://{sub}.{base}/robots.txt`) so this is fully effective. In path mode
 * the file lands at `https://{SITES_DOMAIN}/{slug}/robots.txt`, which no crawler
 * fetches — the host root belongs to the platform, not to any one client site.
 * It is served in both modes anyway so the two routes never diverge, and so a
 * project that later gains a subdomain needs no new code.
 */
export function publishedSiteRobotsResponse(
  project: Project | null
): NextResponse {
  const notFound = new NextResponse('Not found', { status: 404 })
  if (!project) return notFound
  if (!hasProfessionalSeo(project)) return notFound

  const bd = parseJSON<{ seo?: { sitemapEnabled?: boolean } }>(
    project.businessData,
    {}
  )
  const base = publishedSiteUrl(project)

  const lines = ['User-agent: *', 'Allow: /']
  if (bd.seo?.sitemapEnabled) {
    lines.push('', `Sitemap: ${base}/sitemap.xml`)
  }

  return new NextResponse(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
