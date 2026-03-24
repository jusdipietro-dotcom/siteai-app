/**
 * Configuración centralizada de planes de Email Marketing.
 * Usada por backend (subscribe, webhook) y frontend (dashboard, landing).
 */

export type EmailMarketingPlanId = 'basico' | 'profesional' | 'premium'

export interface EmailMarketingPlanConfig {
  id: EmailMarketingPlanId
  name: string
  monthly: number
  title: string            // Título para MercadoPago
  maxCampaigns: number     // Campañas activas simultáneas
  maxContacts: number      // Contactos por campaña
  emailsPerDay: number     // Envíos diarios por campaña
  maxSenders: number       // Direcciones de remitente distintas
  customTemplates: boolean // Templates personalizados por campaña
  prioritySupport: boolean // Soporte prioritario
  onboardingAssisted: boolean // Onboarding asistido por equipo
  senderType: 'gmail' | 'workspace' | 'any' // Tipo de cuenta de envío
}

export const EMAIL_MARKETING_PLANS: Record<EmailMarketingPlanId, EmailMarketingPlanConfig> = {
  basico: {
    id: 'basico',
    name: 'Básico',
    monthly: 15000,
    title: 'Email Marketing Básico — Automatic IA Lab',
    maxCampaigns: 1,
    maxContacts: 5000,
    emailsPerDay: 360,
    maxSenders: 1,
    customTemplates: false,
    prioritySupport: false,
    onboardingAssisted: false,
    senderType: 'gmail',
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    monthly: 25000,
    title: 'Email Marketing Profesional — Automatic IA Lab',
    maxCampaigns: 3,
    maxContacts: 20000,
    emailsPerDay: 1440,
    maxSenders: 3,
    customTemplates: true,
    prioritySupport: true,
    onboardingAssisted: false,
    senderType: 'workspace',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    monthly: 45000,
    title: 'Email Marketing Premium — Automatic IA Lab',
    maxCampaigns: 99,
    maxContacts: 100000,
    emailsPerDay: 1440,
    maxSenders: 99,
    customTemplates: true,
    prioritySupport: true,
    onboardingAssisted: true,
    senderType: 'any',
  },
}

/** Lista ordenada para UI */
export const EMAIL_MARKETING_PLANS_LIST = [
  EMAIL_MARKETING_PLANS.basico,
  EMAIL_MARKETING_PLANS.profesional,
  EMAIL_MARKETING_PLANS.premium,
]

/** Helpers */
export function getPlanConfig(planId: string): EmailMarketingPlanConfig | undefined {
  return EMAIL_MARKETING_PLANS[planId as EmailMarketingPlanId]
}

export function formatContactLimit(n: number): string {
  if (n >= 100000) return '100.000'
  return n.toLocaleString('es-AR')
}

export function formatCampaignLimit(n: number): string {
  return n >= 99 ? 'Ilimitadas' : String(n)
}

export function formatSenderLimit(n: number): string {
  return n >= 99 ? 'Ilimitados' : String(n)
}
