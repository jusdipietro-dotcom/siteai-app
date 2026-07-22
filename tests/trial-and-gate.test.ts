import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  TRIAL_DURATION_MS,
  effectiveSubscriptionStatus,
  expireStaleTrials,
  getTrialEndDate,
  getTrialRemaining,
  hasUsedTrial,
  isTrialActive,
} from '@/lib/trial'

/**
 * Trial expiry and the published-site gate — the two remaining read-time
 * enforcement points. Neither has a scheduler behind it, so both must be
 * correct on every read.
 *
 * lib/trial.ts derives "now" internally, so these tests pin the clock with fake
 * timers instead of sleeping. lib/published-site.ts is exercised through its
 * public loaders with a stubbed Prisma delegate — no database is reached.
 */

const NOW = new Date('2026-07-22T12:00:00.000Z')
const ms = (n: number) => new Date(NOW.getTime() + n)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('isTrialActive', () => {
  it('is active strictly before the deadline', () => {
    expect(isTrialActive(ms(1))).toBe(true)
    expect(isTrialActive(ms(TRIAL_DURATION_MS))).toBe(true)
  })

  it('is EXPIRED exactly at the deadline — the boundary is exclusive', () => {
    expect(isTrialActive(NOW)).toBe(false)
  })

  it('is expired after the deadline', () => {
    expect(isTrialActive(ms(-1))).toBe(false)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('treats a %s deadline as expired — fails closed', (_label, value) => {
    expect(isTrialActive(value)).toBe(false)
  })
})

describe('getTrialEndDate', () => {
  it('is exactly one trial duration from now', () => {
    expect(getTrialEndDate().getTime()).toBe(NOW.getTime() + TRIAL_DURATION_MS)
  })

  it('grants 3 days', () => {
    expect(TRIAL_DURATION_MS).toBe(3 * 24 * 60 * 60 * 1000)
  })

  it('produces a deadline that is active the moment it is issued', () => {
    expect(isTrialActive(getTrialEndDate())).toBe(true)
  })
})

describe('effectiveSubscriptionStatus', () => {
  it('keeps a live trial as trial', () => {
    const sub = { status: 'trial', trialEndsAt: ms(1000) }
    expect(effectiveSubscriptionStatus(sub).status).toBe('trial')
  })

  /**
   * The core guarantee: the row still literally says 'trial', but the deadline
   * passed, so every read path must see it as expired. Without this an expired
   * trial keeps granting access indefinitely.
   */
  it('downgrades an ELAPSED trial to trial_expired even though the row says trial', () => {
    const sub = { status: 'trial', trialEndsAt: ms(-1000) }
    expect(effectiveSubscriptionStatus(sub).status).toBe('trial_expired')
  })

  it('downgrades a trial with a NULL deadline', () => {
    expect(effectiveSubscriptionStatus({ status: 'trial', trialEndsAt: null }).status).toBe(
      'trial_expired'
    )
    expect(effectiveSubscriptionStatus({ status: 'trial' }).status).toBe('trial_expired')
  })

  it('handles both sides of the boundary', () => {
    expect(effectiveSubscriptionStatus({ status: 'trial', trialEndsAt: ms(1) }).status).toBe(
      'trial'
    )
    expect(effectiveSubscriptionStatus({ status: 'trial', trialEndsAt: NOW }).status).toBe(
      'trial_expired'
    )
  })

  /**
   * Only rows literally stored as 'trial' are touched. 'provisioning' is also
   * the status of a PAID subscription — downgrading it would cancel a live
   * customer.
   */
  it.each(['active', 'provisioning', 'pending_payment', 'cancelled', 'trial_expired'])(
    'never rewrites a %j subscription, whatever trialEndsAt says',
    (status) => {
      expect(effectiveSubscriptionStatus({ status, trialEndsAt: ms(-999999) }).status).toBe(
        status
      )
      expect(effectiveSubscriptionStatus({ status, trialEndsAt: null }).status).toBe(status)
    }
  )

  it('preserves the other fields of the record', () => {
    const sub = { id: 'sub-1', userId: 'u-1', status: 'trial', trialEndsAt: ms(-1) }
    const result = effectiveSubscriptionStatus(sub)
    expect(result.id).toBe('sub-1')
    expect(result.userId).toBe('u-1')
  })

  it('does not mutate the input', () => {
    const sub = { status: 'trial', trialEndsAt: ms(-1) }
    effectiveSubscriptionStatus(sub)
    expect(sub.status).toBe('trial')
  })
})

describe('expireStaleTrials', () => {
  const fakeDelegate = (count = 0) => ({
    updateMany: vi.fn().mockResolvedValue({ count }),
    findFirst: vi.fn().mockResolvedValue(null),
  })

  it('returns the number of rows the delegate reports', async () => {
    await expect(expireStaleTrials(fakeDelegate(3), 'u-1')).resolves.toBe(3)
  })

  it('scopes the update to the given user', async () => {
    const delegate = fakeDelegate()
    await expireStaleTrials(delegate, 'u-1')
    expect(delegate.updateMany.mock.calls[0][0].where.userId).toBe('u-1')
  })

  it('only targets rows literally stored as trial', async () => {
    const delegate = fakeDelegate()
    await expireStaleTrials(delegate, 'u-1')
    expect(delegate.updateMany.mock.calls[0][0].where.status).toBe('trial')
  })

  it('targets elapsed-or-null deadlines, matching isTrialActive', async () => {
    const delegate = fakeDelegate()
    await expireStaleTrials(delegate, 'u-1')
    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.OR).toEqual([{ trialEndsAt: null }, { trialEndsAt: { lte: NOW } }])
    // Write path and read path agree on the boundary.
    expect(isTrialActive(NOW)).toBe(false)
  })

  it('writes exactly the expired status and nothing else', async () => {
    const delegate = fakeDelegate()
    await expireStaleTrials(delegate, 'u-1')
    expect(delegate.updateMany.mock.calls[0][0].data).toEqual({ status: 'trial_expired' })
  })

  it('never touches provisioning rows — those can be paid customers', async () => {
    const delegate = fakeDelegate()
    await expireStaleTrials(delegate, 'u-1')
    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.status).not.toBe('provisioning')
    expect(where.status).toBe('trial')
  })
})

