/**
 * The arithmetic behind /admin — the owner's overview.
 *
 * Everything here is pure: plain rows in, derived facts out, `now` injected.
 * No Prisma, no React, no Next.js. The page does the I/O; this module decides
 * what the numbers mean, so the meanings are testable without a database.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE HONESTY RULE
 *
 * Every figure this module produces is derivable from a column that exists.
 * Three things a dashboard would like to show are deliberately ABSENT, and this
 * is the list, so nobody re-adds them by accident:
 *
 *   1. Visits over a period. `Project.views` is a single cumulative counter
 *      with no time dimension and no per-visit table anywhere in the schema.
 *      "Visitas 30 días" cannot be computed from it — not approximately,
 *      not at all. The only honest renderings are the all-time total or
 *      nothing, so the overview shows nothing and says why.
 *
 *   2. Cancellations of the twelve subscription products. Those rows carry
 *      `status: 'cancelled'` but no cancellation timestamp; `updatedAt` moves
 *      on any write, so it cannot date the cancellation. Only the website
 *      generator can be dated (`suspendedAt` + `suspendedReason: 'cancelled'`),
 *      so that — and only that — is what `cancellationsThisMonth` counts, and
 *      the label on the page says so.
 *
 *   3. Churn / retention rates. Both need a dated cancellation for every
 *      product. See (2).
 *
 * If a number cannot come from data that exists, it is left out and named as
 * missing. It is never approximated and never rendered as a zero, because a
 * zero reads as a measurement.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { effectiveBillingStatus, type BillingStatus } from './project-billing'

/**
 * Hard cap on the projects the overview reads in one page load.
 *
 * The same cap `/admin/negocio` already used. An unbounded findMany on a
 * growing table is a latent outage, and a capped read that ADMITS it is capped
 * beats an uncapped one that eventually times out. `capped` is surfaced on the
 * page: past this many paying projects the aggregates undercount, and the owner
 * is told rather than quietly misled.
 */
export const ADMIN_OVERVIEW_PROJECT_CAP = 500

/** Customer rows per page in the roster. */
export const ADMIN_OVERVIEW_PAGE_SIZE = 25

/** How far ahead the "trials expiring soon" figure looks. */
export const TRIAL_EXPIRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The scalar columns the overview needs from a `Project`.
 *
 * Deliberately narrow: `businessData` and `sections` are the customer's entire
 * site content and are never read here. Nothing in this shape is a secret —
 * no `preapprovalId`, no tokens.
 */
export interface AdminProjectRow {
  id: string
  name: string
  slug: string
  subdomain: string | null
  status: string
  plan: string
  hasPaid: boolean
  billingStatus?: string | null
  graceUntil?: Date | string | null
  suspendedReason?: string | null
  grantedBy?: string | null
  couponId?: string | null
  createdAt: Date | string
  ownerEmail: string
}

/** How a project came to be paid. Mirrors the three-way split documented on the model. */
export type PaidProvenance = 'sale' | 'gift' | 'coupon'

/** A project plus everything derived from it, computed once and reused. */
export interface AdminProjectView extends AdminProjectRow {
  /** Grace expiry applied at read time — never the raw column. */
  effective: BillingStatus
  provenance: PaidProvenance
  /** Whole days until the grace deadline; 0 once elapsed. Null when not in grace. */
  graceDaysLeft: number | null
  /** Live to the public: published + paid + (active or still inside grace). */
  live: boolean
  /** Down because a charge failed, as opposed to a deliberate cancellation. */
  paymentProblem: boolean
  /** Down because the owner cancelled. Not a problem to chase. */
  cancelled: boolean
}

export interface ProjectsSummary {
  rows: AdminProjectView[]
  /** True when the read hit ADMIN_OVERVIEW_PROJECT_CAP and the totals undercount. */
  capped: boolean
  /** Published, paid and serving right now. */
  live: AdminProjectView[]
  /** Of `live`, the ones actually generating revenue. */
  livePaid: number
  /** Of `live`, the ones an admin comped. They contribute 0 to MRR by definition. */
  liveGifted: number
  /**
   * Monthly recurring revenue, ESTIMATED.
   *
   * Monthly list price summed over projects that are paid and billing-active.
   * Gifted projects contribute 0 — they generate no revenue. It is an estimate
   * for one reason that cannot be fixed from the schema: `Project` stores no
   * billing cadence, so an annual subscriber (who pays the lower `annual`
   * monthly-equivalent) is counted at the `monthly` list price. That biases
   * MRR UP. Coupon redemptions are 100%-discount-only and mark the project paid
   * without a MercadoPago subscription, so they are excluded too.
   */
  mrr: number
  /** In grace: a charge failed, the site is still up, the clock is running. */
  grace: AdminProjectView[]
  /** Down because a charge failed and the window elapsed. */
  suspendedForPayment: AdminProjectView[]
  /** Down because the owner asked. Counted separately — nothing to chase here. */
  cancelledProjects: AdminProjectView[]
}

