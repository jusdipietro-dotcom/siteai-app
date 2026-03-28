/**
 * Configuracion centralizada de planes de Turnos Online.
 */

export type TurnosPlanId = 'basico' | 'profesional' | 'estudio'

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

export function getTurnosPlanConfig(planId: string): TurnosPlanConfig | undefined {
  return TURNOS_PLANS[planId as TurnosPlanId]
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
