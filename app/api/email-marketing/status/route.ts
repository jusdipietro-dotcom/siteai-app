import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig, EMAIL_MARKETING_PLANS_LIST } from '@/lib/email-marketing-plans'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const subscriptions = await prisma.emailMarketingSubscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { coupon: { select: { code: true, discount: true } } },
  })

  // Calcular uso actual sobre suscripciones activas
  const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'provisioning')
  const activeCampaigns = activeSubs.length
  const totalContacts = activeSubs.reduce((sum, s) => sum + s.contactCount, 0)
  const distinctSenders = [...new Set(activeSubs.map(s => s.senderEmail))]

  // Determinar plan actual (el más alto entre las activas, o null)
  const planPriority = { basico: 1, profesional: 2, premium: 3 } as Record<string, number>
  const currentPlanId = activeSubs.length > 0
    ? activeSubs.reduce((best, s) => (planPriority[s.plan] ?? 0) > (planPriority[best.plan] ?? 0) ? s : best).plan
    : null
  const currentPlan = currentPlanId ? getPlanConfig(currentPlanId) : null

  return NextResponse.json({
    subscriptions,
    usage: {
      activeCampaigns,
      totalContacts,
      distinctSenders: distinctSenders.length,
      senderEmails: distinctSenders,
    },
    limits: currentPlan ? {
      plan: currentPlan.id,
      planName: currentPlan.name,
      maxCampaigns: currentPlan.maxCampaigns,
      maxContacts: currentPlan.maxContacts,
      emailsPerDay: currentPlan.emailsPerDay,
      maxSenders: currentPlan.maxSenders,
      customTemplates: currentPlan.customTemplates,
      prioritySupport: currentPlan.prioritySupport,
      onboardingAssisted: currentPlan.onboardingAssisted,
      senderType: currentPlan.senderType,
    } : null,
    plans: EMAIL_MARKETING_PLANS_LIST.map(p => ({
      id: p.id,
      name: p.name,
      monthly: p.monthly,
      maxCampaigns: p.maxCampaigns,
      maxContacts: p.maxContacts,
      emailsPerDay: p.emailsPerDay,
      maxSenders: p.maxSenders,
      customTemplates: p.customTemplates,
      prioritySupport: p.prioritySupport,
      senderType: p.senderType,
    })),
  })
}
