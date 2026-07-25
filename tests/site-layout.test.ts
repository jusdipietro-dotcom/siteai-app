import { describe, it, expect } from 'vitest'
import { heroVariantFor, servicesLayoutFor, resolveTemplateKey } from '@/lib/site-layout'
import { mockTemplates } from '@/data/mockTemplates'

describe('resolveTemplateKey — the "no veo cambios" fix', () => {
  it('keeps a valid design template as-is', () => {
    expect(resolveTemplateKey('legal', 'abogado')).toBe('legal')
    expect(resolveTemplateKey('restaurant', 'restaurante')).toBe('restaurant')
    expect(resolveTemplateKey('fitness', 'gimnasio')).toBe('fitness')
  })

  it('derives the template from the rubro when the column holds a businessType id', () => {
    // The exact bug: template='profesional' is not a template, so without this
    // it fell back to the neutral layout and the site looked unchanged.
    expect(resolveTemplateKey('profesional', 'abogado')).toBe('legal')
    expect(resolveTemplateKey('profesional', 'restaurante')).toBe('restaurant')
    expect(resolveTemplateKey('profesional', 'consultorio')).toBe('medical')
  })

  it('is case-insensitive on the rubro (stored "Abogado" vs id "abogado")', () => {
    expect(resolveTemplateKey('profesional', 'Abogado')).toBe('legal')
  })

  it('falls back to the raw template only when nothing resolves', () => {
    expect(resolveTemplateKey('profesional', 'rubro-inexistente')).toBe('profesional')
    expect(resolveTemplateKey(null, null)).toBe('')
    expect(resolveTemplateKey('', undefined)).toBe('')
  })

  it('makes hero + services follow the rubro despite a dirty template column', () => {
    const t = resolveTemplateKey('profesional', 'abogado') // → legal
    expect(heroVariantFor(t)).toBe('sobrio')
    expect(servicesLayoutFor(t).variant).toBe('list')
  })
})

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
