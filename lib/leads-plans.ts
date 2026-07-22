/**
 * Configuración centralizada de planes de Captación de Leads IA.
 */

/** Source of truth for the valid plan ids. `LeadsPlanId` is derived from it so
 * the list and the type can never drift apart. */
export const LEADS_PLAN_IDS = ['basico', 'profesional'] as const

export type LeadsPlanId = (typeof LEADS_PLAN_IDS)[number]

export interface LeadsPlanConfig {
  id: LeadsPlanId
  name: string
  monthly: number
  title: string
  maxNichos: number
  maxCiudades: number
}

export const LEADS_PLANS: Record<LeadsPlanId, LeadsPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 18000,
    title: 'Captación de Leads IA Básico',
    maxNichos: 10,
    maxCiudades: 5,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 35000,
    title: 'Captación de Leads IA Profesional',
    maxNichos: 999,
    maxCiudades: 999,
  },
}

export const LEADS_PLANS_LIST = [LEADS_PLANS.basico, LEADS_PLANS.profesional]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing LEADS_PLANS directly: the map is a
 * plain object, so `LEADS_PLANS['toString']` resolves through Object.prototype
 * and returns a truthy function — enough to slip past an `if (!planConfig)`
 * guard and reach the pricing math with an undefined `monthly`.
 */
export function isLeadsPlanId(value: unknown): value is LeadsPlanId {
  return typeof value === 'string' && LEADS_PLAN_IDS.some((id) => id === value)
}

export function getLeadsPlan(planId: unknown): LeadsPlanConfig | undefined {
  return isLeadsPlanId(planId) ? LEADS_PLANS[planId] : undefined
}
