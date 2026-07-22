import { describe, it, expect } from 'vitest'

import {
  ADMIN_OVERVIEW_PAGE_SIZE,
  TRIAL_EXPIRY_WINDOW_MS,
  buildAttentionItems,
  buildCustomerRows,
  clampOverviewPage,
  currentMonthRange,
  daysUntil,
  isAllClear,
  overviewPageCount,
  pageSlice,
  paidProvenance,
  summarizeProjects,
  trialExpiryWindow,
  type AdminProjectRow,
  type AdminProjectView,
} from '@/lib/admin-overview'

/**
 * The /admin overview's arithmetic.
 *
 * Two properties matter more than any individual figure:
 *
 *  1. GRACE EXPIRY IS APPLIED AT READ TIME. There is no scheduler, so a row can
 *     sit at billingStatus 'grace' months past its deadline. Every number here
 *     has to treat that row as suspended, or the panel reports a site as
 *     healthy while the public gate is already refusing to serve it.
 *
 *  2. A ZERO IS NEVER AN ATTENTION ROW. The action list exists to be empty most
 *     days; a row that renders at count 0 is noise that teaches the owner to
 *     stop reading the section.
 *
 * Every assertion injects `now`. Nothing here reads the wall clock except the
 * two month/window helpers, which are asserted by relation rather than by
 * absolute value so they hold in any timezone.
 */

