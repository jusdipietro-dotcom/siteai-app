/**
 * Configuración centralizada de planes de LexPost (publicaciones IG legales).
 */

/** Source of truth for the valid plan ids. `LexpostPlanId` is derived from it so
 * the list and the type can never drift apart. */
export const LEXPOST_PLAN_IDS = ['basico', 'profesional', 'estudio'] as const

export type LexpostPlanId = (typeof LEXPOST_PLAN_IDS)[number]

export interface LexpostPlanConfig {
  id: LexpostPlanId
  name: string
  monthly: number
  title: string
  publicationsLimit: number  // 0 = ilimitado
  igAccountCount: number
}

export const LEXPOST_PLANS: Record<LexpostPlanId, LexpostPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 15000,
    title: 'LexPost Basico',
    publicationsLimit: 10,
    igAccountCount: 1,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 25000,
    title: 'LexPost Profesional',
    publicationsLimit: 0,
    igAccountCount: 1,
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    monthly: 45000,
    title: 'LexPost Estudio',
    publicationsLimit: 0,
    igAccountCount: 3,
  },
}

export const LEXPOST_PLANS_LIST = [
  LEXPOST_PLANS.basico,
  LEXPOST_PLANS.profesional,
  LEXPOST_PLANS.estudio,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing LEXPOST_PLANS directly: the map is a
 * plain object, so `LEXPOST_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isLexpostPlanId(value: unknown): value is LexpostPlanId {
  return typeof value === 'string' && LEXPOST_PLAN_IDS.some((id) => id === value)
}

export function getLexpostPlan(planId: unknown): LexpostPlanConfig | undefined {
  return isLexpostPlanId(planId) ? LEXPOST_PLANS[planId] : undefined
}
