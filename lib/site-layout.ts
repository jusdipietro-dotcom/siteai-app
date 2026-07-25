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