const NOW = new Date('2026-07-22T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const at = (offset: number) => new Date(NOW.getTime() + offset)

/** Monthly list prices, injected so these tests do not depend on the plan catalogue. */
const price = (plan: string) => (plan === 'professional' ? 29000 : plan === 'essential' ? 19000 : 0)

function project(over: Partial<AdminProjectRow> = {}): AdminProjectRow {
  return {
    id: 'p1',
    name: 'Sitio',
    slug: 'sitio',
    subdomain: null,
    status: 'published',
    plan: 'essential',
    hasPaid: true,
    billingStatus: 'active',
    graceUntil: null,
    suspendedReason: null,
    grantedBy: null,
    couponId: null,
    createdAt: NOW,
    ownerEmail: 'cliente@example.com',
    ...over,
  }
}

describe('daysUntil', () => {
  it('rounds up, so a deadline 25 hours out reads as 2 days', () => {
    expect(daysUntil(at(25 * 60 * 60 * 1000), NOW)).toBe(2)
  })

  it('is exact on a whole-day boundary', () => {
    expect(daysUntil(at(3 * DAY), NOW)).toBe(3)
  })

  it('never goes negative — an elapsed deadline is 0 days left, not -4', () => {
    expect(daysUntil(at(-4 * DAY), NOW)).toBe(0)
    expect(daysUntil(NOW, NOW)).toBe(0)
  })

  it('returns null when there is no deadline, rather than pretending it is today', () => {
    expect(daysUntil(null, NOW)).toBeNull()
    expect(daysUntil(undefined, NOW)).toBeNull()
  })

  it('returns null for an unparseable date instead of NaN days', () => {
    expect(daysUntil('not-a-date', NOW)).toBeNull()
  })

  it('accepts an ISO string, the shape a serialized row arrives in', () => {
    expect(daysUntil(at(2 * DAY).toISOString(), NOW)).toBe(2)
  })
})

describe('paidProvenance — how a project came to be paid', () => {
  it('is a sale when neither a gift nor a coupon is recorded', () => {
    expect(paidProvenance({})).toBe('sale')
  })

  it('is a gift when grantedBy is set', () => {
    expect(paidProvenance({ grantedBy: 'admin@example.com' })).toBe('gift')
  })

  it('is a coupon when a redemption is recorded', () => {
    expect(paidProvenance({ couponId: 'c1' })).toBe('coupon')
  })

  it('prefers the gift when both are set', () => {
    // grantedBy means "comped right now"; the coupon columns are a historical
    // fact that survives a revoked gift, so the live state wins.
    expect(paidProvenance({ grantedBy: 'admin@example.com', couponId: 'c1' })).toBe('gift')
  })
})

describe('summarizeProjects — live sites', () => {
  it('counts a published, paid, active project as live', () => {
    const s = summarizeProjects([project()], price, NOW)
    expect(s.live).toHaveLength(1)
  })

  it('keeps a site inside its grace window live — that is what grace is for', () => {
    const s = summarizeProjects(
      [project({ billingStatus: 'grace', graceUntil: at(2 * DAY) })],
      price,
      NOW
    )
    expect(s.live).toHaveLength(1)
    expect(s.grace).toHaveLength(1)
    expect(s.grace[0].graceDaysLeft).toBe(2)
  })

  it('drops a site whose grace window elapsed, even though the column still says grace', () => {
    // The exact row the missing scheduler leaves behind.
    const s = summarizeProjects(
      [project({ billingStatus: 'grace', graceUntil: at(-1 * DAY) })],
      price,
      NOW
    )
    expect(s.live).toHaveLength(0)
    expect(s.grace).toHaveLength(0)
    expect(s.suspendedForPayment).toHaveLength(1)
  })

  it('treats a grace row with no deadline as suspended, failing closed', () => {
    const s = summarizeProjects([project({ billingStatus: 'grace', graceUntil: null })], price, NOW)
    expect(s.suspendedForPayment).toHaveLength(1)
    expect(s.live).toHaveLength(0)
  })

  it('does not count an unpublished project as live', () => {
    const s = summarizeProjects([project({ status: 'draft' })], price, NOW)
    expect(s.live).toHaveLength(0)
  })

  it('splits live sites into paid and gifted', () => {
    const s = summarizeProjects(
      [
        project({ id: 'a' }),
        project({ id: 'b', grantedBy: 'admin@example.com' }),
        project({ id: 'c', couponId: 'c1' }),
      ],
      price,
      NOW
    )
    expect(s.live).toHaveLength(3)
    expect(s.liveGifted).toBe(1)
    // A coupon redemption is not a gift from the admin, so it counts on the
    // non-gifted side of the split even though it also generates no revenue.
    expect(s.livePaid).toBe(2)
  })
})

describe('summarizeProjects — MRR', () => {
  it('sums the monthly list price of active sales', () => {
    const s = summarizeProjects(
      [project({ id: 'a', plan: 'essential' }), project({ id: 'b', plan: 'professional' })],
      price,
      NOW
    )
    expect(s.mrr).toBe(19000 + 29000)
  })

  it('counts a gifted site as zero revenue', () => {
    const s = summarizeProjects([project({ grantedBy: 'admin@example.com' })], price, NOW)
    expect(s.mrr).toBe(0)
  })

  it('counts a coupon-redeemed site as zero revenue', () => {
    // Only 100%-discount coupons are accepted, so a redemption bills nothing.
    const s = summarizeProjects([project({ couponId: 'c1' })], price, NOW)
    expect(s.mrr).toBe(0)
  })

  it('excludes a site in grace — the charge already failed', () => {
    const s = summarizeProjects(
      [project({ billingStatus: 'grace', graceUntil: at(DAY) })],
      price,
      NOW
    )
    expect(s.mrr).toBe(0)
  })

  it('excludes a suspended site', () => {
    const s = summarizeProjects([project({ billingStatus: 'suspended' })], price, NOW)
    expect(s.mrr).toBe(0)
  })

  it('contributes nothing for an unknown plan instead of guessing a price', () => {
    const s = summarizeProjects([project({ plan: 'enterprise' })], price, NOW)
    expect(s.mrr).toBe(0)
  })

  it('still counts an active site the owner has not published', () => {
    // They are being billed whether or not the site is up, so the revenue is real.
    const s = summarizeProjects([project({ status: 'draft' })], price, NOW)
    expect(s.mrr).toBe(19000)
    expect(s.live).toHaveLength(0)
  })
})

describe('summarizeProjects — payment problems vs cancellations', () => {
  it('separates a deliberate cancellation from a failed charge', () => {
    const s = summarizeProjects(
      [
        project({ id: 'a', billingStatus: 'suspended', suspendedReason: 'cancelled' }),
        project({ id: 'b', billingStatus: 'suspended', suspendedReason: 'payment_failed' }),
      ],
      price,
      NOW
    )
    expect(s.cancelledProjects.map((p) => p.id)).toEqual(['a'])
    expect(s.suspendedForPayment.map((p) => p.id)).toEqual(['b'])
  })

  it('treats a suspension with no recorded reason as a payment failure', () => {
    // The elapsed-grace path: nothing wrote suspendedReason because nothing ran.
    const s = summarizeProjects(
      [project({ billingStatus: 'grace', graceUntil: at(-DAY), suspendedReason: null })],
      price,
      NOW
    )
    expect(s.suspendedForPayment).toHaveLength(1)
    expect(s.cancelledProjects).toHaveLength(0)
  })

  it('marks grace and payment-failed rows as paymentProblem, but not cancellations', () => {
    const s = summarizeProjects(
      [
        project({ id: 'a', billingStatus: 'grace', graceUntil: at(DAY) }),
        project({ id: 'b', billingStatus: 'suspended', suspendedReason: 'payment_failed' }),
        project({ id: 'c', billingStatus: 'suspended', suspendedReason: 'cancelled' }),
        project({ id: 'd' }),
      ],
      price,
      NOW
    )
    expect(s.rows.filter((r) => r.paymentProblem).map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('summarizeProjects — the cap', () => {
  it('reports capped when the read filled the limit, so the page can admit it', () => {
    const rows = [project({ id: 'a' }), project({ id: 'b' })]
    expect(summarizeProjects(rows, price, NOW, 2).capped).toBe(true)
  })

  it('is not capped below the limit', () => {
    expect(summarizeProjects([project()], price, NOW, 2).capped).toBe(false)
  })

  it('is not capped on an empty result', () => {
    expect(summarizeProjects([], price, NOW, 2).capped).toBe(false)
  })
})

describe('currentMonthRange', () => {
  it('is half-open and contains the instant it was built from', () => {
    const { start, end } = currentMonthRange(NOW)
    expect(start.getTime()).toBeLessThanOrEqual(NOW.getTime())
    expect(end.getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('starts on the first day of the month at midnight local time', () => {
    const { start } = currentMonthRange(NOW)
    expect(start.getDate()).toBe(1)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  it('ends on the first day of the next month, so no row can fall between months', () => {
    const { start, end } = currentMonthRange(NOW)
    expect(end.getDate()).toBe(1)
    const expectedMonth = (start.getMonth() + 1) % 12
    expect(end.getMonth()).toBe(expectedMonth)
  })

  it('rolls the year over in December', () => {
    const dec = new Date(2026, 11, 15, 10, 0, 0)
    const { start, end } = currentMonthRange(dec)
    expect(start.getFullYear()).toBe(2026)
    expect(end.getFullYear()).toBe(2027)
    expect(end.getMonth()).toBe(0)
  })
})

describe('trialExpiryWindow', () => {
  it('looks exactly seven days ahead', () => {
    const { start, end } = trialExpiryWindow(NOW)
    expect(end.getTime() - start.getTime()).toBe(TRIAL_EXPIRY_WINDOW_MS)
    expect(TRIAL_EXPIRY_WINDOW_MS).toBe(7 * DAY)
  })

  it('starts at now, so an already-elapsed deadline is outside it', () => {
    // An expired trial is not "expiring soon" — it already expired, and the read
    // paths downgrade it. Counting it would present the past as the future.
    const { start } = trialExpiryWindow(NOW)
    expect(start.getTime()).toBe(NOW.getTime())
  })
})

describe('buildAttentionItems — zeros never render', () => {
  it('returns nothing when nothing is wrong', () => {
    const items = buildAttentionItems({ suspendedForPayment: 0, grace: 0, unreadLeads: 0, purgeDue: 0 })
    expect(items).toEqual([])
    expect(isAllClear(items)).toBe(true)
  })

  it('emits only the conditions that are actually true', () => {
    const items = buildAttentionItems({ suspendedForPayment: 0, grace: 2, unreadLeads: 0, purgeDue: 1 })
    expect(items.map((i) => i.kind)).toEqual(['grace', 'purge_due'])
    expect(isAllClear(items)).toBe(false)
  })

  it('orders by irreversibility, not by count', () => {
    const items = buildAttentionItems({ suspendedForPayment: 1, grace: 99, unreadLeads: 50, purgeDue: 3 })
    expect(items.map((i) => i.kind)).toEqual(['suspended_payment', 'grace', 'unread_leads', 'purge_due'])
  })

  it('carries the count through untouched', () => {
    const items = buildAttentionItems({ suspendedForPayment: 4, grace: 0, unreadLeads: 0, purgeDue: 0 })
    expect(items).toEqual([{ kind: 'suspended_payment', count: 4 }])
  })

  it('ignores a negative count rather than rendering a nonsense row', () => {
    const items = buildAttentionItems({ suspendedForPayment: -1, grace: 0, unreadLeads: 0, purgeDue: 0 })
    expect(items).toEqual([])
  })
})

describe('buildCustomerRows', () => {
  const view = (id: string, createdAt: Date): AdminProjectView =>
    summarizeProjects([project({ id, createdAt })], price, NOW).rows[0]

  it('defaults a project with no leads to zero rather than dropping it', () => {
    const rows = buildCustomerRows([view('a', NOW)], new Map(), new Map())
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ leads: 0, unread: 0 })
  })

  it('puts unread leads first — that is somebody else’s money going cold', () => {
    const rows = buildCustomerRows(
      [view('a', NOW), view('b', NOW), view('c', NOW)],
      new Map([['a', 10], ['b', 1], ['c', 4]]),
      new Map([['b', 3]])
    )
    expect(rows.map((r) => r.project.id)).toEqual(['b', 'a', 'c'])
  })

  it('breaks ties on total leads, then on newest first', () => {
    const rows = buildCustomerRows(
      [view('old', at(-10 * DAY)), view('new', NOW), view('busy', at(-20 * DAY))],
      new Map([['busy', 7]]),
      new Map()
    )
    expect(rows.map((r) => r.project.id)).toEqual(['busy', 'new', 'old'])
  })

  it('is a total order, so pagination is stable across loads', () => {
    // Identical on every sort key except id.
    const rows = buildCustomerRows([view('b', NOW), view('a', NOW)], new Map(), new Map())
    expect(rows.map((r) => r.project.id)).toEqual(['a', 'b'])
  })
})

describe('clampOverviewPage — bounds the roster', () => {
  const size = ADMIN_OVERVIEW_PAGE_SIZE

  it('returns 0 when there is nothing to page through', () => {
    expect(clampOverviewPage('7', 0)).toBe(0)
  })

  it('allows a page that exists', () => {
    expect(clampOverviewPage('2', size * 3)).toBe(2)
  })

  it('clamps past the last populated page', () => {
    expect(clampOverviewPage('99', size * 3)).toBe(2)
    expect(clampOverviewPage('1e9', size * 2)).toBe(1)
  })

  it('collapses junk and negatives to the first page', () => {
    for (const junk of [null, undefined, 'abc', '-3', NaN, {}, ['2']]) {
      expect(clampOverviewPage(junk, size * 3)).toBe(0)
    }
  })

  it('floors a fractional page', () => {
    expect(clampOverviewPage('1.9', size * 3)).toBe(1)
  })
})

describe('overviewPageCount', () => {
  it('is always at least 1 so the UI can render "1 / 1"', () => {
    expect(overviewPageCount(0)).toBe(1)
  })

  it('rounds a partial page up', () => {
    expect(overviewPageCount(ADMIN_OVERVIEW_PAGE_SIZE + 1)).toBe(2)
  })

  it('does not add an empty page on an exact multiple', () => {
    expect(overviewPageCount(ADMIN_OVERVIEW_PAGE_SIZE * 2)).toBe(2)
  })
})

describe('pageSlice', () => {
  const rows = Array.from({ length: 7 }, (_, i) => i)

  it('returns the requested window', () => {
    expect(pageSlice(rows, 1, 3)).toEqual([3, 4, 5])
  })

  it('returns a short final page rather than padding it', () => {
    expect(pageSlice(rows, 2, 3)).toEqual([6])
  })

  it('returns nothing past the end instead of throwing', () => {
    expect(pageSlice(rows, 9, 3)).toEqual([])
  })
})
