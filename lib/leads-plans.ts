/**
 * Configuración centralizada de planes de Captación de Leads IA.
 */

export type LeadsPlanId = 'basico' | 'profesional'

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

export function getLeadsPlan(planId: string): LeadsPlanConfig | undefined {
  return LEADS_PLANS[planId as LeadsPlanId]
}
