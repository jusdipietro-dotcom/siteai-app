import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { servicesLayoutFor, FEATURES_LAYOUT } from '@/lib/site-layout'
import { ServicesSection } from '@/components/site/sections/ServicesSection'
import type { Service } from '@/types'

describe('servicesLayoutFor — composition + wording per template', () => {
  it('gives a restaurant a menu with its own heading', () => {
    const l = servicesLayoutFor('restaurant')
    expect(l.variant).toBe('menu')
    expect(l.label).toBe('La carta')
  })

  it('gives legal/medical/corporate a sober list', () => {
    for (const t of ['legal', 'medical', 'corporate']) {
      expect(servicesLayoutFor(t).variant, t).toBe('list')
    }
  })

  it('falls back to today\'s card grid + copy for unknown/missing template', () => {
    for (const t of ['profesional', 'rubro-x', undefined, null, '']) {
      const l = servicesLayoutFor(t as string)
      expect(l.variant).toBe('cards')
      expect(l.label).toBe('Nuestros servicios')
    }
  })
})

const services: Service[] = [
  { id: 's1', name: 'Milanesa napolitana', description: 'Con papas fritas', price: '$8.500', emoji: '🍽️' },
  { id: 's2', name: 'Ravioles', description: 'Salsa a elección', price: '$7.200' },
]

describe('ServicesSection markup per variant', () => {
  it('menu renders name + price rows and the trade heading', () => {
    const h = renderToStaticMarkup(
      <ServicesSection anchor="servicios" services={services} color="#c2410c" layout={servicesLayoutFor('restaurant')} />
    )
    expect(h).toContain('menu-list')
    expect(h).toContain('menu-item-price')
    expect(h).toContain('$8.500')
    expect(h).toContain('La carta')
  })

  it('list renders the two-column practice-area structure', () => {
    const h = renderToStaticMarkup(
      <ServicesSection anchor="servicios" services={services} color="#1e3a5f" layout={servicesLayoutFor('legal')} />
    )
    expect(h).toContain('svc-list')
    expect(h).toContain('svc-list-icon')
    expect(h).toContain('Áreas de práctica')
  })

  it('cards (default) renders the original grid and heading when no layout is passed', () => {
    const h = renderToStaticMarkup(
      <ServicesSection anchor="servicios" services={services} color="#6366f1" />
    )
    expect(h).toContain('grid-3')
    expect(h).toContain('service-card')
    expect(h).toContain('Nuestros servicios')
    // Not the menu/list markup.
    expect(h).not.toContain('menu-list')
    expect(h).not.toContain('svc-list')
  })

  it('features uses its own pitch, not the services copy', () => {
    expect(FEATURES_LAYOUT.label).toBe('Características')
    const h = renderToStaticMarkup(
      <ServicesSection anchor="caracteristicas" services={services} color="#6366f1" layout={FEATURES_LAYOUT} />
    )
    expect(h).toContain('Características')
  })
})
