import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  SITES_DOMAIN,
  SITES_SUBDOMAIN_BASE,
  extractSiteSubdomain,
  isSitesPathHost,
  publishedSiteUrl,
} from '@/lib/site-domain'

/**
 * Host -> tenant resolution. A bug here serves one client's site on another
 * client's domain, or serves a client's site on an infrastructure host.
 *
 * These tests assert against the configured constants rather than hardcoded
 * literals, so changing NEXT_PUBLIC_SITES_DOMAIN does not falsely break them.
 */

describe('isSitesPathHost', () => {
  it('matches the configured path host', () => {
    expect(isSitesPathHost(SITES_DOMAIN)).toBe(true)
  })

  it('matches its www form', () => {
    expect(isSitesPathHost(`www.${SITES_DOMAIN}`)).toBe(true)
  })

  it('is case-insensitive — Host headers are not normalised by the client', () => {
    expect(isSitesPathHost(SITES_DOMAIN.toUpperCase())).toBe(true)
    expect(isSitesPathHost('SiTeS.AutomaticiaLab.CoM')).toBe(true)
  })

  it('tolerates a :port suffix', () => {
    expect(isSitesPathHost(`${SITES_DOMAIN}:3000`)).toBe(true)
    expect(isSitesPathHost(`${SITES_DOMAIN}:443`)).toBe(true)
  })

  it('tolerates a trailing dot — "example.com." names the same host', () => {
    expect(isSitesPathHost(`${SITES_DOMAIN}.`)).toBe(true)
    expect(isSitesPathHost(`${SITES_DOMAIN}.:3000`)).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isSitesPathHost(`  ${SITES_DOMAIN}  `)).toBe(true)
  })

  /**
   * THE historical bug: the check used to be
   * `hostname.startsWith('sites.automaticialab')`, which happily matched an
   * attacker-controlled host that merely began with it. Anyone who could point
   * such a name at this server got the sites-host routing branch.
   */
  it('does NOT match a host that merely STARTS WITH the sites domain', () => {
    expect(isSitesPathHost(`${SITES_DOMAIN}.attacker.tld`)).toBe(false)
    expect(isSitesPathHost(`${SITES_DOMAIN}.evil.com`)).toBe(false)
    expect(isSitesPathHost('sites.automaticialab.com.attacker.tld')).toBe(false)
    expect(isSitesPathHost('sites.automaticialab.com.evil.tld:8080')).toBe(false)
  })

  it('does not match a host that merely ENDS WITH the sites domain', () => {
    expect(isSitesPathHost(`attacker.${SITES_DOMAIN}`)).toBe(false)
    expect(isSitesPathHost(`evilsites.automaticialab.com`)).toBe(false)
  })

  it('rejects unrelated and empty hosts', () => {
    expect(isSitesPathHost('automaticialab.com')).toBe(false)
    expect(isSitesPathHost('example.com')).toBe(false)
    expect(isSitesPathHost('')).toBe(false)
  })
})