/** Plan id -> monthly list price. Injected so this module stays free of the plan catalogue. */
export type MonthlyPriceLookup = (planId: string) => number

/** Whole days from `now` until `deadline`, rounded up. Never negative. */
export function daysUntil(deadline: Date | string | null | undefined, now: Date): number | null {
  if (!deadline) return null
  const ms = new Date(deadline).getTime() - now.getTime()
  if (!Number.isFinite(ms)) return null
  return ms <= 0 ? 0 : Math.ceil(ms / (24 * 60 * 60 * 1000))
}

/**
 * Why this project is paid: a real sale, an admin gift, or a redeemed coupon.
 *
 * Gift wins over coupon when both columns are set, because `grantedBy` means
 * "comped RIGHT NOW" while `couponRedeemedAt`/`couponId` is a historical fact
 * that survives a revoked gift (see the schema comment on Project.couponId).
 */
export function paidProvenance(row: {
  grantedBy?: string | null
  couponId?: string | null
}): PaidProvenance {
  if (row.grantedBy) return 'gift'
  if (row.couponId) return 'coupon'
  return 'sale'
}

/**
 * Everything the overview and /admin/negocio both need, computed once.
 *
 * Both pages call this so the two can never print different numbers for the
 * same fact. Grace expiry is applied in JS rather than in a WHERE clause
 * because it is derived at read time from `graceUntil` — the stored
 * `billingStatus` column can be stale, and there is no scheduler to fix it.
 */
