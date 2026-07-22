import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { expireStaleGrace } from '@/lib/project-billing'
import {
  findAccountsDueForPurge,
  purgeAccount,
  type PurgeCounts,
} from '@/lib/account-deletion'

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

  // Persist generator grace expiry too. Access control never depended on this
  // (publishedGate derives expiry from graceUntil on every read), but the
  // stored row is what the suspension email and the operator reports read, so
  // without this pass a customer can go dark without ever being told.
  let gracePersisted = 0
  try {
    gracePersisted = await expireStaleGrace(prisma.project, {}, now)
    if (gracePersisted > 0) console.log(`[Expire Trials] Suspended ${gracePersisted} projects past grace`)
  } catch (e) {
    console.error('[Expire Trials] Error expiring project grace:', e)
  }

  // Purge the accounts whose 30-day deletion window has elapsed. Folded into
  // this job on purpose rather than given its own scheduler: this endpoint is
  // ALREADY called daily by n8n with x-cron-secret, and a second cron is a
  // second thing that can silently stop running — which, for a deletion
  // promise, means quietly failing to keep it.
  //
  // Isolated in its own try/catch for the same reason the grace pass is: a
  // failure here must not stop trials from expiring, and vice versa.
  let purge: PurgeSweepSummary = { purged: 0, failed: 0, counts: {} }
  try {
    purge = await purgeDueAccounts(now)
  } catch (e) {
    console.error('[Expire Trials] Error purging deleted accounts:', e)
  }

  return NextResponse.json({
    expired: total,
    details: results,
    graceSuspended: gracePersisted,
    accountsPurged: purge.purged,
    accountPurgeFailures: purge.failed,
    purgeDetails: purge.counts,
  })
}

interface PurgeSweepSummary {
  purged: number
  failed: number
  counts: PurgeCounts
}

/**
 * Phase 2 of account deletion: destroy the personal data of every account whose
 * 30 days are up.
 *
 * Each account is purged in its OWN transaction, so one account with a
 * surprising row shape cannot roll back the purges of the accounts beside it —
 * and a failure leaves that account still due, so the next daily run retries it
 * rather than marking it done.
 */
async function purgeDueAccounts(now: Date): Promise<PurgeSweepSummary> {
  const due = await findAccountsDueForPurge(prisma.user, now)
  const summary: PurgeSweepSummary = { purged: 0, failed: 0, counts: {} }

  for (const account of due) {
    try {
      const result = await prisma.$transaction((tx) =>
        // The transaction client exposes the same delegates; purgeAccount only
        // needs findMany/updateMany/update/deleteMany off each of them.
        purgeAccount(tx as unknown as Parameters<typeof purgeAccount>[0], account, now)
      )

      // Files are unlinked only after COMMIT — an unlink cannot be rolled back,
      // so doing it inside the transaction would destroy a customer's uploads
      // even on a path where the database work was undone.
      await unlinkUploads(result.uploadFilenames)

      summary.purged += 1
      for (const [model, count] of Object.entries(result.counts)) {
        summary.counts[model] = (summary.counts[model] ?? 0) + count
      }
      console.log(`[Expire Trials] Purged account ${account.id}:`, result.counts)
    } catch (e) {
      summary.failed += 1
      console.error(`[Expire Trials] Purge FAILED for account ${account.id}:`, e)
    }
  }

  if (summary.purged > 0 || summary.failed > 0) {
    console.log(
      `[Expire Trials] Account purge sweep: ${summary.purged} purged, ${summary.failed} failed`
    )
  }
  return summary
}

/**
 * Removes the uploaded files themselves.
 *
 * `GET /api/uploads/[filename]` is public and reads straight off disk without
 * consulting the database, so a purge that dropped only the Media rows would
 * leave every photo permanently fetchable by URL.
 *
 * Best-effort per file: a missing file (already deleted, or the row was stale)
 * is the expected case and must not fail the sweep. An orphan left behind is
 * logged so it is at least visible.
 */
async function unlinkUploads(filenames: readonly string[]): Promise<void> {
  for (const filename of filenames) {
    try {
      await unlink(join(process.cwd(), 'public', 'uploads', filename))
    } catch (e) {
      const code = (e as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') {
        console.error(`[Expire Trials] Could not unlink upload ${filename}:`, e)
      }
    }
  }
}

// Also allow GET for easy cron/health check (same authorization as POST)
export async function GET(req: NextRequest) {
  return POST(req)
}
