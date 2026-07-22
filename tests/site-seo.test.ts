import { describe, it, expect, vi } from 'vitest'
import type { Project } from '@prisma/client'
import type { BusinessData } from '@/types'

/**
 * SEO output for published sites: keywords, share-card images, JSON-LD, robots.
 *
 * Two things are under test here and they are not the same kind of thing:
 *
 *   1. The PLAN GATE. Professional pays ARS 10.000/month more than Essential, so
 *      "an Essential site must not emit this" is a billing boundary, not a
 *      cosmetic one. Every Professional-only output is asserted twice — present
 *      for Professional, ABSENT for Essential.
 *
 *   2. The HONESTY RULE. Structured data is machine-readable claims about a real
 *      business, submitted to Google under that business's name. This product
 *      has previously shipped fabricated testimonials and invented statistics to
 *      a real law firm's live site. The tests below pin the shape of "we only
 *      say what the owner actually told us" so that cannot come back through
 *      JSON-LD, where nobody would see it.
 *
 * Prisma is stubbed because @/lib/published-site constructs a client at module
 * scope. Nothing here touches a database.
 */
vi.mock('@/lib/prisma', () => ({ prisma: { project: { findFirst: vi.fn(), update: vi.fn() } } }))

vi.stubEnv('NEXT_PUBLIC_SITES_DOMAIN', 'sites.automaticialab.com')
vi.stubEnv('NEXT_PUBLIC_SITES_SUBDOMAIN_BASE', 'sitios.automaticialab.com')

const {
  absoluteSiteImageUrl,
  buildSiteStructuredData,
  hasProfessionalSeo,
  parseSeoKeywords,
  schemaTypeForBusinessType,
  serializeJsonLd,
} = await import('@/lib/site-seo')

const { buildPublishedSiteMetadata, publishedSiteRobotsResponse } = await import(
  '@/lib/published-site'
)

const PATH_CANONICAL = 'https://sites.automaticialab.com/la-espiga'

/** A project row as the loaders hand it over: already gated, already parsed. */
function projectRow(
  overrides: Partial<Record<string, unknown>> = {},
  businessData: Partial<BusinessData> = {}
): Project {
  return {
    id: 'proj_test',
    name: 'La Espiga',
    slug: 'la-espiga',
    subdomain: null,
    status: 'published',
    plan: 'professional',
    hasPaid: true,
    businessData: JSON.stringify(businessData),
    sections: JSON.stringify([]),
    updatedAt: new Date('2026-07-22T12:00:00.000Z'),
    ...overrides,
  } as unknown as Project
}

// ─── Plan gate ───────────────────────────────────────────────────────────────

describe('hasProfessionalSeo — the paid-tier gate', () => {
  it('admits a paid Professional project', () => {
    expect(hasProfessionalSeo({ plan: 'professional', hasPaid: true })).toBe(true)
  })

  it.each([
    ['essential', 'essential'],
    ['free', 'free'],
    ['an unknown plan', 'enterprise'],
    ['no plan at all', null],
  ])('refuses %s', (_label, plan) => {
    expect(hasProfessionalSeo({ plan, hasPaid: true })).toBe(false)
  })

  it('requires hasPaid alongside the plan — not implied by it', () => {
    expect(hasProfessionalSeo({ plan: 'professional', hasPaid: false })).toBe(false)
    expect(hasProfessionalSeo({ plan: 'professional', hasPaid: null })).toBe(false)
    expect(hasProfessionalSeo({ plan: 'professional' })).toBe(false)
  })

  it('cannot be satisfied by a near-miss plan string', () => {
    expect(hasProfessionalSeo({ plan: 'Professional', hasPaid: true })).toBe(false)
    expect(hasProfessionalSeo({ plan: ' professional', hasPaid: true })).toBe(false)
  })
})

// ─── Keywords (the bug fix — applies to BOTH paid plans) ─────────────────────

