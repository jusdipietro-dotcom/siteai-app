/**
 * Configuracion centralizada de planes de Prospeccion AI.
 * Usada por backend (subscribe, webhook) y frontend (dashboard, landing).
 */

/** Source of truth for the valid plan ids. `ProspeccionPlanId` is derived from it
 * so the list and the type can never drift apart. */
export const PROSPECCION_PLAN_IDS = ['starter', 'profesional', 'enterprise'] as const

export type ProspeccionPlanId = (typeof PROSPECCION_PLAN_IDS)[number]

export interface ProspeccionPlanConfig {
  id: ProspeccionPlanId
  name: string
  monthly: number
  title: string            // Titulo para MercadoPago
  maxNichos: number        // Nichos permitidos
  maxCiudades: number      // Ciudades permitidas
  emailsPerDay: number     // Emails de prospeccion por dia
  multiAccount: boolean    // Multi-cuenta
  crmIntegration: boolean  // Integracion CRM
  weeklyReporting: boolean // Reporting semanal
  monthlyAdjust: boolean   // Ajuste mensual de estrategia
  supportType: 'email' | 'whatsapp' | 'dedicated' // Tipo de soporte
  features: string[]       // Features para mostrar en UI
}

export const PROSPECCION_PLANS: Record<ProspeccionPlanId, ProspeccionPlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthly: 25000,
    title: 'Prospeccion AI Starter — Automatic IA Lab',
    maxNichos: 1,
    maxCiudades: 3,
    emailsPerDay: 100,
    multiAccount: false,
    crmIntegration: false,
    weeklyReporting: false,
    monthlyAdjust: false,
    supportType: 'email',
    features: [
      '1 nicho de prospeccion',
      'Hasta 3 ciudades',
      '100 emails IA personalizados por dia',
      'Google Sheets en tiempo real',
      'Anti-spam + desuscripcion automatica',
      'Soporte por email',
    ],
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 45000,
    title: 'Prospeccion AI Profesional — Automatic IA Lab',
    maxNichos: 3,
    maxCiudades: 5,
    emailsPerDay: 100,
    multiAccount: false,
    crmIntegration: false,
    weeklyReporting: false,
    monthlyAdjust: true,
    supportType: 'whatsapp',
    features: [
      'Hasta 3 nichos de prospeccion',
      'Hasta 5 ciudades',
      '100 emails IA personalizados por dia',
      'Google Sheets en tiempo real',
      'Anti-spam + desuscripcion automatica',
      'Ajuste mensual de estrategia',
      'Soporte por WhatsApp',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 75000,
    title: 'Prospeccion AI Enterprise — Automatic IA Lab',
    maxNichos: 999,
    maxCiudades: 999,
    emailsPerDay: 100,
    multiAccount: true,
    crmIntegration: true,
    weeklyReporting: true,
    monthlyAdjust: true,
    supportType: 'dedicated',
    features: [
      'Nichos ilimitados + personalizados',
      'Ciudades ilimitadas',
      '100 emails IA personalizados por dia',
      'Multi-cuenta',
      'Integracion CRM',
      'Reporting semanal',
      'Ajuste mensual de estrategia',
      'Soporte dedicado',
    ],
  },
}

/** Lista ordenada para UI */
export const PROSPECCION_PLANS_LIST = [
  PROSPECCION_PLANS.starter,
  PROSPECCION_PLANS.profesional,
  PROSPECCION_PLANS.enterprise,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing PROSPECCION_PLANS directly: the map is
 * a plain object, so `PROSPECCION_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isProspeccionPlanId(value: unknown): value is ProspeccionPlanId {
  return typeof value === 'string' && PROSPECCION_PLAN_IDS.some((id) => id === value)
}

/** Helpers */
export function getPlanConfig(planId: unknown): ProspeccionPlanConfig | undefined {
  return isProspeccionPlanId(planId) ? PROSPECCION_PLANS[planId] : undefined
}

export function formatNichoLimit(n: number): string {
  return n >= 999 ? 'Ilimitados' : String(n)
}

export function formatCiudadLimit(n: number): string {
  return n >= 999 ? 'Ilimitadas' : String(n)
}
