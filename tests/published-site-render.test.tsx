import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Project } from '@prisma/client'
import type { BusinessData, SectionConfig } from '@/types'

/**
 * Whole-document snapshot of the published renderer.
 *
 * WHY THIS EXISTS: the section markup was extracted into eleven files under
 * components/site/sections/. Each one can now be edited on its own, and nothing
 * else in the suite renders them — a change to spacing, a dropped field, an
 * anchor rename or a section that silently stops rendering would ship unnoticed.
 * This is the one test that sees the assembled page, so it is the tripwire for
 * all eleven at once.
 *
 * It is a snapshot rather than a pile of assertions on purpose: the thing being
 * protected is "the markup did not change", and enumerating every element would
 * be both unreadable and less complete. The targeted assertions below cover the
 * decisions the snapshot cannot explain on its own — ordering, content gating,
 * URL validation — so a failure says WHICH rule broke, not just "output differs".
 *
 * Prisma is stubbed because @/lib/published-site (imported for parseJSON)
 * constructs a client at module scope. Nothing here touches a database.
 */
vi.mock('@/lib/prisma', () => ({ prisma: { project: { findFirst: vi.fn(), update: vi.fn() } } }))

// The published document embeds its canonical URL (sitemap link). Pinned so the
// snapshot does not encode whatever domain the machine running the tests has.
vi.stubEnv('NEXT_PUBLIC_SITES_DOMAIN', 'sites.automaticialab.com')
vi.stubEnv('NEXT_PUBLIC_SITES_SUBDOMAIN_BASE', 'sitios.automaticialab.com')

const { PublishedSite } = await import('@/components/site/PublishedSite')

