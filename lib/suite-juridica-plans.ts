/**
 * Configuracion centralizada de planes Suite Juridica.
 * Combo de 4 servicios con descuento vs compra individual.
 */

/** Source of truth for the valid plan ids. `SuiteJuridicaPlanId` is derived from
 * it so the list and the type can never drift apart. */
export const SUITE_JURIDICA_PLAN_IDS = ['abogado', 'profesional', 'estudio'] as const

export type SuiteJuridicaPlanId = (typeof SUITE_JURIDICA_PLAN_IDS)[number]

export interface SuiteServiceLimits {
  monitoringPlan: string   // plan individual a crear en MonitoringSubscription
  facturacionPlan: string  // plan individual a crear en FacturacionSubscription
  causasPlan: string       // plan individual a crear en CausasSubscription
  turnosPlan: string       // plan individual a crear en TurnosSubscription
}

export interface SuiteJuridicaPlanConfig {
  id: SuiteJuridicaPlanId
  name: string
  monthly: number
  title: string
  individualTotal: number  // sum of individual plans (for showing savings)
  savings: number          // percentage saved vs individual
  limits: SuiteServiceLimits
  features: string[]
}

export const SUITE_JURIDICA_PLANS: Record<SuiteJuridicaPlanId, SuiteJuridicaPlanConfig> = {
  abogado: {
    id: 'abogado',
    name: 'Abogado',
    monthly: 39000,
    title: 'Suite Juridica Abogado — Automatic IA Lab',
    individualTotal: 56000, // 19000 + 15000 + 10000 + 12000
    savings: 30,
    limits: {
      monitoringPlan: 'basico',
      facturacionPlan: 'basico',
      causasPlan: 'basico',
      turnosPlan: 'basico',
    },
    features: [
      'Notificaciones Judiciales (PJN + SCBA)',
      'Facturacion Electronica ARCA (1 PV, Facturas B)',
      'Dashboard de Causas MEV (30 causas, sync diaria)',
      'Turnos Online (1 profesional, L-V, 1 area)',
      '30% de ahorro vs planes individuales',
    ],
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 69000,
    title: 'Suite Juridica Profesional — Automatic IA Lab',
    individualTotal: 112000, // 35000 + 30000 + 22000 + 25000
    savings: 38,
    limits: {
      monitoringPlan: 'profesional',
      facturacionPlan: 'profesional',
      causasPlan: 'profesional',
      turnosPlan: 'profesional',
    },
    features: [
      'Notificaciones Judiciales (PJN + SCBA, alertas prioritarias)',
      'Facturacion Electronica ARCA (Facturas A+B, NC/ND)',
      'Dashboard de Causas MEV (100 causas, sync c/6hs, alertas email)',
      'Turnos Online (L-S, 5 areas, colores + logo)',
      'Jurisprudencia IA (acceso cuando se lance)',
      '38% de ahorro vs planes individuales',
    ],
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio Juridico',
    monthly: 149000,
    title: 'Suite Juridica Estudio — Automatic IA Lab',
    individualTotal: 230000, // 75000 + 60000 + 45000 + 50000
    savings: 35,
    limits: {
      monitoringPlan: 'estudio',
      facturacionPlan: 'estudio',
      causasPlan: 'estudio',
      turnosPlan: 'estudio',
    },
    features: [
      'Notificaciones Judiciales (PJN + SCBA, ilimitado)',
      'Facturacion Electronica ARCA (3 PV, todo comprobante, ilimitado)',
      'Dashboard de Causas MEV (causas ilimitadas, sync c/2hs)',
      'Turnos Online (3 profesionales, areas ilimitadas, subdominio)',
      'Jurisprudencia IA (acceso prioritario cuando se lance)',
      '35% de ahorro vs planes individuales',
      'Soporte dedicado',
    ],
  },
}

export const SUITE_JURIDICA_PLANS_LIST = [
  SUITE_JURIDICA_PLANS.abogado,
  SUITE_JURIDICA_PLANS.profesional,
  SUITE_JURIDICA_PLANS.estudio,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing SUITE_JURIDICA_PLANS directly: the map
 * is a plain object, so `SUITE_JURIDICA_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isSuiteJuridicaPlanId(value: unknown): value is SuiteJuridicaPlanId {
  return typeof value === 'string' && SUITE_JURIDICA_PLAN_IDS.some((id) => id === value)
}

export function getSuiteJuridicaPlanConfig(planId: unknown): SuiteJuridicaPlanConfig | undefined {
  return isSuiteJuridicaPlanId(planId) ? SUITE_JURIDICA_PLANS[planId] : undefined
}
