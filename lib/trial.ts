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