describe('parseSeoKeywords', () => {
  it('splits the owner’s comma-separated list', () => {
    expect(parseSeoKeywords('panadería, masa madre, quilmes')).toEqual([
      'panadería',
      'masa madre',
      'quilmes',
    ])
  })

  it('drops empty entries and surrounding whitespace', () => {
    expect(parseSeoKeywords('  pan ,, , masa madre  ,')).toEqual(['pan', 'masa madre'])
  })

  it('de-duplicates case-insensitively, keeping the owner’s first casing', () => {
    expect(parseSeoKeywords('Pan, pan, PAN, Masa Madre')).toEqual(['Pan', 'Masa Madre'])
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['commas only', ',,,'],
    ['a non-string', 42],
  ])('returns nothing for %s', (_label, input) => {
    expect(parseSeoKeywords(input)).toEqual([])
  })
})

// ─── Share-card image ────────────────────────────────────────────────────────

describe('absoluteSiteImageUrl', () => {
  it('passes an absolute http(s) URL through untouched', () => {
    expect(absoluteSiteImageUrl('https://cdn.example.com/hero.jpg', PATH_CANONICAL)).toBe(
      'https://cdn.example.com/hero.jpg'
    )
  })

  it('resolves a root-relative path against the canonical ORIGIN, not its path', () => {
    // Matches what a browser does with the same value in an <img src>, so the
    // card image and the rendered hero are always the same file.
    expect(absoluteSiteImageUrl('/uploads/hero.jpg', PATH_CANONICAL)).toBe(
      'https://sites.automaticialab.com/uploads/hero.jpg'
    )
  })

  it('resolves against a subdomain canonical too', () => {
    expect(
      absoluteSiteImageUrl('/uploads/hero.jpg', 'https://espiga.sitios.automaticialab.com')
    ).toBe('https://espiga.sitios.automaticialab.com/uploads/hero.jpg')
  })

  it('rejects a data: image — safeImg allows it for <img>, no crawler can fetch it', () => {
    expect(absoluteSiteImageUrl('data:image/png;base64,iVBORw0KGgo=', PATH_CANONICAL)).toBeNull()
  })

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['a bare word', 'hero.jpg'],
    ['empty', ''],
    ['undefined', undefined],
    ['null', null],
  ])('returns null for %s', (_label, input) => {
    expect(absoluteSiteImageUrl(input, PATH_CANONICAL)).toBeNull()
  })
})

// ─── schema.org type selection ───────────────────────────────────────────────

describe('schemaTypeForBusinessType', () => {
  it.each([
    ['restaurante', 'Restaurant'],
    ['abogado', 'LegalService'],
    ['consultorio', 'MedicalBusiness'],
    ['contable', 'AccountingService'],
    ['inmobiliaria', 'RealEstateAgent'],
    ['gimnasio', 'ExerciseGym'],
    ['peluqueria', 'BeautySalon'],
    ['boutique', 'Store'],
  ])('maps %s to %s', (id, expected) => {
    expect(schemaTypeForBusinessType(id)).toBe(expected)
  })

  it.each([
    ['agencia — "Agencia / Startup" has no clean subtype', 'agencia'],
    ['arquitectura — ambiguous between practice and studio', 'arquitectura'],
    ['fotografo — schema.org has no photography business type', 'fotografo'],
    ['profesional — deliberately generic', 'profesional'],
    ['an unknown id', 'submarino'],
    ['undefined', undefined],
    ['an empty string', ''],
  ])('falls back to LocalBusiness for %s', (_label, id) => {
    expect(schemaTypeForBusinessType(id)).toBe('LocalBusiness')
  })

  it('does not resolve inherited Object.prototype keys into a type', () => {
    // A bare `map[id]` returns a truthy *function* for these, which would put
    // that function's source into `@type`. Same hazard lib/website-plans.ts
    // documents for WEBSITE_PLANS.
    for (const key of ['toString', 'constructor', 'valueOf', '__proto__', 'hasOwnProperty']) {
      expect(schemaTypeForBusinessType(key)).toBe('LocalBusiness')
    }
  })
})

// ─── JSON-LD: shape ──────────────────────────────────────────────────────────

