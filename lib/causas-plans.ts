/**
 * Configuracion centralizada de planes de Dashboard Causas MEV.
 * Usada por backend (subscribe, webhook) y frontend (dashboard, landing).
 */

export type CausasPlanId = 'basico' | 'profesional' | 'estudio'

export interface CausasPlanConfig {
  id: CausasPlanId
  name: string
  monthly: number
  title: string
  maxCausas: number
  scrapeFrequency: string   // 24h, 6h, 2h
  alertasEmail: boolean
  exportData: boolean
  textoCompleto: boolean    // Phase 3: full proveído text extraction
  prioritySupport: boolean
  features: string[]
}

export const CAUSAS_PLANS: Record<CausasPlanId, CausasPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 10000,
    title: 'Dashboard Causas Básico — Automatic IA Lab',
    maxCausas: 30,
    scrapeFrequency: '24h',
    alertasEmail: false,
    exportData: false,
    textoCompleto: false,
    prioritySupport: false,
    features: [
      'Hasta 30 causas monitoreadas',
      'Sincronización diaria',
      'Vista de movimientos',
      'Búsqueda por carátula',
      'Estados de expedientes',
    ],
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 22000,
    title: 'Dashboard Causas Profesional — Automatic IA Lab',
    maxCausas: 100,
    scrapeFrequency: '6h',
    alertasEmail: true,
    exportData: true,
    textoCompleto: false,
    prioritySupport: true,
    features: [
      'Hasta 100 causas monitoreadas',
      'Sincronización cada 6 horas',
      'Vista de movimientos',
      'Alertas por email (nuevos movimientos)',
      'Exportar datos (CSV/PDF)',
      'Búsqueda por carátula',
      'Soporte prioritario',
    ],
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio',
    monthly: 45000,
    title: 'Dashboard Causas Estudio — Automatic IA Lab',
    maxCausas: 999999,
    scrapeFrequency: '2h',
    alertasEmail: true,
    exportData: true,
    textoCompleto: true,
    prioritySupport: true,
    features: [
      'Causas ilimitadas',
      'Sincronización cada 2 horas',
      'Vista de movimientos + texto completo',
      'Alertas por email (nuevos movimientos)',
      'Exportar datos (CSV/PDF)',
      'Búsqueda avanzada',
      'Soporte dedicado',
    ],
  },
}

/** Lista ordenada para UI */
export const CAUSAS_PLANS_LIST = [
  CAUSAS_PLANS.basico,
  CAUSAS_PLANS.profesional,
  CAUSAS_PLANS.estudio,
]

/** Helpers */
export function getCausasPlanConfig(planId: string): CausasPlanConfig | undefined {
  return CAUSAS_PLANS[planId as CausasPlanId]
}

export function formatCausasLimit(n: number): string {
  return n >= 999999 ? 'Ilimitadas' : `${n}`
}

/** Departamentos judiciales SCBA */
export const DEPARTAMENTOS_MEV: { id: string; nombre: string }[] = [
  { id: '1', nombre: 'Azul' },
  { id: '2', nombre: 'Bahía Blanca' },
  { id: '3', nombre: 'Dolores' },
  { id: '4', nombre: 'Junín' },
  { id: '5', nombre: 'La Matanza' },
  { id: '6', nombre: 'La Plata' },
  { id: '7', nombre: 'Lomas de Zamora' },
  { id: '8', nombre: 'Mar del Plata' },
  { id: '9', nombre: 'Mercedes' },
  { id: '10', nombre: 'Morón' },
  { id: '11', nombre: 'Necochea' },
  { id: '12', nombre: 'Pergamino' },
  { id: '13', nombre: 'Quilmes' },
  { id: '14', nombre: 'San Isidro' },
  { id: '15', nombre: 'San Martín' },
  { id: '16', nombre: 'San Nicolás' },
  { id: '17', nombre: 'Trenque Lauquen' },
  { id: '18', nombre: 'Zárate-Campana' },
  { id: '19', nombre: 'Moreno-General Rodríguez' },
  { id: '20', nombre: 'Avellaneda-Lanús' },
  { id: '21', nombre: 'Florencio Varela' },
  { id: '22', nombre: 'Ituzaingó' },
]