describe('extractSiteSubdomain', () => {
  it('extracts a single-label subdomain of the configured base', () => {
    expect(extractSiteSubdomain(`panaderia.${SITES_SUBDOMAIN_BASE}`)).toBe('panaderia')
  })

  it('lowercases the label — stored subdomains are lowercase', () => {
    expect(extractSiteSubdomain(`Panaderia.${SITES_SUBDOMAIN_BASE}`)).toBe('panaderia')
    expect(extractSiteSubdomain(`PANADERIA.${SITES_SUBDOMAIN_BASE.toUpperCase()}`)).toBe(
      'panaderia'
    )
  })

  it('strips a :port suffix', () => {
    expect(extractSiteSubdomain(`panaderia.${SITES_SUBDOMAIN_BASE}:3000`)).toBe('panaderia')
  })

  it('strips a trailing dot', () => {
    expect(extractSiteSubdomain(`panaderia.${SITES_SUBDOMAIN_BASE}.`)).toBe('panaderia')
    expect(extractSiteSubdomain(`panaderia.${SITES_SUBDOMAIN_BASE}.:3000`)).toBe('panaderia')
  })

  it('tolerates surrounding whitespace', () => {
    expect(extractSiteSubdomain(`  panaderia.${SITES_SUBDOMAIN_BASE}  `)).toBe('panaderia')
  })

  it('returns null for the bare base host — the base itself is not a tenant', () => {
    expect(extractSiteSubdomain(SITES_SUBDOMAIN_BASE)).toBeNull()
    expect(extractSiteSubdomain(`${SITES_SUBDOMAIN_BASE}.`)).toBeNull()
  })

  /**
   * Multi-level hosts must not resolve. Stored subdomains are a single RFC 1123
   * label, so `a.b.sitios…` can only ever be a misconfiguration or an attempt to
   * confuse the lookup.
   */
  it('rejects multi-level hosts', () => {
    expect(extractSiteSubdomain(`a.b.${SITES_SUBDOMAIN_BASE}`)).toBeNull()
    expect(extractSiteSubdomain(`x.y.z.${SITES_SUBDOMAIN_BASE}`)).toBeNull()
  })

  /**
   * Same suffix-vs-prefix confusion as isSitesPathHost. A host merely
   * CONTAINING the base must never resolve to a tenant.
   */
  it('does NOT match a host that merely starts with or contains the base', () => {
    expect(extractSiteSubdomain(`${SITES_SUBDOMAIN_BASE}.attacker.tld`)).toBeNull()
    expect(extractSiteSubdomain(`foo.${SITES_SUBDOMAIN_BASE}.attacker.tld`)).toBeNull()
    expect(extractSiteSubdomain('sitios.automaticialab.com.evil.tld')).toBeNull()
  })

  it('does not match a lookalike base (no dot separator before the base)', () => {
    // "evilsitios.automaticialab.com" ends with "sitios.automaticialab.com" as a
    // raw string but is NOT a subdomain of it.
    expect(extractSiteSubdomain('evilsitios.automaticialab.com')).toBeNull()
  })

  it('returns null for unrelated hosts', () => {
    expect(extractSiteSubdomain('example.com')).toBeNull()
    expect(extractSiteSubdomain(SITES_DOMAIN)).toBeNull()
    expect(extractSiteSubdomain('')).toBeNull()
    expect(extractSiteSubdomain('   ')).toBeNull()
  })

  /**
   * The extractor is gated by the same validator that guards writes. A label
   * that could never have been stored must never produce a lookup — otherwise a
   * request for `www.sitios…` would query for the tenant "www".
   */
  it('rejects reserved labels — they can never be a tenant', () => {
    for (const reserved of ['www', 'api', 'admin', 'mcp', 'n8n', 'easypanel']) {
      expect(extractSiteSubdomain(`${reserved}.${SITES_SUBDOMAIN_BASE}`)).toBeNull()
    }
  })

  it('rejects malformed labels', () => {
    for (const bad of ['ab', '-foo', 'foo-', 'foo--bar', 'a'.repeat(64)]) {
      expect(extractSiteSubdomain(`${bad}.${SITES_SUBDOMAIN_BASE}`)).toBeNull()
    }
  })
})

describe('extractSiteSubdomain — dev bases', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('accepts localhost/lvh.me outside production so routing is testable without DNS', () => {
    expect(extractSiteSubdomain('panaderia.localhost:3000')).toBe('panaderia')
    expect(extractSiteSubdomain('panaderia.lvh.me:3000')).toBe('panaderia')
  })

  it('does NOT accept them in a production build', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const prod = await import('@/lib/site-domain')

    expect(prod.extractSiteSubdomain('panaderia.localhost:3000')).toBeNull()
    expect(prod.extractSiteSubdomain('panaderia.lvh.me:3000')).toBeNull()
    // The real base still resolves.
    expect(prod.extractSiteSubdomain(`panaderia.${SITES_SUBDOMAIN_BASE}`)).toBe('panaderia')
  })
})

describe('publishedSiteUrl', () => {
  it('prefers the subdomain when one is set', () => {
    expect(publishedSiteUrl({ slug: 'mi-slug', subdomain: 'panaderia' })).toBe(
      `https://panaderia.${SITES_SUBDOMAIN_BASE}`
    )
  })

  it('falls back to the path host when there is no subdomain', () => {
    expect(publishedSiteUrl({ slug: 'mi-slug', subdomain: null })).toBe(
      `https://${SITES_DOMAIN}/mi-slug`
    )
  })

  it('always produces https', () => {
    expect(publishedSiteUrl({ slug: 's', subdomain: null }).startsWith('https://')).toBe(true)
    expect(publishedSiteUrl({ slug: 's', subdomain: 'x' }).startsWith('https://')).toBe(true)
  })

  /**
   * Round-trip: the canonical URL a project advertises must resolve back to
   * that same project. If these two ever disagree, a site declares a canonical
   * host that serves someone else.
   */
  it('round-trips through extractSiteSubdomain', () => {
    const sub = 'panaderia'
    const url = publishedSiteUrl({ slug: 'ignored', subdomain: sub })
    const host = new URL(url).host
    expect(extractSiteSubdomain(host)).toBe(sub)
  })

  it('round-trips through isSitesPathHost for path-addressed projects', () => {
    const url = publishedSiteUrl({ slug: 'mi-slug', subdomain: null })
    expect(isSitesPathHost(new URL(url).host)).toBe(true)
  })
})
