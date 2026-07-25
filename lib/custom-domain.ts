/*
  Custom-domain helpers.

  A published site can be served on the owner's own domain, e.g.
  "tunegocio.com.ar" (Professional). These normalize and validate that domain,
  and — the security-critical part — refuse any host under the platform's own
  domain, so a project can never claim "automaticialab.com" or
  "juris.automaticialab.com" and, once the middleware routes unknown hosts by
  customDomain, start answering for the platform.
*/

export const PLATFORM_DOMAIN = 'automaticialab.com'

// Conservative FQDN: 2+ labels of a-z/0-9/hyphen (no leading/trailing hyphen),
// a TLD of 2+ letters, total length within DNS limits.
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

/**
 * Reduce raw input to a bare lowercase hostname: strips scheme, path, port, a
 * trailing dot and a leading "www." so the value is stored canonically on the
 * apex. Returns '' when nothing usable remains. Does NOT validate — pair it with
 * isValidCustomDomain.
 */
export function normalizeCustomDomain(input: string): string {
  if (!input) return ''
  let h = input.trim().toLowerCase()
  h = h.replace(/^https?:\/\//, '') // scheme
  h = h.replace(/[/?#].*$/, '') // path / query / fragment
  h = h.replace(/:\d+$/, '') // port
  h = h.replace(/\.$/, '') // FQDN root dot
  h = h.replace(/^www\./, '') // canonicalize onto the apex
  return h
}

/**
 * Valid when it is a well-formed FQDN AND is neither the platform domain nor a
 * subdomain of it. The platform check is not cosmetic: it is what stops a
 * project from setting customDomain to a platform host and hijacking it once the
 * middleware starts routing unknown hosts by customDomain.
 */
export function isValidCustomDomain(domain: string): boolean {
  if (!DOMAIN_RE.test(domain)) return false
  if (domain === PLATFORM_DOMAIN || domain.endsWith(`.${PLATFORM_DOMAIN}`)) return false
  return true
}

/**
 * Whether a request host should be resolved as a custom domain at all. Platform
 * hosts (automaticialab.com and any subdomain, plus bare localhost/IPs used in
 * dev) are never custom domains — only a real external FQDN is.
 */
export function isCustomDomainHost(hostname: string): boolean {
  const h = normalizeCustomDomain(hostname)
  if (!h) return false
  return isValidCustomDomain(h)
}
