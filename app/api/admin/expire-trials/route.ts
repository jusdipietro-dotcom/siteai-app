import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/**
 * Constant-time comparison of the cron shared secret.
 * Returns false when CRON_SECRET is unset, so the endpoint never becomes
 * unauthenticated by an environment misconfiguration.
 */
function hasValidCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false

  const provided = req.headers.get('x-cron-secret')
  if (!provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Either an admin session or a valid cron secret authorizes this endpoint. */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (hasValidCronSecret(req)) return true
  return (await requireAdmin()) !== null
}

/**
 * POST: Expire all trials that have passed their trialEndsAt date.
 * Callable by an admin session, or by a scheduler sending the x-cron-secret
 * header (CRON_SECRET env var).
 *
 * This is a housekeeping job, not the access gate: read paths already downgrade
 * an expired trial via effectiveSubscriptionStatus(), so access does not depend
 * on this job ever running.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

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

// Also allow GET for easy cron/health check (same authorization as POST)
export async function GET(req: NextRequest) {
  return POST(req)
}
