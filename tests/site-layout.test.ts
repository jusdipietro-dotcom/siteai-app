import { describe, it, expect } from 'vitest'
import { heroVariantFor } from '@/lib/site-layout'
import { mockTemplates } from '@/data/mockTemplates'

describe('heroVariantFor — hero composition per template', () => {
  it('maps visual rubros to fullphoto', () => {
    for (const t of ['restaurant', 'elegant', 'boutique', 'fitness', 'realty']) {
      expect(heroVariantFor(t), t).toBe('fullphoto')
    }
  })

  it('maps institutional rubros to split', () => {
    for (const t of ['corporate', 'medical']) expect(heroVariantFor(t), t).toBe('split')
  })

  it('maps typographic rubros to sobrio', () => {
    for (const t of ['legal', 'minimal', 'creative']) expect(heroVariantFor(t), t).toBe('sobrio')
  })

  it('falls back to centered (today\'s hero) for unknown or missing template', () => {
    expect(heroVariantFor('rubro-inexistente')).toBe('centered')
    expect(heroVariantFor(undefined)).toBe('centered')
    expect(heroVariantFor(null)).toBe('centered')
    expect(heroVariantFor('')).toBe('centered')
  })

  it('resolves every real template to a known variant (no template renders unstyled)', () => {
    const valid = new Set(['centered', 'fullphoto', 'split', 'sobrio'])
    for (const t of mockTemplates) {
      expect(valid.has(heroVariantFor(t.id)), `${t.id} → ${heroVariantFor(t.id)}`).toBe(true)
    }
  })
})
