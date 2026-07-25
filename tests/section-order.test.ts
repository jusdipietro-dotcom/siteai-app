import { describe, it, expect } from 'vitest'
import { sectionOrderFor, orderSections } from '@/lib/site-layout'
import type { SectionType } from '@/types'

describe('sectionOrderFor — starting order per template', () => {
  it('leads a restaurant with gallery and menu', () => {
    const order = sectionOrderFor('restaurant')
    expect(order.indexOf('gallery')).toBeLessThan(order.indexOf('about'))
    expect(order.indexOf('services')).toBeLessThan(order.indexOf('faq'))
  })

  it('leads a law firm with services then about/credentials, not gallery', () => {
    const order = sectionOrderFor('legal')
    expect(order.indexOf('services')).toBeLessThan(order.indexOf('about'))
    expect(order.indexOf('about')).toBeLessThan(order.indexOf('faq'))
  })

  it('falls back to the default order for unknown/missing template', () => {
    expect(sectionOrderFor('rubro-x')).toEqual(sectionOrderFor(undefined))
    expect(sectionOrderFor(null)[0]).toBe('hero')
  })
})

describe('orderSections — arranges only the enabled sections', () => {
  it('reorders enabled sections into the template order', () => {
    const enabled: SectionType[] = ['contact', 'services', 'hero', 'gallery']
    const out = orderSections(enabled, 'restaurant')
    // restaurant order: hero, gallery, services, ... contact near the end
    expect(out).toEqual(['hero', 'gallery', 'services', 'contact'])
  })

  it('keeps every enabled section — none added, none dropped', () => {
    const enabled: SectionType[] = ['contact', 'services', 'hero', 'testimonials', 'faq']
    const out = orderSections(enabled, 'legal')
    expect([...out].sort()).toEqual([...enabled].sort())
    expect(out.length).toBe(enabled.length)
  })

  it('places sections the template does not list AFTER the listed ones, in their incoming order', () => {
    // 'weirdo' is not a real SectionType, but proves the fallback path: unknown
    // ids must not vanish and must keep their relative order at the tail.
    const enabled = ['services', 'weirdo1', 'hero', 'weirdo2'] as unknown as SectionType[]
    const out = orderSections(enabled, 'legal')
    expect(out[0]).toBe('hero')
    expect(out[1]).toBe('services')
    expect(out.slice(2)).toEqual(['weirdo1', 'weirdo2']) // tail order preserved
  })

  it('is a no-op ordering when enabled already matches the template order', () => {
    const enabled: SectionType[] = ['hero', 'services', 'about', 'contact']
    expect(orderSections(enabled, 'legal')).toEqual(enabled)
  })

  it('does not mutate the input array', () => {
    const enabled: SectionType[] = ['contact', 'hero']
    const copy = [...enabled]
    orderSections(enabled, 'restaurant')
    expect(enabled).toEqual(copy)
  })
})
