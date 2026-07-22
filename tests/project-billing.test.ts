import { describe, it, expect, vi } from 'vitest'
import {
  GRACE_PERIOD_MS,
  effectiveBillingStatus,
  expireStaleGrace,
  getGraceEndDate,
  isGraceActive,
  siteDownReason,
} from '@/lib/project-billing'

/**
 * The billing state machine. Grace expiry is enforced at READ time — there is
 * no scheduler in the Dockerfile — so effectiveBillingStatus() is the only
 * thing standing between an elapsed grace period and a site that stays online
 * for free forever.
 *
 * Every assertion injects `now`. Nothing here reads the wall clock.
 */

const NOW = new Date('2026-07-22T12:00:00.000Z')
const ms = (n: number) => new Date(NOW.getTime() + n)

describe('getGraceEndDate', () => {
  it('is exactly one grace period after the given instant', () => {
    expect(getGraceEndDate(NOW).getTime()).toBe(NOW.getTime() + GRACE_PERIOD_MS)
  })

  it('grants 7 days', () => {
    expect(GRACE_PERIOD_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('produces a deadline that is still open at the moment it is issued', () => {
    expect(isGraceActive(getGraceEndDate(NOW), NOW)).toBe(true)
  })
})

describe('isGraceActive', () => {
  it('is open strictly before the deadline', () => {
    expect(isGraceActive(ms(1), NOW)).toBe(true)
    expect(isGraceActive(ms(GRACE_PERIOD_MS), NOW)).toBe(true)
  })

  it('is CLOSED exactly at the deadline — the boundary is exclusive', () => {
    expect(isGraceActive(NOW, NOW)).toBe(false)
  })

  it('is closed after the deadline', () => {
    expect(isGraceActive(ms(-1), NOW)).toBe(false)
    expect(isGraceActive(ms(-GRACE_PERIOD_MS), NOW)).toBe(false)
  })

  /**
   * Fails CLOSED. A row stuck at 'grace' with no deadline would otherwise serve
   * a non-paying site forever.
   */
  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('treats a %s deadline as NOT an open window', (_label, value) => {
    expect(isGraceActive(value, NOW)).toBe(false)
  })

  it('accepts an ISO string deadline as well as a Date', () => {
    expect(isGraceActive(ms(1000).toISOString(), NOW)).toBe(true)
    expect(isGraceActive(ms(-1000).toISOString(), NOW)).toBe(false)
  })
})

describe('effectiveBillingStatus', () => {
  it('leaves an active project active', () => {
    expect(effectiveBillingStatus({ billingStatus: 'active', graceUntil: null }, NOW)).toBe(
      'active'
    )
  })

  it('keeps a project in grace while the window is still open', () => {
    expect(
      effectiveBillingStatus({ billingStatus: 'grace', graceUntil: ms(1000) }, NOW)
    ).toBe('grace')
  })

  /**
   * The core of the module: the stored column still says 'grace', but the
   * window elapsed, so every read path must see 'suspended'.
   */
  it('reports an ELAPSED grace window as suspended even though the row says grace', () => {
    expect(
      effectiveBillingStatus({ billingStatus: 'grace', graceUntil: ms(-1000) }, NOW)
    ).toBe('suspended')
  })

  it('reports grace with a NULL deadline as suspended', () => {
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: null }, NOW)).toBe(
      'suspended'
    )
    expect(effectiveBillingStatus({ billingStatus: 'grace' }, NOW)).toBe('suspended')
  })

  it('handles both sides of the boundary', () => {
    // One ms before expiry: still in grace.
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: ms(1) }, NOW)).toBe(
      'grace'
    )
    // Exactly at expiry: suspended.
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: NOW }, NOW)).toBe(
      'suspended'
    )
    // One ms after: suspended.
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: ms(-1) }, NOW)).toBe(
      'suspended'
    )
  })

  it('leaves a suspended project suspended, whatever graceUntil says', () => {
    expect(
      effectiveBillingStatus({ billingStatus: 'suspended', graceUntil: ms(999999) }, NOW)
    ).toBe('suspended')
  })

  it('defaults a missing/null status to active — legacy rows predate the column', () => {
    expect(effectiveBillingStatus({}, NOW)).toBe('active')
    expect(effectiveBillingStatus({ billingStatus: null }, NOW)).toBe('active')
  })

  it('does not resurrect an active project just because graceUntil is in the past', () => {
    expect(
      effectiveBillingStatus({ billingStatus: 'active', graceUntil: ms(-999999) }, NOW)
    ).toBe('active')
  })
})