const fullBusiness: Partial<BusinessData> = {
  name: 'Panadería La Espiga',
  businessType: 'restaurante',
  description: 'Panadería de barrio desde 1998.',
  contact: {
    phone: '+54 11 4444-5555',
    whatsapp: '+54 9 11 4444 5555',
    email: 'hola@laespiga.test',
    address: 'Av. Mitre 1200',
    city: 'Quilmes',
    province: 'Buenos Aires',
    country: 'Argentina',
    schedule: 'Lun a Sáb 7 a 20',
  },
  seo: {
    title: 'Panadería La Espiga',
    description: 'Pan de masa madre en Quilmes.',
    keywords: 'panadería, masa madre',
    sitemapEnabled: true,
  },
}

const buildFull = () =>
  buildSiteStructuredData({
    name: 'Panadería La Espiga',
    businessData: fullBusiness,
    canonical: PATH_CANONICAL,
    image: 'https://cdn.example.com/hero.jpg',
    sameAs: ['https://instagram.com/laespiga', 'https://facebook.com/laespiga'],
  })

describe('buildSiteStructuredData — a fully described business', () => {
  it('emits a valid, complete LocalBusiness node', () => {
    expect(buildFull()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'Panadería La Espiga',
      url: PATH_CANONICAL,
      description: 'Pan de masa madre en Quilmes.',
      telephone: '+54 11 4444-5555',
      email: 'hola@laespiga.test',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Mitre 1200',
        addressLocality: 'Quilmes',
        addressRegion: 'Buenos Aires',
        addressCountry: 'Argentina',
      },
      image: 'https://cdn.example.com/hero.jpg',
      sameAs: ['https://instagram.com/laespiga', 'https://facebook.com/laespiga'],
    })
  })

  it('prefers the SEO description over the page description', () => {
    expect(buildFull()!.description).toBe('Pan de masa madre en Quilmes.')
  })

  it('falls back to the page description when no SEO description was written', () => {
    const data = buildSiteStructuredData({
      name: 'X',
      businessData: { ...fullBusiness, seo: { ...fullBusiness.seo!, description: '' } },
      canonical: PATH_CANONICAL,
      image: null,
      sameAs: [],
    })
    expect(data!.description).toBe('Panadería de barrio desde 1998.')
  })
})

// ─── JSON-LD: THE HONESTY RULE ───────────────────────────────────────────────

describe('buildSiteStructuredData — omits what the owner never provided', () => {
  const sparse = () =>
    buildSiteStructuredData({
      name: 'Kiosco Don Pepe',
      businessData: { name: 'Kiosco Don Pepe' },
      canonical: PATH_CANONICAL,
      image: null,
      sameAs: [],
    })

  it('emits ONLY identity and URL for a business with nothing else filled in', () => {
    expect(sparse()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Kiosco Don Pepe',
      url: PATH_CANONICAL,
    })
  })

  it.each(['description', 'telephone', 'email', 'address', 'image', 'sameAs'])(
    'omits the %s key entirely rather than emitting a blank value',
    (key) => {
      expect(sparse()).not.toHaveProperty(key)
    }
  )

  it('treats whitespace-only owner input as absent', () => {
    const data = buildSiteStructuredData({
      name: 'Kiosco',
      businessData: {
        name: 'Kiosco',
        description: '   ',
        contact: { phone: '  ', email: '', address: '   ', city: '', province: '', country: '', whatsapp: '' },
      },
      canonical: PATH_CANONICAL,
      image: null,
      sameAs: ['  ', ''],
    })
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Kiosco',
      url: PATH_CANONICAL,
    })
  })

  it('omits the whole address node when no component exists, and partials when some do', () => {
    const partial = buildSiteStructuredData({
      name: 'Kiosco',
      businessData: {
        name: 'Kiosco',
        contact: { city: 'Quilmes' } as BusinessData['contact'],
      },
      canonical: PATH_CANONICAL,
      image: null,
      sameAs: [],
    })
    // Only the component the owner actually gave — no invented street or country.
    expect(partial!.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Quilmes' })
  })

  it('returns null when the business has no name — an identity-less node says nothing', () => {
    for (const name of ['', '   ']) {
      expect(
        buildSiteStructuredData({
          name,
          businessData: {},
          canonical: PATH_CANONICAL,
          image: null,
          sameAs: [],
        })
      ).toBeNull()
    }
  })

  /**
   * The load-bearing test of this whole change.
   *
   * `testimonials` carry a `rating` and `contact.schedule` carries hours — both
   * are RIGHT THERE and both are tempting to aggregate. Neither is a verifiable
   * claim: testimonials are typed into an editor by the business owner, and the
   * schedule is free text whose "7" could be 07:00 or 19:00. Emitting either
   * would put unearned star ratings and guessed hours into Google's index.
   */
  it('NEVER emits ratings, reviews, hours, geo or price range — even when the data is present', () => {
    const data = buildSiteStructuredData({
      name: 'Panadería La Espiga',
      businessData: {
        ...fullBusiness,
        testimonials: [
          { id: 't1', author: 'Carla', role: 'Vecina', content: 'El mejor pan.', rating: 5 },
          { id: 't2', author: 'Lucía', role: 'Oficina', content: 'Perfecto.', rating: 4 },
        ],
        services: [
          { id: 's1', name: 'Pan', description: 'Masa madre', price: '$3.500' },
          { id: 's2', name: 'Torta', description: 'Por encargo', price: '$12.000' },
        ],
        stats: [{ id: 'st1', number: '+25', label: 'Años horneando' }],
      },
      canonical: PATH_CANONICAL,
      image: null,
      sameAs: [],
    })!

    for (const forbidden of [
      'aggregateRating',
      'review',
      'reviews',
      'ratingValue',
      'reviewCount',
      'openingHours',
      'openingHoursSpecification',
      'geo',
      'latitude',
      'longitude',
      'priceRange',
    ]) {
      expect(data).not.toHaveProperty(forbidden)
    }

    // And nothing sneaks in through a nested node either.
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|ratingValue|openingHours|priceRange|geo/i)
  })
})

