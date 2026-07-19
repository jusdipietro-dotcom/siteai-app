/**
 * Trial system — 3-day free trial for all services.
 * After trial expires, user must subscribe via MercadoPago.
 */

/** Trial duration in milliseconds (3 days) */
export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000

/** Calculate trial end date from now */
export function getTrialEndDate(): Date {
  return new Date(Date.now() + TRIAL_DURATION_MS)
}

/** Check if a trial is still valid */
export function isTrialActive(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

/**
 * Resolves the status a subscription should be treated as RIGHT NOW.
 *
 * A record can sit in the DB with status 'trial' long after trialEndsAt has
 * passed — the batch expiry job may be late, may have failed, or may never have
 * run. Every read path must go through this instead of trusting the stored
 * status, so an expired trial can never keep granting access.
 */
export function effectiveSubscriptionStatus<T extends { status: string; trialEndsAt?: Date | string | null }>(
  sub: T
): T {
  if (sub.status === 'trial' && !isTrialActive(sub.trialEndsAt as Date | null | undefined)) {
    return { ...sub, status: 'trial_expired' }
  }
  return sub
}

/**
 * Minimal structural shape of a Prisma subscription delegate.
 * Loose on purpose so the same helpers work with `prisma.xSubscription` and
 * with the `tx.xSubscription` handed to an interactive transaction, across the
 * twelve product models — none of which share a generated base type.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type SubscriptionDelegate = {
  updateMany: (args: any) => Promise<{ count: number }>
  findFirst: (args: any) => Promise<any>
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Persists the trial expiry that read paths only ever simulated.
 *
 * effectiveSubscriptionStatus() downgrades an expired trial in the HTTP
 * response, but the row keeps literally saying 'trial'. The batch job that
 * would persist it (/api/admin/expire-trials) has no scheduler invoking it, so
 * in practice the downgrade never landed. That left expired-trial users denied
 * access by the read path AND rejected with 409 by subscribe — unable to use
 * the product and unable to pay for it.
 *
 * Calling this before a subscribe duplicate-check makes the stored status
 * truthful, so `status: 'trial'` in the DB means a trial that is actually live.
 * The duplicate checks then answer "does this user have a LIVE subscription?"
 * without each of them having to re-derive trial expiry from trialEndsAt.
 *
 * Mirrors the expiry semantics of isTrialActive(): a null trialEndsAt is not an
 * active trial. Only rows literally stored as 'trial' are touched — notably NOT
 * 'provisioning', which is also the status of a PAID subscription and would
 * cancel live customers.
 */
export async function expireStaleTrials(
  delegate: SubscriptionDelegate,
  userId: string
): Promise<number> {
  const now = new Date()
  const { count } = await delegate.updateMany({
    where: {
      userId,
      status: 'trial',
      OR: [{ trialEndsAt: null }, { trialEndsAt: { lte: now } }],
    },
    data: { status: 'trial_expired' },
  })
  return count
}

/**
 * Answers "has this user already used their trial for this product?" — a
 * different question from "do they have a live subscription right now", which
 * is what the duplicate check answers.
 *
 * ANY pre-existing row counts, whatever its status. A user who has been here
 * before does not get a second free trial; they proceed to pending_payment and
 * on to MercadoPago. Checking for a specific set of dead statuses used to miss
 * rows still stored as 'trial' (and, in lexpost, 'trial_expired' too), which
 * would hand out a fresh trial every time.
 *
 * @param excludeId the row just created by this request, which must not count
 *                  as evidence of a previous subscription.
 */
export async function hasUsedTrial(
  delegate: SubscriptionDelegate,
  userId: string,
  excludeId: string
): Promise<boolean> {
  const previous = await delegate.findFirst({
    where: { userId, id: { not: excludeId } },
    select: { id: true },
  })
  return previous !== null
}

/** Get remaining trial time in human-readable format */
export function getTrialRemaining(trialEndsAt: Date | null | undefined): {
  expired: boolean
  days: number
  hours: number
  label: string
} {
  if (!trialEndsAt) return { expired: true, days: 0, hours: 0, label: 'Sin trial' }
  const now = Date.now()
  const end = new Date(trialEndsAt).getTime()
  const diff = end - now
  if (diff <= 0) return { expired: true, days: 0, hours: 0, label: 'Trial finalizado' }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const label = days > 0 ? `${days}d ${hours}h restantes` : `${hours}h restantes`
  return { expired: false, days, hours, label }
}
