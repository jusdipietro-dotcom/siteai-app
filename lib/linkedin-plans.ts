/**
 * Configuración centralizada de planes de LinkedIn Optimizer IA.
 */

/** Source of truth for the valid plan ids. `LinkedInPlanId` is derived from it
 * so the list and the type can never drift apart. */
export const LINKEDIN_PLAN_IDS = ['basico', 'profesional', 'agencia'] as const

export type LinkedInPlanId = (typeof LINKEDIN_PLAN_IDS)[number]

export interface LinkedInPlanConfig {
  id: LinkedInPlanId
  name: string
  monthly: number
  title: string
  maxProfiles: number
  postsPerMonth: number
}

export const LINKEDIN_PLANS: Record<LinkedInPlanId, LinkedInPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 12000,
    title: 'LinkedIn IA Basico',
    maxProfiles: 1,
    postsPerMonth: 20,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 20000,
    title: 'LinkedIn IA Profesional',
    maxProfiles: 3,
    postsPerMonth: 60,
  },
  agencia: {
    id: 'agencia',
    name: 'Agencia',
    monthly: 45000,
    title: 'LinkedIn IA Agencia',
    maxProfiles: 10,
    postsPerMonth: 200,
  },
}

export const LINKEDIN_PLANS_LIST = [
  LINKEDIN_PLANS.basico,
  LINKEDIN_PLANS.profesional,
  LINKEDIN_PLANS.agencia,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing LINKEDIN_PLANS directly: the map is a
 * plain object, so `LINKEDIN_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isLinkedInPlanId(value: unknown): value is LinkedInPlanId {
  return typeof value === 'string' && LINKEDIN_PLAN_IDS.some((id) => id === value)
}

export function getLinkedInPlan(planId: unknown): LinkedInPlanConfig | undefined {
  return isLinkedInPlanId(planId) ? LINKEDIN_PLANS[planId] : undefined
}
