/**
 * Configuracion centralizada de planes del generador de sitios web.
 * Usada por backend (create-subscription) y frontend (checkout, landing publica).
 *
 * Es la unica fuente de verdad de los precios: MercadoPago cobra el valor que
 * sale de este modulo, asi que no debe duplicarse en ningun call site.
 *
 * Nota: sin dependencias de React ni de iconos, porque este modulo se importa
 * tambien desde route handlers que corren en el servidor.
 */

/** Source of truth for the valid plan ids. `WebsitePlanId` is derived from it so
 * the list and the type can never drift apart. */
export const WEBSITE_PLAN_IDS = ['essential', 'professional'] as const

export type WebsitePlanId = (typeof WEBSITE_PLAN_IDS)[number]

export interface WebsitePlanConfig {
  id: WebsitePlanId
  name: string
  monthly: number          // ARS por mes, facturacion mensual
  annual: number           // ARS por mes equivalente, facturacion anual
  title: string            // Titulo para MercadoPago
  description: string      // Bajada corta para UI
  maxProjects: number      // Proyectos activos permitidos
  popular: boolean         // Destacado en UI
  features: string[]       // Features para mostrar en UI
}

export const WEBSITE_PLANS: Record<WebsitePlanId, WebsitePlanConfig> = {
  essential: {
    id: 'essential',
    name: 'Essential',
    // TEMP 2026-07-22 — $20 test price for the live MercadoPago end-to-end test.
    // $1 is impossible: MercadoPago rejects any preapproval below ARS $15
    // ("Cannot pay an amount lower than $ 15.00"), and it validates the amount
    // BEFORE the payer/collector checks. $20 is the cheapest value with margin.
    // REVERT to monthly: 19000 / annual: 11400 as soon as the test is done.
    monthly: 20,
    annual: 20,
    title: 'Plan Essential — Automatic IA Lab',
    description: 'Publica tu sitio y empeza a crecer',
    maxProjects: 1,
    popular: false,
    features: [
      'Sitio publicado con URL publica',
      'Certificado SSL incluido',
      'Editor visual: ediciones ilimitadas',
      'Boton de WhatsApp integrado',
      'SEO basico (titulo, descripcion, keywords)',
      // Moved up from the Professional list, where it was listed as a paid
      // differentiator it never was: the sitemap gates on `seo.sitemapEnabled`
      // + `hasPaid`, never on plan, so every paid site has always had one.
      // Advertising it as Professional-only was the inaccuracy; taking it away
      // from Essential to make the old copy true would be a regression for
      // customers who already have a working sitemap.
      'Sitemap.xml automatico',
      'Soporte por email',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    monthly: 29000,
    annual: 17400,
    title: 'Plan Professional — Automatic IA Lab',
    description: 'Todo lo que necesitas para destacarte',
    maxProjects: 3,
    popular: true,
    /*
      Every line here must name something the code actually does, and point at
      where it does it. This list previously advertised "SEO avanzado +
      sitemap.xml" and "Soporte prioritario"; neither existed. The sitemap was
      never plan-gated (it moved to the Essential list, where it is true), and
      the SEO differentiators below were built to make the rest of the sentence
      real rather than deleted to make it honest.

      "Soporte prioritario" is kept deliberately and is the one entry NOT backed
      by code — it is a human commitment, so honouring it or dropping it is the
      owner's call, not a code change. It is the only unverifiable claim left on
      this plan.
    */
    features: [
      'Todo lo de Essential',
      'Hasta 3 proyectos activos',
      // components/site/PublishedSite.tsx — gated on row.plan
      'Google Analytics integrado',
      // lib/site-seo.ts — LocalBusiness JSON-LD built from real owner data only
      'Datos estructurados para Google (JSON-LD)',
      // lib/published-site.ts — og:image / twitter:image from the hero image
      'Vista previa con imagen al compartir (OpenGraph + Twitter)',
      // app/s/[slug]/robots.txt + app/sub/[subdomain]/robots.txt
      'robots.txt propio apuntando a tu sitemap',
      'Soporte prioritario',
    ],
  },
}

/** Lista ordenada para UI */
export const WEBSITE_PLANS_LIST = [
  WEBSITE_PLANS.essential,
  WEBSITE_PLANS.professional,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing WEBSITE_PLANS directly: the map is a
 * plain object, so `WEBSITE_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isWebsitePlanId(value: unknown): value is WebsitePlanId {
  return typeof value === 'string' && WEBSITE_PLAN_IDS.some((id) => id === value)
}

/** Helpers */
export function getWebsitePlanConfig(planId: unknown): WebsitePlanConfig | undefined {
  return isWebsitePlanId(planId) ? WEBSITE_PLANS[planId] : undefined
}

/** Precio mensual segun modalidad de facturacion. */
export function websitePlanPrice(planId: unknown, annual: boolean): number {
  const plan = getWebsitePlanConfig(planId)
  if (!plan) return 0
  return annual ? plan.annual : plan.monthly
}

export function formatARS(n: number): string {
  return `ARS $${n.toLocaleString('es-AR')}`
}