describe('hasUsedTrial', () => {
  const delegateReturning = (row: unknown) => ({
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    findFirst: vi.fn().mockResolvedValue(row),
  })

  it('is true when any previous row exists', async () => {
    await expect(hasUsedTrial(delegateReturning({ id: 'old' }), 'u-1', 'new')).resolves.toBe(
      true
    )
  })

  it('is false when there is no previous row', async () => {
    await expect(hasUsedTrial(delegateReturning(null), 'u-1', 'new')).resolves.toBe(false)
  })

  it('excludes the row just created by this request', async () => {
    const delegate = delegateReturning(null)
    await hasUsedTrial(delegate, 'u-1', 'just-created')
    expect(delegate.findFirst.mock.calls[0][0].where.id).toEqual({ not: 'just-created' })
  })

  it('scopes the lookup to the user', async () => {
    const delegate = delegateReturning(null)
    await hasUsedTrial(delegate, 'u-1', 'new')
    expect(delegate.findFirst.mock.calls[0][0].where.userId).toBe('u-1')
  })

  /**
   * ANY pre-existing row counts, whatever its status. Filtering by a specific
   * set of dead statuses used to miss rows still stored as 'trial', handing out
   * a fresh free trial on every attempt.
   */
  it('does not filter by status — a second free trial must never be granted', async () => {
    const delegate = delegateReturning(null)
    await hasUsedTrial(delegate, 'u-1', 'new')
    const { where } = delegate.findFirst.mock.calls[0][0]
    expect(where).not.toHaveProperty('status')
    expect(Object.keys(where).sort()).toEqual(['id', 'userId'])
  })
})

describe('getTrialRemaining', () => {
  it('reports a live trial as not expired', () => {
    const result = getTrialRemaining(ms(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000))
    expect(result.expired).toBe(false)
    expect(result.days).toBe(2)
    expect(result.hours).toBe(3)
  })

  it('reports an elapsed trial as expired', () => {
    expect(getTrialRemaining(ms(-1)).expired).toBe(true)
  })

  it('reports the exact deadline as expired, matching isTrialActive', () => {
    expect(getTrialRemaining(NOW).expired).toBe(true)
    expect(isTrialActive(NOW)).toBe(false)
  })

  it('reports a missing deadline as expired', () => {
    expect(getTrialRemaining(null).expired).toBe(true)
    expect(getTrialRemaining(undefined).expired).toBe(true)
  })

  it('always carries a non-empty human label', () => {
    for (const v of [null, ms(-1), ms(1000), ms(TRIAL_DURATION_MS)]) {
      expect(getTrialRemaining(v).label.length).toBeGreaterThan(0)
    }
  })

  it('agrees with isTrialActive on every sample', () => {
    for (const v of [null, undefined, ms(-1000), NOW, ms(1), ms(TRIAL_DURATION_MS)]) {
      expect(getTrialRemaining(v).expired).toBe(!isTrialActive(v))
    }
  })
})
