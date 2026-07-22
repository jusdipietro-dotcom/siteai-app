/**
 * Configuración centralizada de planes de Señales Crypto IA.
 */

/** Source of truth for the valid plan ids. `TradingPlanId` is derived from it so
 * the list and the type can never drift apart. */
export const TRADING_PLAN_IDS = ['basico', 'profesional'] as const

export type TradingPlanId = (typeof TRADING_PLAN_IDS)[number]

export interface TradingPlanConfig {
  id: TradingPlanId
  name: string
  monthly: number
  title: string
  maxPairs: number
  reportes: boolean
}

export const TRADING_PLANS: Record<TradingPlanId, TradingPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 20000,
    title: 'Señales Crypto IA Básico',
    maxPairs: 30,
    reportes: false,
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 35000,
    title: 'Señales Crypto IA Profesional',
    maxPairs: 30,
    reportes: true,
  },
}

export const TRADING_PLANS_LIST = [TRADING_PLANS.basico, TRADING_PLANS.profesional]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing TRADING_PLANS directly: the map is a
 * plain object, so `TRADING_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isTradingPlanId(value: unknown): value is TradingPlanId {
  return typeof value === 'string' && TRADING_PLAN_IDS.some((id) => id === value)
}

export function getTradingPlan(planId: unknown): TradingPlanConfig | undefined {
  return isTradingPlanId(planId) ? TRADING_PLANS[planId] : undefined
}
