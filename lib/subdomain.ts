/**
 * Subdomain normalization and validation for {subdomain}.sitios.automaticialab.com.
 *
 * Storage and comparison are ALWAYS lowercase. Postgres unique indexes are
 * case-sensitive, so `normalizeSubdomain` is the only thing preventing "Foo"
 * and "foo" from being two different rows pointing at the same host.
 */

export const SUBDOMAIN_MIN_LENGTH = 3
export const SUBDOMAIN_MAX_LENGTH = 63

/**
 * Names that must never be handed to a client.
 *
 * Beyond the usual web/infra conventions this includes the services this VPS
 * already serves on sibling subdomains (siteai, mcp, evo, juris, causas,
 * turnos, n8n, easypanel). A client claiming one of those would hijack a live
 * service, so these are not optional.
 */
export const RESERVED_SUBDOMAINS = new Set<string>([
  // Web / protocol conventions
  'www',
  'api',
  'admin',
  'app',
  'apps',
  'mail',
  'email',
  'smtp',
  'imap',
  'ftp',
  'ns',
  'ns1',
  'ns2',
  'dns',
  // Assets / content
  'cdn',
  'static',
  'assets',
  'media',
  'img',
  'images',
  'blog',
  'docs',
  'help',
  'support',
  'status',
  // Product surfaces
  'dashboard',
  'panel',
  'login',
  'logout',
  'auth',
  'signin',
  'signup',
  'account',
  'billing',
  'pay',
  'payment',
  'checkout',
  'webhook',
  'webhooks',
  // Environments
  'test',
  'dev',
  'staging',
  'demo',
  'sites',
  'site',
  'portal',
  // Live infrastructure on this domain — hijacking risk
  'siteai',
  'mcp',
  'evo',
  'juris',
  'causas',
  'turnos',
  'n8n',
  'easypanel',
  // System / abuse handling
  'root',
  'system',
  'security',
  'abuse',
  'postmaster',
  'hostmaster',
])

/**
 * Trim + lowercase. The canonical form used for storage, comparison and the
 * reserved-word check.
 */
export function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase()
}

/** True if the normalized form of `input` is reserved. */
export function isReservedSubdomain(input: string): boolean {
  return RESERVED_SUBDOMAINS.has(normalizeSubdomain(input))
}

export interface SubdomainValidation {
  valid: boolean
  reason?: string
}

/**
 * Validates a subdomain against RFC 1123 label rules and the reserved list.
 *
 * The input is normalized first, so "WWW" is judged exactly as "www" — both
 * for the character rules and for the reserved check. This is the single
 * entry point on purpose: a caller cannot pass the format check and forget
 * the reserved check.
 */
export function validateSubdomain(input: string): SubdomainValidation {
  if (typeof input !== 'string') {
    return { valid: false, reason: 'El subdominio debe ser texto' }
  }

  const value = normalizeSubdomain(input)

  if (value.length < SUBDOMAIN_MIN_LENGTH) {
    return { valid: false, reason: `El subdominio debe tener al menos ${SUBDOMAIN_MIN_LENGTH} caracteres` }
  }
  if (value.length > SUBDOMAIN_MAX_LENGTH) {
    return { valid: false, reason: `El subdominio no puede superar los ${SUBDOMAIN_MAX_LENGTH} caracteres` }
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return { valid: false, reason: 'Solo se permiten letras, números y guiones' }
  }
  if (value.startsWith('-') || value.endsWith('-')) {
    return { valid: false, reason: 'El subdominio no puede empezar ni terminar con guión' }
  }
  if (value.includes('--')) {
    return { valid: false, reason: 'El subdominio no puede tener dos guiones seguidos' }
  }
  if (RESERVED_SUBDOMAINS.has(value)) {
    return { valid: false, reason: 'Ese subdominio está reservado' }
  }

  return { valid: true }
}
