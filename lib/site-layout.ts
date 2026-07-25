/*
  Per-template layout — slice 1: the hero.

  Until now a "template" was only a colour: a restaurant and a law firm rendered
  the identical hero. This maps each template to a hero COMPOSITION so the first
  thing a visitor sees actually looks like the trade.

  Derived from the project's `template` at render time, so it applies to every
  site — including already-published ones — with no data migration. An unknown
  or missing template falls back to 'centered', which is exactly today's hero, so
  nothing can render worse than it does now.
*/

import type { SectionType } from '@/types'
import { businessTypes } from '@/data/mockBusinessTypes'

/*
  The `template` column is not reliable. Some projects store a real design
  template ('legal', 'restaurant'); older/demo rows store a businessType id
  ('profesional', 'abogado') in it instead — which is not a template at all, so
  the per-template variants below silently fell back to the neutral default and
  the site looked unchanged (exactly the "no veo cambios" report).

  resolveTemplateKey fixes that at RENDER time, no data migration: a valid
  template is used as-is; anything else is mapped through the rubro's
  defaultTemplate. So an "abogado" site renders the legal layout even when its
  template column says 'profesional'.
*/
const KNOWN_TEMPLATES = new Set([
  'minimal', 'corporate', 'elegant', 'legal', 'medical',
  'restaurant', 'boutique', 'fitness', 'realty', 'creative',
])

function normKey(s: string): string {
  // businessType ids are plain ascii ('abogado', 'restaurante'); lowercasing the
  // stored value ('Abogado') is enough to match them.
  return s.trim().toLowerCase()
}

function templateFromBusinessType(businessType?: string | null): string | null {
  if (!businessType) return null
  const n = normKey(businessType)
  const bt = businessTypes.find((b) => normKey(b.id) === n)
  return bt?.defaultTemplate ?? null
}

/**
 * The effective design template for a project. A valid template is used as-is;
 * an invalid or missing one (e.g. a businessType id sitting in the column) is
 * derived from the rubro's default template. Every per-template variant keys off
 * this, so a site gets its rubro's layout regardless of how `template` was set.
 */
export function resolveTemplateKey(template?: string | null, businessType?: string | null): string {
  if (template && KNOWN_TEMPLATES.has(template)) return template
  return templateFromBusinessType(businessType) ?? template ?? ''
}

export type HeroVariant = 'centered' | 'fullphoto' | 'split' | 'sobrio'

/*
  - fullphoto: the photo carries the page (food, fashion, fitness, premium real
    estate) — big image, dark overlay, centered text.
  - split:     text on a solid panel, image framed beside it (corporate, medical)
    — institutional and trustworthy.
  - sobrio:    typographic, image reduced to a faint texture (legal, editorial,
    creative) — authority over imagery.
  - centered:  today's hero. The default and the fallback.
*/
const HERO_VARIANT_BY_TEMPLATE: Record<string, HeroVariant> = {
  restaurant: 'fullphoto',
  elegant: 'fullphoto',
  boutique: 'fullphoto',
  fitness: 'fullphoto',
  realty: 'fullphoto',
  corporate: 'split',
  medical: 'split',
  legal: 'sobrio',
  minimal: 'sobrio',
  creative: 'sobrio',
}

/** Hero composition for a template. Unknown/missing → 'centered' (today's hero). */
export function heroVariantFor(template?: string | null): HeroVariant {
  return (template && HERO_VARIANT_BY_TEMPLATE[template]) || 'centered'
}

/*
  Slice 2 — the services section.

  Same idea as the hero: the composition AND the wording change by trade. A
  restaurant reads its services as a menu (name + price on a line); a law firm
  reads them as practice areas in a sober list; everyone else keeps the card
  grid. The section heading is part of the layout too — "La carta" beats a
  generic "Nuestros servicios" for a restaurant.
*/
export type ServicesVariant = 'cards' | 'menu' | 'list'

export interface ServicesLayout {
  variant: ServicesVariant
  /** Eyebrow above the heading. */
  label: string
  title: string
  subtitle: string
}

// Today's exact copy + card grid — the default and the fallback.
const DEFAULT_SERVICES: ServicesLayout = {
  variant: 'cards',
  label: 'Nuestros servicios',
  title: 'Todo lo que necesitás',
  subtitle: 'Soluciones pensadas para tu negocio',
}

