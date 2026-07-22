/**
 * Configuracion centralizada de planes de Facturacion Electronica ARCA.
 * Usada por backend (subscribe, webhook) y frontend (dashboard, landing).
 */

/** Source of truth for the valid plan ids. `FacturacionPlanId` is derived from it
 * so the list and the type can never drift apart. */
export const FACTURACION_PLAN_IDS = ['basico', 'profesional', 'estudio'] as const

export type FacturacionPlanId = (typeof FACTURACION_PLAN_IDS)[number]

export interface FacturacionPlanConfig {
  id: FacturacionPlanId
  name: string
  monthly: number
  title: string              // Titulo para MercadoPago
  maxPuntosVenta: number     // Puntos de venta permitidos
  maxFacturasMes: number     // Facturas por mes
  tiposComprobante: string[] // Tipos de comprobante habilitados
  multiUsuario: boolean
  prioritySupport: boolean
  features: string[]         // Features para mostrar en UI
}

export const FACTURACION_PLANS: Record<FacturacionPlanId, FacturacionPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 15000,
    title: 'Facturación Electrónica Básico — Automatic IA Lab',
    maxPuntosVenta: 1,
    maxFacturasMes: 50,
    tiposComprobante: ['B'],
    multiUsuario: false,
    prioritySupport: false,
    features: [
      '1 punto de venta',
      'Facturas B (hasta 50/mes)',
      'PDF con QR reglamentario',
      'CAE automático (ARCA)',
      'Gestión de clientes',
      'Historial de comprobantes',
    ],
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 30000,
    title: 'Facturación Electrónica Profesional — Automatic IA Lab',
    maxPuntosVenta: 1,
    maxFacturasMes: 200,
    tiposComprobante: ['A', 'B'],
    multiUsuario: false,
    prioritySupport: true,
    features: [
      '1 punto de venta',
      'Facturas A + B (hasta 200/mes)',
      'Notas de crédito y débito',
      'PDF con QR reglamentario',
      'CAE automático (ARCA)',
      'Gestión de clientes',
      'Historial de comprobantes',
      'Soporte prioritario',
    ],
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    monthly: 60000,
    title: 'Facturación Electrónica Estudio — Automatic IA Lab',
    maxPuntosVenta: 3,
    maxFacturasMes: 999999,
    tiposComprobante: ['A', 'B', 'C'],
    multiUsuario: true,
    prioritySupport: true,
    features: [
      'Hasta 3 puntos de venta',
      'Facturas A + B + C (ilimitadas)',
      'Notas de crédito y débito',
      'PDF con QR reglamentario',
      'CAE automático (ARCA)',
      'Gestión de clientes',
      'Historial de comprobantes',
      'Multi-usuario',
      'Soporte dedicado',
    ],
  },
}

/** Lista ordenada para UI */
export const FACTURACION_PLANS_LIST = [
  FACTURACION_PLANS.basico,
  FACTURACION_PLANS.profesional,
  FACTURACION_PLANS.estudio,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing FACTURACION_PLANS directly: the map is
 * a plain object, so `FACTURACION_PLANS['toString']` resolves through
 * Object.prototype and returns a truthy function — enough to slip past an
 * `if (!planConfig)` guard and reach the pricing math with an undefined
 * `monthly`.
 */
export function isFacturacionPlanId(value: unknown): value is FacturacionPlanId {
  return typeof value === 'string' && FACTURACION_PLAN_IDS.some((id) => id === value)
}

/** Helpers */
export function getFacturacionPlanConfig(planId: unknown): FacturacionPlanConfig | undefined {
  return isFacturacionPlanId(planId) ? FACTURACION_PLANS[planId] : undefined
}

export function formatFacturaLimit(n: number): string {
  return n >= 999999 ? 'Ilimitadas' : `${n}/mes`
}