export function summarizeProjects(
  rows: readonly AdminProjectRow[],
  monthlyPrice: MonthlyPriceLookup,
  now: Date = new Date(),
  cap: number = ADMIN_OVERVIEW_PROJECT_CAP
): ProjectsSummary {
  const views: AdminProjectView[] = rows.map((r) => {
    const effective = effectiveBillingStatus(r, now)
    const cancelled = effective === 'suspended' && r.suspendedReason === 'cancelled'
    return {
      ...r,
      effective,
      provenance: paidProvenance(r),
      graceDaysLeft: effective === 'grace' ? daysUntil(r.graceUntil, now) : null,
      live: r.status === 'published' && r.hasPaid && (effective === 'active' || effective === 'grace'),
      // A suspension with no reason recorded is a payment failure: that is the
      // path where the batch job never ran and only `graceUntil` elapsing took
      // the site down. Only an explicit 'cancelled' means the owner asked.
      paymentProblem: effective === 'grace' || (effective === 'suspended' && !cancelled),
      cancelled,
    }
  })

  const live = views.filter((v) => v.live)

  return {
    rows: views,
    capped: rows.length >= cap,
    live,
    livePaid: live.filter((v) => v.provenance !== 'gift').length,
    liveGifted: live.filter((v) => v.provenance === 'gift').length,
    mrr: views.reduce((sum, v) => {
      if (!v.hasPaid || v.effective !== 'active') return sum
      if (v.provenance !== 'sale') return sum
      return sum + monthlyPrice(v.plan)
    }, 0),
    grace: views.filter((v) => v.effective === 'grace'),
    suspendedForPayment: views.filter((v) => v.effective === 'suspended' && !v.cancelled),
    cancelledProjects: views.filter((v) => v.cancelled),
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * "This month"
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DateRange {
  start: Date
  end: Date
}

/**
 * The calendar month containing `now`, as a half-open [start, end) range.
 *
 * Local time, not UTC: "this month" is the owner's month, and the server is
 * configured to their timezone. Half-open so a row created at 23:59:59.999 on
 * the last day belongs to this month and one at 00:00:00.000 on the first of
 * the next does not — no row can land in both, and none can fall between.
 */
export function currentMonthRange(now: Date = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  return { start, end }
}

/**
 * The window "expiring soon" means, as a half-open (now, now + 7 days] range.
 *
 * Exclusive at the near end on purpose: a trial whose deadline has already
 * passed is not "expiring soon", it is expired, and the read paths already
 * downgrade it (see effectiveSubscriptionStatus in lib/trial.ts). Counting it
 * here would present an expiry that already happened as an upcoming one.
 */
export function trialExpiryWindow(now: Date = new Date()): DateRange {
  return { start: now, end: new Date(now.getTime() + TRIAL_EXPIRY_WINDOW_MS) }
}

/* ────────────────────────────────────────────────────────────────────────────
 * "What needs action"
 * ──────────────────────────────────────────────────────────────────────────── */

export type AttentionKind =
  | 'suspended_payment'
  | 'grace'
  | 'unread_leads'
  | 'purge_due'

export interface AttentionItem {
  kind: AttentionKind
  count: number
}

export interface AttentionInput {
  suspendedForPayment: number
  grace: number
  unreadLeads: number
  purgeDue: number
}

/**
 * The action list, in the order the owner should work it.
 *
 * A zero NEVER produces a row. That is the whole design: a panel of cards
 * reading "0 suspended / 0 in grace / 0 unread" is indistinguishable at a
 * glance from one that has not loaded, and it trains the owner to stop looking.
 * An empty list is the signal that nothing is wrong, and the page renders one
 * calm line instead.
 *
 * Order is by irreversibility, not by count: a suspended site is already
 * off the air, a grace site is about to be, unread leads are the customer's
 * money going cold, and a purge is a deadline we promised in writing.
 */
export function buildAttentionItems(input: AttentionInput): AttentionItem[] {
  const ordered: AttentionItem[] = [
    { kind: 'suspended_payment', count: input.suspendedForPayment },
    { kind: 'grace', count: input.grace },
    { kind: 'unread_leads', count: input.unreadLeads },
    { kind: 'purge_due', count: input.purgeDue },
  ]
  return ordered.filter((i) => i.count > 0)
}

/** Is everything in order? Convenience for the calm state. */
export function isAllClear(items: readonly AttentionItem[]): boolean {
  return items.length === 0
}

/* ────────────────────────────────────────────────────────────────────────────
 * The customer roster
 * ──────────────────────────────────────────────────────────────────────────── */

export interface CustomerRow {
  project: AdminProjectView
  leads: number
  unread: number
}

/**
 * One row per paying customer, ordered so the ones that need something come first.
 *
 * Unread leads lead the sort because they are the only entry in the list that
 * is somebody else's money going cold — a suspended site is already surfaced at
 * the top of the page, an unanswered lead is not. Ties break on total leads,
 * then newest first, then id, so the order is total and the pagination is
 * stable across page loads.
 */
export function buildCustomerRows(
  rows: readonly AdminProjectView[],
  leadsByProject: ReadonlyMap<string, number>,
  unreadByProject: ReadonlyMap<string, number>
): CustomerRow[] {
  return rows
    .map((project) => ({
      project,
      leads: leadsByProject.get(project.id) ?? 0,
      unread: unreadByProject.get(project.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.unread !== a.unread) return b.unread - a.unread
      if (b.leads !== a.leads) return b.leads - a.leads
      const at = new Date(a.project.createdAt).getTime()
      const bt = new Date(b.project.createdAt).getTime()
      if (bt !== at) return bt - at
      return a.project.id.localeCompare(b.project.id)
    })
}

/**
 * Clamps a client-supplied page number into a range that actually exists.
 *
 * Same contract as clampLeadsPage in lib/site-leads.ts, for the same reason:
 * `?page=1e9` must not become an offset. Junk and negatives collapse to 0, and
 * anything past the last populated page clamps to it.
 */
export function clampOverviewPage(
  raw: unknown,
  total: number,
  pageSize = ADMIN_OVERVIEW_PAGE_SIZE
): number {
  const requested = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : 0
  if (!Number.isFinite(requested) || requested < 0) return 0
  const lastPage = total > 0 ? Math.ceil(total / pageSize) - 1 : 0
  return Math.min(Math.floor(requested), lastPage)
}

/** Total pages for a row count. Always >= 1 so the UI can render "1 / 1". */
export function overviewPageCount(total: number, pageSize = ADMIN_OVERVIEW_PAGE_SIZE): number {
  return total > 0 ? Math.ceil(total / pageSize) : 1
}

/** The slice of rows for a (already clamped) page. */
export function pageSlice<T>(rows: readonly T[], page: number, pageSize = ADMIN_OVERVIEW_PAGE_SIZE): T[] {
  const start = page * pageSize
  return rows.slice(start, start + pageSize)
}
