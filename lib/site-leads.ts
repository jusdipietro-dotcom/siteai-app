/**
 * Shared vocabulary for the site-lead inbox.
 *
 * The `SiteLead.status` column and its three values already existed in
 * `prisma/schema.prisma` ("new, read, archived") but lived only in a comment, so
 * nothing could validate against them. Untrusted input reaches the status the
 * same way an untrusted plan id reaches the pricing math, so this module mirrors
 * `lib/website-plans.ts`: the id list is the source of truth and the type is
 * derived from it, so the two can never drift apart.
 *
 * No React, no Prisma, no Next.js imports — it is used from a route handler, a
 * server component and a client component alike.
 */

/** Source of truth for the valid lead statuses. Do NOT extend without a migration plan:
 *  rows already in the database carry these exact strings. */
export const SITE_LEAD_STATUSES = ['new', 'read', 'archived'] as const

export type SiteLeadStatus = (typeof SITE_LEAD_STATUSES)[number]

/**
 * Narrows an untrusted value (request body, query string) to a known status.
 *
 * Checks the list instead of indexing a lookup object, for the same reason
 * `isWebsitePlanId` does: a plain object resolves `['toString']` through
 * Object.prototype and returns a truthy function, which is enough to slip past
 * an `if (!found)` guard.
 */
export function isSiteLeadStatus(value: unknown): value is SiteLeadStatus {
  return typeof value === 'string' && SITE_LEAD_STATUSES.some((s) => s === value)
}

/**
 * Rows per page in the inbox.
 *
 * The inbox must never issue an unbounded `findMany`. A published site's contact
 * form is public and rate-limited only per IP, so the row count for one project
 * is attacker-influenced: an unbounded read would let a spam run turn the
 * owner's own dashboard into an out-of-memory error.
 */
export const SITE_LEADS_PAGE_SIZE = 25

/**
 * Clamps a client-supplied page number into a range that actually exists.
 *
 * Two separate jobs, both required:
 *  - reject junk (`NaN`, negatives, `?page=1e9`, arrays) so `skip` is always a
 *    safe integer;
 *  - clamp to the last page that holds data, so `skip` can never exceed the row
 *    count and a deep-offset scan cannot be requested for free.
 *
 * `total` of 0 yields page 0, which returns an empty list — the empty state.
 */
export function clampLeadsPage(raw: unknown, total: number, pageSize = SITE_LEADS_PAGE_SIZE): number {
  const requested = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : 0
  if (!Number.isFinite(requested) || requested < 0) return 0
  const lastPage = total > 0 ? Math.ceil(total / pageSize) - 1 : 0
  return Math.min(Math.floor(requested), lastPage)
}

/** Total number of pages for a row count. Always >= 1 so the UI can render "1 / 1". */
export function leadsPageCount(total: number, pageSize = SITE_LEADS_PAGE_SIZE): number {
  return total > 0 ? Math.ceil(total / pageSize) : 1
}

/**
 * The lead shape the owner's dashboard receives.
 *
 * `ipAddress` and `userAgent` are captured at submission for abuse triage and
 * are deliberately NOT in this type: they are the visitor's data, not the
 * owner's, and nothing in the inbox needs them to act on a lead. Keeping them
 * off the wire means a future XSS or a leaked session cannot exfiltrate them.
 */
export interface SiteLeadView {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string
  createdAt: string
}

export interface SiteLeadsResponse {
  leads: SiteLeadView[]
  page: number
  pageSize: number
  pageCount: number
  total: number
  /** Leads still in `new`, across every page — drives the "sin leer" badge. */
  unread: number
}
