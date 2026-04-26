/**
 * Configuración centralizada de planes de Reseñas Google IA.
 */

export type ResenasPlanId = 'basico' | 'profesional' | 'premium'

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

export function getResenasPlan(planId: string): ResenasPlanConfig | undefined {
  return RESENAS_PLANS[planId as ResenasPlanId]
}