// The 'features' section id shares ServicesSection but is a different pitch.
export const FEATURES_LAYOUT: ServicesLayout = {
  variant: 'cards',
  label: 'Características',
  title: 'Por qué elegirnos',
  subtitle: 'Lo que nos hace diferentes',
}

const SERVICES_BY_TEMPLATE: Record<string, ServicesLayout> = {
  restaurant: { variant: 'menu', label: 'La carta', title: 'Nuestros platos', subtitle: 'Hecho con ingredientes frescos' },
  legal: { variant: 'list', label: 'Áreas de práctica', title: 'En qué te podemos ayudar', subtitle: 'Asesoramiento en cada especialidad' },
  medical: { variant: 'list', label: 'Especialidades', title: 'Nuestros servicios', subtitle: 'Atención centrada en vos' },
  corporate: { variant: 'list', label: 'Servicios', title: 'Lo que hacemos', subtitle: 'Soluciones para tu empresa' },
  elegant: { variant: 'cards', label: 'Servicios', title: 'Nuestra propuesta', subtitle: 'Calidad en cada detalle' },
  boutique: { variant: 'cards', label: 'La colección', title: 'Lo que ofrecemos', subtitle: 'Piezas seleccionadas para vos' },
  fitness: { variant: 'cards', label: 'Entrenamientos', title: 'Lo que hacemos', subtitle: 'Planes para todos los niveles' },
  realty: { variant: 'cards', label: 'Servicios', title: 'Cómo te ayudamos', subtitle: 'Comprá, vendé o alquilá con nosotros' },
}

/** Services layout for a template. Unknown/missing → today's card grid + copy. */
export function servicesLayoutFor(template?: string | null): ServicesLayout {
  return (template && SERVICES_BY_TEMPLATE[template]) || DEFAULT_SERVICES
}

/*
  Slice 3 — section order.

  Unlike the hero and services (render variants derived from the template), the
  section order is OWNER DATA: it lives in project.sections[].order and the owner
  reorders it by drag-and-drop. So the template only sets the STARTING order when
  a project is created — it is never imposed on the render, which would undo the
  owner's arrangement and rearrange already-published sites.

  A restaurant opens leading with its gallery and menu; a law firm with its
  practice areas and credentials. Sections not listed for a template keep their
  incoming relative order, after the listed ones.
*/
const DEFAULT_ORDER: SectionType[] = [
  'hero', 'services', 'about', 'gallery', 'pricing', 'testimonials', 'team', 'stats', 'faq', 'cta', 'hours', 'contact', 'footer',
]

const SECTION_ORDER_BY_TEMPLATE: Record<string, SectionType[]> = {
  restaurant: ['hero', 'gallery', 'services', 'pricing', 'testimonials', 'about', 'stats', 'faq', 'team', 'cta', 'hours', 'contact', 'footer'],
  legal: ['hero', 'services', 'about', 'stats', 'team', 'testimonials', 'faq', 'cta', 'hours', 'contact', 'footer'],
  medical: ['hero', 'services', 'about', 'team', 'stats', 'faq', 'testimonials', 'cta', 'hours', 'contact', 'footer'],
  realty: ['hero', 'gallery', 'services', 'about', 'testimonials', 'stats', 'faq', 'cta', 'hours', 'contact', 'footer'],
  fitness: ['hero', 'services', 'gallery', 'stats', 'pricing', 'testimonials', 'team', 'faq', 'cta', 'hours', 'contact', 'footer'],
  boutique: ['hero', 'gallery', 'services', 'testimonials', 'about', 'stats', 'faq', 'cta', 'hours', 'contact', 'footer'],
}

/** Preferred section order for a template. Unknown/missing → the default order. */
export function sectionOrderFor(template?: string | null): SectionType[] {
  return (template && SECTION_ORDER_BY_TEMPLATE[template]) || DEFAULT_ORDER
}

/**
 * Sort the enabled sections into the template's starting order. Sections the
 * template does not list keep their incoming relative order, placed after the
 * listed ones — so a new section id never silently disappears from a template
 * whose order predates it.
 */
export function orderSections(enabled: SectionType[], template?: string | null): SectionType[] {
  const pref = sectionOrderFor(template)
  return [...enabled].sort((a, b) => {
    const ia = pref.indexOf(a)
    const ib = pref.indexOf(b)
    return (ia === -1 ? pref.length : ia) - (ib === -1 ? pref.length : ib)
  })
}
