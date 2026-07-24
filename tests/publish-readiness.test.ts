import { describe, it, expect } from 'vitest'
import { evaluatePublishReadiness } from '@/lib/publish-readiness'
import type { Project } from '@/types'

// Minimal project builder — only the fields the readiness check reads.
function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Mi Negocio',
    slug: 'mi-negocio',
    status: 'draft',
    plan: 'essential',
    template: 'corporate',
    sections: [
      { id: 'hero', label: 'Portada', description: '', enabled: true, order: 0 },
      { id: 'contact', label: 'Contacto', description: '', enabled: true, order: 1 },
    ],
    businessData: {
      name: 'Mi Negocio',
      contact: { phone: '+54 11 1234-5678', email: '', whatsapp: '' },
    },
    ...overrides,
  } as unknown as Project
}

function item(report: ReturnType<typeof evaluatePublishReadiness>, id: string) {
  return report.items.find((i) => i.id === id)!
}

describe('evaluatePublishReadiness — required tier gates publishing', () => {
  it('blocks publishing when the name is missing', () => {
    const r = evaluatePublishReadiness(makeProject({ name: '', businessData: { contact: { phone: '123456' } } } as any))
    expect(item(r, 'name').passed).toBe(false)
    expect(r.canPublish).toBe(false)
    expect(r.requiredPending).toBeGreaterThan(0)
  })

  it('blocks publishing with no phone and no email', () => {
    const r = evaluatePublishReadiness(makeProject({ businessData: { name: 'X', contact: {} } } as any))
    expect(item(r, 'contact').passed).toBe(false)
    expect(r.canPublish).toBe(false)
  })

  it('accepts an email alone as contact', () => {
    const r = evaluatePublishReadiness(
      makeProject({ businessData: { name: 'X', contact: { email: 'hola@x.com' } } } as any)
    )
    expect(item(r, 'contact').passed).toBe(true)
  })

  it('blocks publishing without a template', () => {
    const r = evaluatePublishReadiness(makeProject({ template: '' }))
    expect(item(r, 'template').passed).toBe(false)
    expect(r.canPublish).toBe(false)
  })

  it('allows publishing when every required item passes, even with recommended ones pending', () => {
    const r = evaluatePublishReadiness(makeProject())
    expect(r.requiredPending).toBe(0)
    expect(r.canPublish).toBe(true)
    expect(r.recommendedPending).toBeGreaterThan(0) // no hero image, whatsapp, etc.
  })
})

describe('recommended tier informs but never blocks', () => {
  it('never lets a recommended miss flip canPublish to false', () => {
    // Required all present; recommended all absent.
    const r = evaluatePublishReadiness(makeProject())
    expect(r.canPublish).toBe(true)
    for (const id of ['heroImage', 'whatsapp', 'description', 'seoTitle']) {
      expect(item(r, id).severity).toBe('recommended')
    }
  })

  it('passes hero image, whatsapp, description and SEO title when present', () => {
    const r = evaluatePublishReadiness(
      makeProject({
        businessData: {
          name: 'X',
          description: 'Somos un negocio dedicado a la calidad.',
          heroImage: '/api/uploads/abc.jpg',
          contact: { phone: '123456', whatsapp: '5491112345678' },
          seo: { title: 'Mi Negocio — Buenos Aires' },
        },
      } as any)
    )
    expect(item(r, 'heroImage').passed).toBe(true)
    expect(item(r, 'whatsapp').passed).toBe(true)
    expect(item(r, 'description').passed).toBe(true)
    expect(item(r, 'seoTitle').passed).toBe(true)
  })
})

describe('sectionsFilled — the check that catches switched-on-but-empty sections', () => {
  it('fails and names the empty sections that the live site would hide', () => {
    const r = evaluatePublishReadiness(
      makeProject({
        sections: [
          { id: 'hero', label: 'Portada', description: '', enabled: true, order: 0 },
          { id: 'testimonials', label: 'Testimonios', description: '', enabled: true, order: 1 },
          { id: 'gallery', label: 'Galería', description: '', enabled: true, order: 2 },
          { id: 'faq', label: 'FAQ', description: '', enabled: false, order: 3 }, // disabled → ignored
        ],
        businessData: { name: 'X', contact: { phone: '123456' } }, // no testimonials, no gallery
      } as any)
    )
    const filled = item(r, 'sectionsFilled')
    expect(filled.passed).toBe(false)
    expect(filled.hint).toContain('Testimonios')
    expect(filled.hint).toContain('Galería')
    // A disabled empty section must not be reported.
    expect(filled.hint).not.toContain('FAQ')
  })

  it('passes when every enabled section has content', () => {
    const r = evaluatePublishReadiness(
      makeProject({
        sections: [
          { id: 'hero', label: 'Portada', description: '', enabled: true, order: 0 },
          { id: 'services', label: 'Servicios', description: '', enabled: true, order: 1 },
          { id: 'gallery', label: 'Galería', description: '', enabled: true, order: 2 },
        ],
        businessData: {
          name: 'X',
          contact: { phone: '123456' },
          services: [{ id: 's1', name: 'Servicio', description: 'desc' }],
          galleryImages: ['/api/uploads/a.jpg'],
        },
      } as any)
    )
    expect(item(r, 'sectionsFilled').passed).toBe(true)
  })

  it('ignores the footer section (always enabled, no content of its own)', () => {
    const r = evaluatePublishReadiness(
      makeProject({
        sections: [
          { id: 'hero', label: 'Portada', description: '', enabled: true, order: 0 },
          { id: 'footer', label: 'Footer', description: '', enabled: true, order: 1 },
        ],
        businessData: { name: 'X', contact: { phone: '123456' } },
      } as any)
    )
    expect(item(r, 'sectionsFilled').passed).toBe(true)
  })
})
