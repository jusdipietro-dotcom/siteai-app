/**
 * Host configuration for published sites.
 *
 * A published project is reachable through two addressing modes:
 *   - path mode:      https://{SITES_DOMAIN}/{slug}
 *   - subdomain mode: https://{subdomain}.{SITES_SUBDOMAIN_BASE}
 *
 * Both hosts used to be hardcoded string literals scattered across the
 * middleware, the page renderer, the sitemap route and the publish screen.
 * They are read from the environment here so there is exactly one place to
 * change them.
 *
 * This module is imported by `middleware.ts`, so it must stay Edge-safe:
 * no Prisma, no Node built-ins, no filesystem.
 */

import { normalizeSubdomain, validateSubdomain } from './subdomain'

/** Host that serves published sites by path: `{SITES_DOMAIN}/{slug}`. */
export const SITES_DOMAIN =
  process.env.NEXT_PUBLIC_SITES_DOMAIN || 'sites.automaticialab.com'

/** Base host that serves published sites by subdomain: `{sub}.{BASE}`. */
export const SITES_SUBDOMAIN_BASE =
  process.env.NEXT_PUBLIC_SITES_SUBDOMAIN_BASE || 'sitios.automaticialab.com'

/**
 * Extra bases accepted outside production so subdomain routing is testable
 * without DNS: `{sub}.localhost:3000` and `{sub}.lvh.me:3000` both resolve to
 * 127.0.0.1 in every modern browser.
 *
 * They are disabled in production builds. To exercise subdomain routing
 * against a production build, set NEXT_PUBLIC_SITES_SUBDOMAIN_BASE=localhost
 * instead of relying on this list.
 */
const DEV_SUBDOMAIN_BASES =
  process.env.NODE_ENV === 'production' ? [] : ['localhost', 'lvh.me']

/**
 * Strips a `:port` suffix and lowercases. Host headers carry the port.
 *
 * Also strips the trailing dot of a fully-qualified host: `example.com.` and
 * `example.com` name the same host, but the raw form matched neither the
 * subdomain suffix nor the path-host equality check, so such a request fell
 * through to the dashboard branch instead of resolving to its site.
 */
function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0].replace(/\.+$/, '')
}

/**
 * True when the request targets the path-addressed sites host.
 *
 * Replaces the previous `hostname.startsWith('sites.automaticialab')` check,
 * which existed only to tolerate a `:port` suffix — that is handled by
 * `normalizeHost` now, without also matching `sites.automaticialab.com.evil.tld`.
 */
export function isSitesPathHost(host: string): boolean {
  const h = normalizeHost(host)
  return h === SITES_DOMAIN || h === `www.${SITES_DOMAIN}`
}

/**
 * Extracts the site subdomain from a host, or null if the host is not a
 * single-label subdomain of a configured base.
 *
 * Returns the normalized (lowercase) label, already checked against the
 * format and reserved-word rules in lib/subdomain.ts — so the middleware never
 * rewrites to a lookup that could not possibly match a stored value.
 *
 * Deliberately rejects multi-level hosts (`a.b.sitios.automaticialab.com`):
 * stored subdomains are a single RFC 1123 label.
 */
export function extractSiteSubdomain(host: string): string | null {
  const h = normalizeHost(host)
  if (!h) return null

  for (const base of [SITES_SUBDOMAIN_BASE, ...DEV_SUBDOMAIN_BASES]) {
    const suffix = `.${base}`
    if (h === base || !h.endsWith(suffix)) continue

    const label = h.slice(0, -suffix.length)
    if (!label || label.includes('.')) return null
    if (!validateSubdomain(label).valid) return null
    return normalizeSubdomain(label)
  }

  return null
}

/** Canonical public URL of a published project. Subdomain wins when set. */
export function publishedSiteUrl(project: {
  slug: string
  subdomain: string | null
}): string {
  return project.subdomain
    ? `https://${project.subdomain}.${SITES_SUBDOMAIN_BASE}`
    : `https://${SITES_DOMAIN}/${project.slug}`
}
