import { describe, it, expect } from 'vitest'
import { fontsForTemplate, isDefaultFont } from '@/lib/site-layout'
import { typographyOptions } from '@/config/themes'

const FONT_IDS = new Set(typographyOptions.map((f) => f.id))

describe('fontsForTemplate — typography per rubro', () => {
  it('gives legal a serif pairing (Playfair heading)', () => {
    expect(fontsForTemplate('legal')).toEqual({ heading: 'playfair', body: 'lora' })
  })

  it('gives restaurant and fitness their own character fonts', () => {
    expect(fontsForTemplate('restaurant').heading).toBe('fraunces')
    expect(fontsForTemplate('fitness').heading).toBe('space-grotesk')
  })

  it('falls back to Inter/Inter for unknown/missing template', () => {
    expect(fontsForTemplate('rubro-x')).toEqual({ heading: 'inter', body: 'inter' })
    expect(fontsForTemplate(null)).toEqual({ heading: 'inter', body: 'inter' })
  })

  it('only references fonts that actually exist in the catalogue', () => {
    // A typo like "playfairr" would silently emit no @font URL and fall back to
    // system fonts — this catches it at test time.
    for (const t of ['legal', 'elegant', 'realty', 'restaurant', 'boutique', 'fitness', 'creative', 'corporate', 'medical', 'minimal']) {
      const { heading, body } = fontsForTemplate(t)
      expect(FONT_IDS.has(heading), `${t} heading ${heading}`).toBe(true)
      expect(FONT_IDS.has(body), `${t} body ${body}`).toBe(true)
    }
  })
})

describe('isDefaultFont — only override when the owner never chose', () => {
  it('is true for the generic default or unset', () => {
    expect(isDefaultFont('inter')).toBe(true)
    expect(isDefaultFont('')).toBe(true)
    expect(isDefaultFont(undefined)).toBe(true)
    expect(isDefaultFont(null)).toBe(true)
  })

  it('is false for any explicit non-Inter choice (which must be respected)', () => {
    for (const f of ['playfair', 'lora', 'geist', 'space-grotesk']) {
      expect(isDefaultFont(f), f).toBe(false)
    }
  })
})