// ─── JSON-LD: schema.org conformance ─────────────────────────────────────────

/**
 * Structural conformance to the real schema.org vocabulary.
 *
 * Every name below was checked against schema.org's own type/property pages
 * (2026-07), not against memory. The point of pinning them here is that JSON-LD
 * fails SILENTLY: an invented property does not throw, does not break the page
 * and is not visible to anyone — Google simply ignores it, or worse, penalises
 * the claim. This is the test that makes a bad addition loud.
 */
describe('buildSiteStructuredData — schema.org conformance', () => {
  /** Verified subtypes of LocalBusiness, with the chain each one sits on. */
  const VERIFIED_TYPES: Record<string, string> = {
    LocalBusiness: 'Thing > Organization|Place > LocalBusiness',
    Restaurant: 'LocalBusiness > FoodEstablishment > Restaurant',
    LegalService: 'LocalBusiness > LegalService',
    MedicalBusiness: 'LocalBusiness > MedicalBusiness',
    AccountingService: 'LocalBusiness > FinancialService > AccountingService',
    RealEstateAgent: 'LocalBusiness > RealEstateAgent',
    ExerciseGym: 'LocalBusiness > SportsActivityLocation > ExerciseGym',
    BeautySalon: 'LocalBusiness > HealthAndBeautyBusiness > BeautySalon',
    Store: 'LocalBusiness > Store',
  }

  /**
   * Properties valid on LocalBusiness, with the type that declares each.
   * A key emitted outside this set is either a typo or an invented claim.
   */
  const VERIFIED_PROPERTIES = new Set([
    '@context',
    '@type',
    'name', // Thing
    'url', // Thing
    'description', // Thing
    'image', // Thing
    'sameAs', // Thing
    'telephone', // Organization + Place
    'email', // Organization
    'address', // Organization + Place, expects PostalAddress
  ])

  const VERIFIED_ADDRESS_PROPERTIES = new Set([
    '@type',
    'streetAddress',
    'addressLocality',
    'addressRegion',
    'addressCountry',
  ])

  it('uses the canonical https context string', () => {
    expect(buildFull()!['@context']).toBe('https://schema.org')
  })

  it('only ever emits a @type that is a real LocalBusiness subtype', () => {
    const ids = [
      'restaurante', 'abogado', 'consultorio', 'contable', 'inmobiliaria',
      'gimnasio', 'peluqueria', 'boutique', 'agencia', 'arquitectura',
      'fotografo', 'profesional', 'unknown-rubro', '',
    ]
    for (const id of ids) {
      expect(Object.keys(VERIFIED_TYPES)).toContain(schemaTypeForBusinessType(id))
    }
  })

  it('emits no property outside the verified LocalBusiness set', () => {
    for (const key of Object.keys(buildFull()!)) {
      expect(VERIFIED_PROPERTIES).toContain(key)
    }
  })

  it('emits no PostalAddress sub-property outside the verified set', () => {
    const address = buildFull()!.address as Record<string, unknown>
    expect(address['@type']).toBe('PostalAddress')
    for (const key of Object.keys(address)) {
      expect(VERIFIED_ADDRESS_PROPERTIES).toContain(key)
    }
  })

  it('always carries the two properties Google requires, when the owner supplied them', () => {
    // Google's LocalBusiness guidelines require exactly `name` and `address`.
    // We cannot fabricate an address, so a business that never entered one
    // emits a valid node WITHOUT it and forfeits the rich result — see the
    // sparse-business tests above. That is the deliberate tradeoff: a correct
    // node that wins less, never an invented node that wins more.
    const full = buildFull()!
    expect(full.name).toBeTruthy()
    expect(full.address).toBeTruthy()
  })
})

