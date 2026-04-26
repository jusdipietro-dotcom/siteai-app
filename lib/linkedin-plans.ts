/**
 * Configuración centralizada de planes de LinkedIn Optimizer IA.
 */

export type LinkedInPlanId = 'basico' | 'profesional' | 'agencia'

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

export function getLinkedInPlan(planId: string): LinkedInPlanConfig | undefined {
  return LINKEDIN_PLANS[planId as LinkedInPlanId]
}
