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
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'
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

/** Metadata returned when the gate rejects the request. */
export const SITE_NOT_FOUND_METADATA: Metadata = { title: 'Sitio no encontrado' }

/**
 * SEO metadata for a published project, shared by both addressing modes.
 *
 * The canonical URL always points at `publishedSiteUrl`, so a project that has
 * a subdomain declares the subdomain as canonical even when it was reached
 * through the path URL. Projects without a subdomain keep the path URL — which
 * is exactly the previous behavior.
 */
export function buildPublishedSiteMetadata(project: Project): Metadata {
  const bd = parseJSON<BusinessData>(project.businessData, {} as BusinessData)
  const title = bd.seo?.title || project.name
  const description = bd.seo?.description || bd.description || ''
  const canonical = publishedSiteUrl(project)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'website', url: canonical },
    twitter: { card: 'summary_large_image', title, description },
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