// ─── JSON-LD: injection guard ────────────────────────────────────────────────

describe('serializeJsonLd — script-breakout guard', () => {
  const hostile = 'Bar </script><script>alert(1)</script>'

  it('escapes every < so a business name cannot close the script element', () => {
    const out = serializeJsonLd(
      buildSiteStructuredData({
        name: hostile,
        businessData: { name: hostile },
        canonical: PATH_CANONICAL,
        image: null,
        sameAs: [],
      })
    )

    // `<` is the whole vector: the HTML tokenizer ends script data at `</script`
    // and starts escaped-script-data at `<!--`. With no `<` left in the payload,
    // neither sequence can exist. A bare `>` is inert, so it stays readable.
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
    expect(out).toContain('\\u003c/script>')
  })

  it('proves a bare JSON.stringify would NOT have been enough', () => {
    // The premise of the guard: this is what the GA snippet's pattern produces.
    expect(JSON.stringify({ name: hostile })).toContain('</script>')
  })

  it('round-trips: escaping is presentation only, the parsed value is unchanged', () => {
    const out = serializeJsonLd({ name: hostile, url: 'https://x.test/?a=1&b=2' })
    expect(JSON.parse(out)).toEqual({ name: hostile, url: 'https://x.test/?a=1&b=2' })
  })

  it('escapes the U+2028/U+2029 line separators JSON.stringify emits raw', () => {
    const value = `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c`
    const out = serializeJsonLd({ value })
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
    expect(JSON.parse(out).value).toBe(value)
  })

  it('neutralises an HTML comment opener too', () => {
    expect(serializeJsonLd({ name: '<!--' })).not.toContain('<!--')
  })
})

// ─── Metadata: keywords for both plans, share image for Professional only ────

describe('buildPublishedSiteMetadata — keywords', () => {
  const withKeywords = (plan: string) =>
    buildPublishedSiteMetadata(
      projectRow({ plan }, {
        name: 'La Espiga',
        seo: {
          title: 'Panadería La Espiga',
          description: 'Pan de masa madre.',
          keywords: 'panadería, masa madre, quilmes',
          sitemapEnabled: true,
        },
      } as Partial<BusinessData>)
    )

  it.each(['essential', 'professional'])(
    'emits the owner’s keywords for a %s site — they were collected and never shipped',
    (plan) => {
      expect(withKeywords(plan).keywords).toEqual(['panadería', 'masa madre', 'quilmes'])
    }
  )

  it('omits the keywords key entirely when the owner wrote none', () => {
    const meta = buildPublishedSiteMetadata(
      projectRow({}, { seo: { title: '', description: '', keywords: '', sitemapEnabled: true } } as Partial<BusinessData>)
    )
    expect(meta).not.toHaveProperty('keywords')
  })
})