/** The footer renders the current year. Pinned so the snapshot survives Jan 1. */
const NOW = new Date('2026-07-22T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * Deliberately out of array order: the renderer must sort by `order`, so the
 * array order and the rendered order disagree on purpose. `pricing` is declared
 * first but renders ninth.
 */
const sections: SectionConfig[] = [
  { id: 'pricing',      label: 'Precios',         description: '', enabled: true,  required: false, order: 8 },
  { id: 'hero',         label: 'Hero',            description: '', enabled: true,  required: true,  order: 0 },
  { id: 'footer',       label: 'Footer',          description: '', enabled: true,  required: true,  order: 99 },
  { id: 'faq',          label: 'Preguntas',       description: '', enabled: true,  required: false, order: 10 },
  { id: 'stats',        label: 'Números',         description: '', enabled: true,  required: false, order: 2 },
  { id: 'about',        label: 'Nosotros',        description: '', enabled: true,  required: false, order: 1 },
  { id: 'team',         label: 'Equipo',          description: '', enabled: true,  required: false, order: 7 },
  { id: 'contact',      label: 'Contacto',        description: '', enabled: true,  required: true,  order: 12 },
  { id: 'services',     label: 'Servicios',       description: '', enabled: true,  required: false, order: 3 },
  { id: 'gallery',      label: 'Galería',         description: '', enabled: true,  required: false, order: 6 },
  { id: 'cta',          label: 'Cierre',          description: '', enabled: true,  required: false, order: 11 },
  { id: 'testimonials', label: 'Testimonios',     description: '', enabled: true,  required: false, order: 9 },
  { id: 'features',     label: 'Características', description: '', enabled: true,  required: false, order: 4 },
  // Enabled=false with real content behind it: proves the gate is the flag, not
  // the data. If this ever appears in the snapshot, section gating regressed.
  { id: 'about',        label: 'Nosotros (off)',  description: '', enabled: false, required: false, order: 5 },
]

const businessData: BusinessData = {
  name: 'Panadería La Espiga',
  tagline: 'Pan de masa madre, todos los días',
  description: 'Somos una panadería de barrio desde 1998. Amasamos a mano y horneamos dos veces por día.',
  businessType: 'Panadería',
  heroImage: 'https://cdn.example.com/hero.jpg',
  galleryImages: [
    'https://cdn.example.com/g1.jpg',
    '/uploads/g2.jpg',
    'data:image/png;base64,iVBORw0KGgo=',
    // Must be dropped by safeImg — never reaches a src.
    'javascript:alert(1)',
  ],
  services: [
    // Priced and unpriced on purpose: pricing renders only the priced ones,
    // services renders all of them.
    { id: 'sv1', name: 'Panificados', description: 'Masa madre y baguettes.', price: '$3.500', emoji: '🥖' },
    { id: 'sv2', name: 'Pastelería',  description: 'Tortas por encargo.',     price: '$12.000' },
    { id: 'sv3', name: 'Catering',    description: 'Desayunos para oficinas.' },
    { id: 'sv4', name: 'Cursos',      description: 'Taller de masa madre.',   price: '$25.000' },
  ],
  team: [
    { id: 'tm1', name: 'Marta Ruiz',  role: 'Maestra panadera', bio: 'Veinte años al horno.', image: 'https://cdn.example.com/marta.jpg' },
    { id: 'tm2', name: 'Julián Paz',  role: 'Pastelero' },
    // Unusable photo: must fall back to the initial avatar, not render a src.
    { id: 'tm3', name: 'Ana Coria',   role: 'Atención al público', image: 'javascript:alert(2)' },
  ],
  testimonials: [
    { id: 'ts1', author: 'Carla',  role: 'Vecina',   content: 'El mejor pan del barrio.', rating: 5 },
    // rating 0 must render the quote with NO star row at all.
    { id: 'ts2', author: 'Diego',  role: 'Cliente',  content: 'Siempre fresco.',          rating: 0 },
    { id: 'ts3', author: 'Lucía',  role: 'Oficina',  content: 'El catering salió perfecto.', rating: 4 },
  ],
  faqs: [
    { id: 'fq1', question: '¿Hacen envíos?', answer: 'Sí, en un radio de 3 km.' },
    { id: 'fq2', question: '¿Aceptan encargos?', answer: 'Con 48 horas de anticipación.' },
  ],
  stats: [
    { id: 'st1', number: '+25', label: 'Años horneando' },
    { id: 'st2', number: '2',   label: 'Hornadas por día' },
    { id: 'st3', number: '+800', label: 'Clientes por semana' },
    { id: 'st4', number: '100%', label: 'Masa madre' },
  ],
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
  // Every platform, and deliberately mixed shapes: bare handles, @handles and
  // full URLs all have to normalise.
  socials: {
    instagram: '@laespiga',
    facebook: 'facebook.com/laespiga',
    linkedin: 'https://linkedin.com/company/laespiga',
    twitter: '@laespiga',
    tiktok: 'laespiga',
    youtube: 'https://youtube.com/@laespiga',
  },
  seo: {
    title: 'Panadería La Espiga',
    description: 'Pan de masa madre en Quilmes.',
    keywords: 'panadería, masa madre, quilmes',
    sitemapEnabled: true,
  },
  branding: {
    primaryColor: '#c2410c',
    fontHeading: 'playfair',
    fontBody: 'dm-sans',
    tone: 'amigable',
    colorTheme: 'indigo',
  },
  gaId: 'G-TEST12345',
}

const project = {
  id: 'proj_espiga',
  name: 'La Espiga',
  slug: 'la-espiga',
  subdomain: null,
  status: 'published',
  plan: 'professional',
  hasPaid: true,
  businessData: JSON.stringify(businessData),
  sections: JSON.stringify(sections),
} as unknown as Project

const render = () => renderToStaticMarkup(<PublishedSite project={project} />)

/**
 * One tag per line before snapshotting.
 *
 * `renderToStaticMarkup` returns the whole document as a single line, which
 * makes a snapshot diff report the entire page as one changed line — useless
 * for finding which section moved. Splitting on tag boundaries turns the same
 * failure into a handful of readable lines. Purely a diff aid: the content is
 * byte-for-byte the rendered markup.
 */
const asLines = (html: string) => html.replace(/></g, '>\n<')

describe('PublishedSite — assembled document', () => {
  it('matches the recorded markup for a project with every section filled', () => {
    expect(asLines(render())).toMatchSnapshot()
  })

  it('renders sections in the owner’s order, not array order', () => {
    const html = render()
    const order = ['inicio', 'nosotros', 'servicios', 'caracteristicas', 'galeria', 'equipo', 'precios', 'testimonios', 'faq', 'contacto']
    const positions = order.map((anchor) => html.indexOf(`id="${anchor}"`))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('omits a disabled section even when its content exists', () => {
    // 'about' is declared twice — enabled at order 1 and disabled at order 5.
    // The heading must appear exactly once.
    expect(render().match(/Sobre nosotros/gi) ?? []).toHaveLength(1)
  })

  it('prices only the services that have a price', () => {
    const pricing = render().split('id="precios"')[1].split('</section>')[0]
    expect(pricing).toContain('$3.500')
    expect(pricing).toContain('$12.000')
    expect(pricing).not.toContain('Catering')
  })

  it('drops image URLs that are not http(s), root-relative or data:image', () => {
    const html = render()
    expect(html).not.toContain('javascript:')
    const srcs = html.match(/src="[^"]*"/g) ?? []
    expect(srcs).toContain('src="https://cdn.example.com/hero.jpg"')
    expect(srcs).toContain('src="/uploads/g2.jpg"')
    // Ana Coria's unusable photo falls back to the initial avatar.
    expect(html).toContain('team-avatar')
  })

  it('renders a zero-rated testimonial as a quote with no star row', () => {
    const html = render()
    expect(html).toContain('Siempre fresco.')
    expect(html.match(/class="stars"/g) ?? []).toHaveLength(2)
  })

  it('normalises every social handle to an absolute URL', () => {
    const html = render()
    for (const href of [
      'https://instagram.com/laespiga',
      'https://facebook.com/laespiga',
      'https://linkedin.com/company/laespiga',
      'https://x.com/laespiga',
      'https://tiktok.com/@laespiga',
      'https://youtube.com/@laespiga',
    ]) {
      expect(html).toContain(`href="${href}"`)
    }
  })
})

/**
 * Structured data is the paid differentiator, so the plan boundary is asserted
 * on the ASSEMBLED document — not only on the builder. The builder can be
 * correct while the renderer forgets to gate it, and that mistake ships a
 * Professional feature to every Essential customer.
 */
describe('PublishedSite — JSON-LD is Professional only', () => {
  const renderAs = (
    overrides: Record<string, unknown>,
    bdOverrides: Partial<BusinessData> = {}
  ) =>
    renderToStaticMarkup(
      <PublishedSite
        project={
          {
            ...project,
            ...overrides,
            businessData: JSON.stringify({ ...businessData, ...bdOverrides }),
          } as unknown as Project
        }
      />
    )

  // `[\s\S]` rather than `.` + the `s` flag: tsconfig targets below es2018, and
  // `npx tsc --noEmit` rejects the dotAll flag outright (TS1501).
  const jsonLdOf = (html: string) => {
    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    )
    return match ? match[1] : null
  }

  it('emits a LocalBusiness subtype for a paid Professional site', () => {
    const raw = jsonLdOf(renderAs({ plan: 'professional', hasPaid: true }))
    expect(raw).not.toBeNull()
    const data = JSON.parse(raw!)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('LocalBusiness')
    expect(data.name).toBe('Panadería La Espiga')
    expect(data.address).toMatchObject({ '@type': 'PostalAddress', addressLocality: 'Quilmes' })
    // sameAs mirrors the footer links exactly — one normalisation, not two.
    expect(data.sameAs).toContain('https://instagram.com/laespiga')
  })

  it.each([
    ['an Essential site', { plan: 'essential', hasPaid: true }],
    ['a free site', { plan: 'free', hasPaid: true }],
    ['an unpaid Professional site', { plan: 'professional', hasPaid: false }],
  ])('emits no JSON-LD at all for %s', (_label, overrides) => {
    const html = renderAs(overrides)
    expect(html).not.toContain('application/ld+json')
    expect(jsonLdOf(html)).toBeNull()
  })

  it('still emits the Essential-tier document — the gate removes only the paid tags', () => {
    const html = renderAs({ plan: 'essential', hasPaid: true })
    expect(html).toContain('Panadería La Espiga')
    expect(html).toContain('rel="sitemap"')
  })

  it('does not let a business name break out of the script element', () => {
    const hostile = 'Bar </script><script>alert(1)</script>'
    const html = renderAs({ plan: 'professional', hasPaid: true }, { name: hostile })

    // Exactly the scripts the document already had (hamburger + lead form + GA
    // inline + GA src) plus the one ld+json block — no injected extra.
    const openers = html.match(/<script/g) ?? []
    const closers = html.match(/<\/script>/g) ?? []
    expect(openers).toHaveLength(closers.length)

    const raw = jsonLdOf(html)!
    expect(raw).not.toContain('</script>')
    expect(raw).not.toContain('<')
    // The value survives intact once parsed — escaping is presentation only.
    expect(JSON.parse(raw).name).toBe(hostile)
  })
})
