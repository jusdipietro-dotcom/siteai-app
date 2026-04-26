/**
 * Configuración centralizada de planes de Señales Crypto IA.
 */

export type TradingPlanId = 'basico' | 'profesional'

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

export function getTradingPlan(planId: string): TradingPlanConfig | undefined {
  return TRADING_PLANS[planId as TradingPlanId]
}
