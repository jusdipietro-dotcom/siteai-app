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
