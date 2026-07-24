import { describe, it, expect } from 'vitest'
import { TEMPLATE_CONTENT, contentForBusinessType } from '@/data/templateContent'
import { businessTypes } from '@/data/mockBusinessTypes'

/*
  Guards for the wizard's starter content.

  The wizard backfills a new site with TEMPLATE_CONTENT[businessType]. The lookup
  is by id, so renaming a rubro in mockBusinessTypes would silently drop that
  trade back to the generic set — the site would still build, just blander, and
  nobody would notice. The first test is the one that earns its keep.
*/
describe('starter content per rubro', () => {
  const rubros = Object.keys(TEMPLATE_CONTENT)

  it('covers every business type the wizard offers', () => {
    const missing = businessTypes.map((bt) => bt.id).filter((id) => !TEMPLATE_CONTENT[id])
    expect(missing).toEqual([])
  })

  it('carries no content for a rubro the wizard does not offer', () => {
    const offered = new Set(businessTypes.map((bt) => bt.id))
    expect(rubros.filter((r) => !offered.has(r))).toEqual([])
  })

  it.each(rubros)('%s ships every section populated', (rubro) => {
    const c = TEMPLATE_CONTENT[rubro]
    expect(c.tagline.trim()).not.toBe('')
    expect(c.description.trim()).not.toBe('')
    expect(c.services.length).toBeGreaterThan(0)
    expect(c.testimonials.length).toBeGreaterThan(0)
    expect(c.faqs.length).toBeGreaterThan(0)
    expect(c.stats.length).toBeGreaterThan(0)
  })

  it.each(rubros)('%s has no blank fields and unique ids per collection', (rubro) => {
    const c = TEMPLATE_CONTENT[rubro]

    for (const s of c.services) {
      expect(s.name.trim()).not.toBe('')
      expect(s.description.trim()).not.toBe('')
    }
    for (const t of c.testimonials) {
      expect(t.author.trim()).not.toBe('')
      expect(t.content.trim()).not.toBe('')
      expect(t.rating).toBeGreaterThanOrEqual(1)
      expect(t.rating).toBeLessThanOrEqual(5)
    }
    for (const f of c.faqs) {
      expect(f.question.trim()).not.toBe('')
      expect(f.answer.trim()).not.toBe('')
    }
    for (const s of c.stats) {
      expect(s.number.trim()).not.toBe('')
      expect(s.label.trim()).not.toBe('')
    }

    // Ids collide → React keys collide and the editor edits the wrong row.
    for (const arr of [c.services, c.testimonials, c.faqs, c.stats]) {
      expect(new Set(arr.map((x) => x.id)).size).toBe(arr.length)
    }
  })

  describe('contentForBusinessType', () => {
    it('returns the rubro-specific set when it exists', () => {
      expect(contentForBusinessType('restaurante')).toBe(TEMPLATE_CONTENT.restaurante)
      expect(contentForBusinessType('abogado').tagline).not.toBe(
        contentForBusinessType('restaurante').tagline
      )
    })

    it('falls back to a generic set for unknown, empty or missing ids', () => {
      const generic = contentForBusinessType('rubro-que-no-existe')
      expect(generic.services.length).toBeGreaterThan(0)
      expect(generic.testimonials.length).toBeGreaterThan(0)
      expect(contentForBusinessType(undefined)).toBe(generic)
      expect(contentForBusinessType(null)).toBe(generic)
      expect(contentForBusinessType('')).toBe(generic)
    })
  })
})
