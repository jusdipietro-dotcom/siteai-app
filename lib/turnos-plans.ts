/**
 * Configuracion centralizada de planes de Turnos Online.
 */

/** Source of truth for the valid plan ids. `TurnosPlanId` is derived from it so
 * the list and the type can never drift apart. */
export const TURNOS_PLAN_IDS = ['basico', 'profesional', 'estudio'] as const

export type TurnosPlanId = (typeof TURNOS_PLAN_IDS)[number]

export interface TurnosPlanConfig {
  id: TurnosPlanId
  name: string
  monthly: number
  title: string
  maxProfesionales: number
  diasPermitidos: string        // L-V, L-S
  maxAreas: number
  customColors: boolean
  customLogo: boolean
  subdominio: boolean
  features: string[]
}

export const TURNOS_PLANS: Record<TurnosPlanId, TurnosPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Basico',
    monthly: 12000,
    title: 'Turnos Online Basico — Automatic IA Lab',
    maxProfesionales: 1,
    diasPermitidos: 'L-V',
    maxAreas: 1,
    customColors: false,
    customLogo: false,
    subdominio: false,
    features: [
      '1 profesional',
      'Lunes a viernes',
      '1 area de practica',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina de reservas publica',
    ],
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 25000,
    title: 'Turnos Online Profesional — Automatic IA Lab',
    maxProfesionales: 1,
    diasPermitidos: 'L-S',
    maxAreas: 5,
    customColors: true,
    customLogo: true,
    subdominio: false,
    features: [
      '1 profesional',
      'Lunes a sabado',
      'Hasta 5 areas de practica',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina de reservas personalizada',
      'Colores y logo propios',
      'Soporte prioritario',
    ],
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    monthly: 50000,
    title: 'Turnos Online Estudio — Automatic IA Lab',
    maxProfesionales: 3,
    diasPermitidos: 'L-S',
    maxAreas: 999,
    customColors: true,
    customLogo: true,
    subdominio: true,
    features: [
      'Hasta 3 profesionales',
      'Lunes a sabado',
      'Areas ilimitadas',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina de reservas personalizada',
      'Colores y logo propios',
      'Subdominio propio',
      'Soporte dedicado',
    ],
  },
}

export const TURNOS_PLANS_LIST = [
  TURNOS_PLANS.basico,
  TURNOS_PLANS.profesional,
  TURNOS_PLANS.estudio,
]

/**
 * Narrows an untrusted value (request body, DB column) to a known plan id.
 *
 * Checks the id list instead of indexing TURNOS_PLANS directly: the map is a
 * plain object, so `TURNOS_PLANS['toString']` resolves through Object.prototype
 * and returns a truthy function — enough to slip past an `if (!planConfig)`
 * guard and reach the pricing math with an undefined `monthly`.
 */
export function isTurnosPlanId(value: unknown): value is TurnosPlanId {
  return typeof value === 'string' && TURNOS_PLAN_IDS.some((id) => id === value)
}

export function getTurnosPlanConfig(planId: unknown): TurnosPlanConfig | undefined {
  return isTurnosPlanId(planId) ? TURNOS_PLANS[planId] : undefined
}

/** Default practice areas for law firms */
export const DEFAULT_PRACTICE_AREAS = [
  'Civil',
  'Penal',
  'Laboral',
  'Familia',
  'Sucesiones',
  'Accidentes de trabajo',
  'Despidos',
  'Comercial',
  'Administrativo',
]

/** Day names for display */
export const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
}