describe('buildPublishedSiteMetadata — share-card image is Professional only', () => {
  const build = (plan: string, heroImage?: string) =>
    buildPublishedSiteMetadata(
      projectRow({ plan }, { name: 'La Espiga', heroImage } as Partial<BusinessData>)
    )

  it('gives a Professional site an absolute og:image and twitter:image', () => {
    const meta = build('professional', 'https://cdn.example.com/hero.jpg')
    expect(meta.openGraph).toMatchObject({ images: ['https://cdn.example.com/hero.jpg'] })
    expect(meta.twitter).toMatchObject({ images: ['https://cdn.example.com/hero.jpg'] })
  })

  it('gives an Essential site NO image tags, even with the same hero image', () => {
    const meta = build('essential', 'https://cdn.example.com/hero.jpg')
    expect(meta.openGraph).not.toHaveProperty('images')
    expect(meta.twitter).not.toHaveProperty('images')
  })

  it('gives an unpaid Professional site no image tags', () => {
    const meta = buildPublishedSiteMetadata(
      projectRow({ plan: 'professional', hasPaid: false }, {
        heroImage: 'https://cdn.example.com/hero.jpg',
      } as Partial<BusinessData>)
    )
    expect(meta.openGraph).not.toHaveProperty('images')
  })

  it('omits the image tags when the hero image is unusable, rather than emitting a blank', () => {
    for (const hero of [undefined, '', 'javascript:alert(1)', 'data:image/png;base64,iVBORw0KGgo=']) {
      const meta = build('professional', hero)
      expect(meta.openGraph).not.toHaveProperty('images')
      expect(meta.twitter).not.toHaveProperty('images')
    }
  })

  it('still emits the title/description card for both plans — that predates the gate', () => {
    for (const plan of ['essential', 'professional']) {
      expect(build(plan)).toMatchObject({
        openGraph: { type: 'website', url: PATH_CANONICAL },
        twitter: { card: 'summary_large_image' },
      })
    }
  })
})

// ─── robots.txt ──────────────────────────────────────────────────────────────

describe('publishedSiteRobotsResponse — Professional only', () => {
  const seoOn = { seo: { title: '', description: '', keywords: '', sitemapEnabled: true } } as Partial<BusinessData>

  it('serves robots.txt for a paid Professional site, pointing at its own sitemap', async () => {
    const res = publishedSiteRobotsResponse(projectRow({}, seoOn))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(await res.text()).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://sites.automaticialab.com/la-espiga/sitemap.xml\n'
    )
  })

  it('uses the subdomain canonical when the project has one', async () => {
    const res = publishedSiteRobotsResponse(projectRow({ subdomain: 'espiga' }, seoOn))
    expect(await res.text()).toContain(
      'Sitemap: https://espiga.sitios.automaticialab.com/sitemap.xml'
    )
  })

  it.each([
    ['an Essential site', { plan: 'essential' }],
    ['a free site', { plan: 'free' }],
    ['an unpaid Professional site', { plan: 'professional', hasPaid: false }],
  ])('404s for %s — indistinguishable from a site that does not exist', (_label, overrides) => {
    const res = publishedSiteRobotsResponse(projectRow(overrides, seoOn))
    expect(res.status).toBe(404)
  })

  it('404s when the gate handed over nothing', () => {
    expect(publishedSiteRobotsResponse(null).status).toBe(404)
  })

  it('omits the Sitemap line when the owner disabled the sitemap — never points at a 404', async () => {
    const res = publishedSiteRobotsResponse(
      projectRow({}, { seo: { title: '', description: '', keywords: '', sitemapEnabled: false } } as Partial<BusinessData>)
    )
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toBe('User-agent: *\nAllow: /\n')
    expect(body).not.toContain('Sitemap:')
  })

  it('survives a corrupt businessData column instead of throwing', async () => {
    const res = publishedSiteRobotsResponse(projectRow({ businessData: '{not json' }))
    expect(res.status).toBe(200)
    expect(await res.text()).not.toContain('Sitemap:')
  })
})
