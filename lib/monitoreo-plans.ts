/**
 * Configuración centralizada de planes de Monitoreo Judicial.
 * Usada por backend (subscribe, webhook, mp/create) y frontend (dashboard, landing).
 */

/** Source of truth for the valid plan ids. `MonitoreoPlanId` is derived from it
 * so the list and the type can never drift apart. */
export const MONITOREO_PLAN_IDS = ['basico', 'profesional', 'estudio'] as const

export type MonitoreoPlanId = (typeof MONITOREO_PLAN_IDS)[number]

export interface MonitoreoPlanConfig {
  id: MonitoreoPlanId
  name: string
  monthly: number
  title: string
  maxCuils: number
  syncFrequencyHours: number
}

export const MONITOREO_PLANS: Record<MonitoreoPlanId, MonitoreoPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 19000,
    title: 'Monitoreo Judicial Básico',
    maxCuils: 1,
    syncFrequencyHours: 24,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 35000,
    title: 'Monitoreo Judicial Profesional',
    maxCuils: 3,
    syncFrequencyHours: 6,
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    monthly: 75000,
    title: 'Monitoreo Judicial Estudio',
    maxCuils: 8,
    syncFrequencyHours: 2,
  },
}

export const MONITOREO_PLANS_LIST = [
  MONITOREO_PLANS.basico,
  MONITOREO_PLANS.profesional,
  MONITOREO_PLANS.estudio,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing MONITOREO_PLANS directly: the map is a
 * plain object, so `MONITOREO_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isMonitoreoPlanId(value: unknown): value is MonitoreoPlanId {
  return typeof value === 'string' && MONITOREO_PLAN_IDS.some((id) => id === value)
}

export function getMonitoreoPlan(planId: unknown): MonitoreoPlanConfig | undefined {
  return isMonitoreoPlanId(planId) ? MONITOREO_PLANS[planId] : undefined
}
