/**
 * Configuración centralizada de planes de LexPost (publicaciones IG legales).
 */

export type LexpostPlanId = 'basico' | 'profesional' | 'estudio'

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

export function getLexpostPlan(planId: string): LexpostPlanConfig | undefined {
  return LEXPOST_PLANS[planId as LexpostPlanId]
}
