import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * POST: Expire all trials that have passed their trialEndsAt date.
 * Can be called by a cron job or manually from admin.
 * Also accessible via the Dockerfile CMD as a periodic task.
 */
export async function POST() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const now = new Date()
  const models = [
    'MonitoringSubscription',
    'ReviewsSubscription',
    'LinkedInSubscription',
    'TradingSubscription',
    'LeadsSubscription',
    'EmailMarketingSubscription',
    'ProspeccionSubscription',
    'FacturacionSubscription',
    'CausasSubscription',
    'TurnosSubscription',
    'SuiteJuridicaSubscription',
  ] as const

  const results: Record<string, number> = {}

  for (const model of models) {
    try {
      const { count } = await (prisma as any)[model[0].toLowerCase() + model.slice(1)].updateMany({
        where: {
          status: 'trial',
          trialEndsAt: { lte: now },
        },
        data: { status: 'trial_expired' },
      })
      if (count > 0) results[model] = count
    } catch (e) {
      console.error(`[Expire Trials] Error on ${model}:`, e)
    }
  }

  const total = Object.values(results).reduce((a, b) => a + b, 0)
  console.log(`[Expire Trials] Expired ${total} trials:`, results)

  return NextResponse.json({ expired: total, details: results })
}

// Also allow GET for easy cron/health check
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  return POST()
}
