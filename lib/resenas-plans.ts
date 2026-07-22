/**
 * Configuración centralizada de planes de Reseñas Google IA.
 */

/** Source of truth for the valid plan ids. `ResenasPlanId` is derived from it so
 * the list and the type can never drift apart. */
export const RESENAS_PLAN_IDS = ['basico', 'profesional', 'premium'] as const

export type ResenasPlanId = (typeof RESENAS_PLAN_IDS)[number]

export interface ResenasPlanConfig {
  id: ResenasPlanId
  name: string
  monthly: number
  title: string
  maxProfiles: number
}

export const RESENAS_PLANS: Record<ResenasPlanId, ResenasPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 15000,
    title: 'Reseñas Google IA Básico',
    maxProfiles: 1,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 25000,
    title: 'Reseñas Google IA Profesional',
    maxProfiles: 3,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    monthly: 45000,
    title: 'Reseñas Google IA Premium',
    maxProfiles: 10,
  },
}

export const RESENAS_PLANS_LIST = [
  RESENAS_PLANS.basico,
  RESENAS_PLANS.profesional,
  RESENAS_PLANS.premium,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing RESENAS_PLANS directly: the map is a
 * plain object, so `RESENAS_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isResenasPlanId(value: unknown): value is ResenasPlanId {
  return typeof value === 'string' && RESENAS_PLAN_IDS.some((id) => id === value)
}

export function getResenasPlan(planId: unknown): ResenasPlanConfig | undefined {
  return isResenasPlanId(planId) ? RESENAS_PLANS[planId] : undefined
}
