/**
 * Configuración centralizada de planes de Monitoreo Judicial.
 * Usada por backend (subscribe, webhook, mp/create) y frontend (dashboard, landing).
 */

export type MonitoreoPlanId = 'basico' | 'profesional' | 'estudio'

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

export function getMonitoreoPlan(planId: string): MonitoreoPlanConfig | undefined {
  return MONITOREO_PLANS[planId as MonitoreoPlanId]
}
