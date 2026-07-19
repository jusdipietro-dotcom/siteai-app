/**
 * Subscription lifecycle for generated sites (the `Project` model).
 *
 * A site can be down for three different reasons and the owner deserves to be
 * told which one: they never paid (`hasPaid: false`), they unpublished it
 * themselves (`status !== 'published'`), or we suspended it over billing
 * (`billingStatus`). Those three live in separate columns precisely so none of
 * them can be mistaken for another.
 *
 * The billing states:
 *   active    — paying normally.
 *   grace     — a recurring charge failed. The site STAYS LIVE until
 *               `graceUntil`, giving the owner a window to fix their card.
 *   suspended — site is down. Either the grace window elapsed
 *               (`suspendedReason: 'payment_failed'`) or the owner cancelled
 *               (`suspendedReason: 'cancelled'`, no grace — a deliberate act
 *               does not need a recovery window).
 */

/** Grace period granted after a failed recurring charge. */
export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

export type BillingStatus = 'active' | 'grace' | 'suspended'
export type SuspendedReason = 'payment_failed' | 'cancelled'

/** Deadline for a grace period starting now. */
export function getGraceEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + GRACE_PERIOD_MS)
}

/**
 * Is a grace window still open?
 *
 * A null deadline is NOT an open window. Failing closed matters here: a row
 * stuck at `billingStatus: 'grace'` with no deadline would otherwise serve a
 * non-paying site forever.
 */
export function isGraceActive(
  graceUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!graceUntil) return false
  return new Date(graceUntil) > now
}

/**
 * The billing state a project is in RIGHT NOW.
 *
 * A row can sit at 'grace' long after `graceUntil` has passed — the batch job
 * may be late, may have failed, or (as things actually stand) may have no
 * scheduler invoking it at all. Every read path goes through this instead of
 * trusting the stored column, so an elapsed grace period can never keep a site
 * online. Same contract as effectiveSubscriptionStatus() in lib/trial.ts.
 */
export function effectiveBillingStatus(
  project: { billingStatus?: string | null; graceUntil?: Date | string | null },
  now: Date = new Date()
): BillingStatus {
  const stored = (project.billingStatus ?? 'active') as BillingStatus
  if (stored === 'grace' && !isGraceActive(project.graceUntil, now)) {
    return 'suspended'
  }
  return stored
}

/**
 * Why a project's public site is not being served, or null if it is.
 *
 * Ordered by what the owner can act on: billing first (we took it down), then
 * payment, then their own publish state.
 */
export type SiteDownReason =
  | 'suspended_payment_failed'
  | 'suspended_cancelled'
  | 'never_paid'
  | 'unpublished'

export function siteDownReason(
  project: {
    status: string
    hasPaid: boolean
    billingStatus?: string | null
    graceUntil?: Date | string | null
    suspendedReason?: string | null
  },
  now: Date = new Date()
): SiteDownReason | null {
  if (effectiveBillingStatus(project, now) === 'suspended') {
    return project.suspendedReason === 'cancelled'
      ? 'suspended_cancelled'
      : 'suspended_payment_failed'
  }
  if (!project.hasPaid) return 'never_paid'
  if (project.status !== 'published') return 'unpublished'
  return null
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ProjectDelegate = {
  updateMany: (args: any) => Promise<{ count: number }>
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Persists grace expiries that the read paths already simulate.
 *
 * Purely an optimisation for reporting and dashboards — correctness does not
 * depend on it running, because the public gate and effectiveBillingStatus()
 * both derive expiry from `graceUntil` on every read. There is no scheduler in
 * the Dockerfile, so anything that only a cron would fix is a bug, not a plan.
 */
export async function expireStaleGrace(
  delegate: ProjectDelegate,
  where: Record<string, unknown> = {},
  now: Date = new Date()
): Promise<number> {
  const { count } = await delegate.updateMany({
    where: {
      ...where,
      billingStatus: 'grace',
      OR: [{ graceUntil: null }, { graceUntil: { lte: now } }],
    },
    data: {
      billingStatus: 'suspended',
      suspendedAt: now,
      suspendedReason: 'payment_failed',
    },
  })
  return count
}