describe('siteDownReason', () => {
  const published = { status: 'published', hasPaid: true }

  it('returns null when the site is legitimately live', () => {
    expect(siteDownReason({ ...published, billingStatus: 'active' }, NOW)).toBeNull()
  })

  it('returns null while in an OPEN grace window — the site stays live', () => {
    expect(
      siteDownReason({ ...published, billingStatus: 'grace', graceUntil: ms(1000) }, NOW)
    ).toBeNull()
  })

  it('takes the site down once the grace window elapses', () => {
    expect(
      siteDownReason({ ...published, billingStatus: 'grace', graceUntil: ms(-1000) }, NOW)
    ).toBe('suspended_payment_failed')
  })

  it('distinguishes a cancellation from a failed payment', () => {
    expect(
      siteDownReason(
        { ...published, billingStatus: 'suspended', suspendedReason: 'cancelled' },
        NOW
      )
    ).toBe('suspended_cancelled')

    expect(
      siteDownReason(
        { ...published, billingStatus: 'suspended', suspendedReason: 'payment_failed' },
        NOW
      )
    ).toBe('suspended_payment_failed')
  })

  it('reports never_paid before unpublished — the owner can act on payment', () => {
    expect(
      siteDownReason({ status: 'draft', hasPaid: false, billingStatus: 'active' }, NOW)
    ).toBe('never_paid')
  })

  it('reports unpublished for a paid but unpublished project', () => {
    expect(
      siteDownReason({ status: 'draft', hasPaid: true, billingStatus: 'active' }, NOW)
    ).toBe('unpublished')
  })

  it('prioritises billing suspension over never_paid', () => {
    expect(
      siteDownReason(
        { status: 'draft', hasPaid: false, billingStatus: 'suspended' },
        NOW
      )
    ).toBe('suspended_payment_failed')
  })
})

/**
 * expireStaleGrace persists what the read paths already simulate. The `where`
 * it builds IS the contract: too broad and it suspends paying customers, too
 * narrow and dashboards keep showing stale 'grace'.
 */
describe('expireStaleGrace', () => {
  const fakeDelegate = (count = 0) => ({
    updateMany: vi.fn().mockResolvedValue({ count }),
  })

  it('returns the number of rows the delegate reports', async () => {
    const delegate = fakeDelegate(7)
    await expect(expireStaleGrace(delegate, {}, NOW)).resolves.toBe(7)
  })

  it('only ever targets rows literally stored as grace', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.billingStatus).toBe('grace')
  })

  it('targets exactly the elapsed-or-null deadlines, and nothing else', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.OR).toEqual([{ graceUntil: null }, { graceUntil: { lte: NOW } }])
  })

  it('uses `lte` so a deadline exactly at `now` is expired — matching isGraceActive', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    const deadlineClause = where.OR.find((c: Record<string, unknown>) => c.graceUntil !== null)
    expect(deadlineClause).toEqual({ graceUntil: { lte: NOW } })
    // The write path and the read path must agree on the boundary.
    expect(isGraceActive(NOW, NOW)).toBe(false)
  })

  it('merges a caller-supplied scope into the where clause', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, { userId: 'user-123' }, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.userId).toBe('user-123')
    expect(where.billingStatus).toBe('grace')
  })

  /**
   * A caller-supplied scope must never be able to widen the target set. If
   * `billingStatus` from the caller won, `{ billingStatus: 'active' }` would
   * suspend every paying customer in one call.
   */
  it('does NOT let a caller scope override the grace guard', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, { billingStatus: 'active' }, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.billingStatus).toBe('grace')
  })

  it('does NOT let a caller scope override the deadline guard', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, { OR: [{ graceUntil: null }] }, NOW)

    const { where } = delegate.updateMany.mock.calls[0][0]
    expect(where.OR).toEqual([{ graceUntil: null }, { graceUntil: { lte: NOW } }])
  })

  it('writes the suspension with its reason and timestamp', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)

    const { data } = delegate.updateMany.mock.calls[0][0]
    expect(data).toEqual({
      billingStatus: 'suspended',
      suspendedAt: NOW,
      suspendedReason: 'payment_failed',
    })
  })

  it('never marks a batch-expired row as cancelled — that reason is a deliberate act', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)

    const { data } = delegate.updateMany.mock.calls[0][0]
    expect(data.suspendedReason).not.toBe('cancelled')
  })

  it('issues exactly one write', async () => {
    const delegate = fakeDelegate()
    await expireStaleGrace(delegate, {}, NOW)
    expect(delegate.updateMany).toHaveBeenCalledTimes(1)
  })

  it('agrees with effectiveBillingStatus: every row it targets already reads as suspended', () => {
    // The batch job must be a no-op from the reader's point of view.
    const targeted = [
      { billingStatus: 'grace', graceUntil: null },
      { billingStatus: 'grace', graceUntil: NOW },
      { billingStatus: 'grace', graceUntil: ms(-1) },
    ]
    for (const row of targeted) {
      expect(effectiveBillingStatus(row, NOW)).toBe('suspended')
    }
    // ...and a row it does NOT target still reads as grace.
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: ms(1) }, NOW)).toBe(
      'grace'
    )
  })
})
