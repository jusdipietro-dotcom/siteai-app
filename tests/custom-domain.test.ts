import { describe, it, expect } from 'vitest'
import {
  normalizeCustomDomain,
  isValidCustomDomain,
  isCustomDomainHost,
  PLATFORM_DOMAIN,
} from '@/lib/custom-domain'
import { publishedSiteUrl } from '@/lib/site-domain'

describe('normalizeCustomDomain', () => {
  it('reduces raw input to a bare lowercase apex host', () => {
    expect(normalizeCustomDomain('  HTTPS://WWW.TuNegocio.com.ar/precios?x=1  ')).toBe('tunegocio.com.ar')
    expect(normalizeCustomDomain('tunegocio.com.ar:443')).toBe('tunegocio.com.ar')
    expect(normalizeCustomDomain('tunegocio.com.ar.')).toBe('tunegocio.com.ar')
  })

  it('returns empty for empty input', () => {
    expect(normalizeCustomDomain('')).toBe('')
    expect(normalizeCustomDomain('   ')).toBe('')
  })
})

describe('isValidCustomDomain — the security gate', () => {
  it('accepts real external FQDNs', () => {
    for (const d of ['tunegocio.com.ar', 'estudio.com', 'mi-negocio.com.ar', 'shop.tienda.io']) {
      expect(isValidCustomDomain(d), d).toBe(true)
    }
  })

  it('REFUSES the platform domain and any subdomain of it', () => {
    // This is the hijack guard: without it a project could claim a platform host
    // and, once the middleware routes unknown hosts by customDomain, answer for it.
    expect(isValidCustomDomain(PLATFORM_DOMAIN)).toBe(false)
    expect(isValidCustomDomain('automaticialab.com')).toBe(false)
    expect(isValidCustomDomain('juris.automaticialab.com')).toBe(false)
    expect(isValidCustomDomain('sites.automaticialab.com')).toBe(false)
    expect(isValidCustomDomain('cualquiera.automaticialab.com')).toBe(false)
  })

  it('rejects malformed values', () => {
    for (const d of ['', 'localhost', 'no-tld', 'espacios .com', 'a..b.com', '-bad.com', 'http://x.com']) {
      expect(isValidCustomDomain(d), d).toBe(false)
    }
  })
})

describe('isCustomDomainHost — middleware routing predicate', () => {
  it('is true only for external FQDNs, never platform hosts', () => {
    expect(isCustomDomainHost('tunegocio.com.ar')).toBe(true)
    expect(isCustomDomainHost('www.tunegocio.com.ar')).toBe(true)
    expect(isCustomDomainHost('tunegocio.com.ar:443')).toBe(true)
    expect(isCustomDomainHost('automaticialab.com')).toBe(false)
    expect(isCustomDomainHost('foo.automaticialab.com')).toBe(false)
    expect(isCustomDomainHost('localhost')).toBe(false)
    expect(isCustomDomainHost('')).toBe(false)
  })
})

describe('publishedSiteUrl — custom domain precedence', () => {
  it('uses an ACTIVE custom domain as canonical over subdomain and path', () => {
    expect(
      publishedSiteUrl({ slug: 'mi', subdomain: 'mi', customDomain: 'tunegocio.com.ar', customDomainStatus: 'active' })
    ).toBe('https://tunegocio.com.ar')
  })

  it('ignores a custom domain that is not active yet', () => {
    // pending/verified do not resolve, so canonical must not point at them.
    expect(
      publishedSiteUrl({ slug: 'mi', subdomain: 'mi', customDomain: 'tunegocio.com.ar', customDomainStatus: 'verified' })
    ).toBe('https://mi.sitios.automaticialab.com')
    expect(
      publishedSiteUrl({ slug: 'mi', subdomain: null, customDomain: 'tunegocio.com.ar', customDomainStatus: 'pending' })
    ).toBe('https://sites.automaticialab.com/mi')
  })

  it('is unchanged for projects without a custom domain', () => {
    expect(publishedSiteUrl({ slug: 'mi', subdomain: 'mi' })).toBe('https://mi.sitios.automaticialab.com')
    expect(publishedSiteUrl({ slug: 'mi', subdomain: null })).toBe('https://sites.automaticialab.com/mi')
  })
})
