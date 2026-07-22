/**
 * Account deletion — the mechanism behind the promise in app/privacy/page.tsx:
 * "Si eliminás tu cuenta, tus datos personales serán eliminados en un plazo de
 * 30 días, excepto aquellos que debamos conservar por obligaciones legales."
 *
 * That sentence contains BOTH halves of the design, and the second half is the
 * one that is easy to miss: personal data goes, legally-required records stay.
 * Hard-deleting the User row would satisfy the first half and violate the
 * second — every Project and *Subscription row cascades off User.id, so a
 * `DELETE FROM "User"` destroys the entire financial trail of a paying
 * customer. In Argentina that trail is what an accountant needs. So:
 *
 *   DELETED     rows that are pure personal data with no financial meaning.
 *   ANONYMISED  rows that carry BOTH identity and money. Identity is severed
 *               in place; the money columns survive.
 *   RETAINED    the anonymised billing trail: amounts (via plan), dates,
 *               preapproval ids, coupon ids.
 *
 * See PURGE_PLAN below for the exact, per-model, reviewable list. That constant
 * is not documentation-next-to-code — it IS the code, so the list an accountant
 * signs off on cannot drift from what actually runs.
 *
 * TWO PHASES, matching the policy's "within 30 days" language:
 *
 *   ON REQUEST (immediate, app/api/account/delete)
 *     Cancel every live MercadoPago preapproval, take every published site
 *     offline, cancel every subscription locally, revoke password-reset tokens,
 *     and stamp deletionRequestedAt. The account is unusable from that moment.
 *
 *   PURGE (after 30 days, folded into POST /api/admin/expire-trials)
 *     Delete/anonymise per PURGE_PLAN and stamp deletedAt.
 *
 * BILLING IS CANCELLED FIRST, AND IT IS A HARD GATE. A deleted account whose
 * preapprovals are still live means we keep charging somebody who left. If ANY
 * cancellation fails the deletion does not proceed — see requestAccountDeletion
 * in app/api/account/delete/route.ts.
 *
 * Every time-dependent function takes an injected `now`, and every function
 * that touches the database takes an injected delegate, so all of this is
 * testable without a database and without the wall clock (tests/account-*).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The retention window promised by the privacy policy.
 *
 * Changing this only affects deletions requested AFTER the change: the deadline
 * is computed once and stored in User.deletionScheduledFor, precisely so that
 * shortening the window cannot purge somebody early and lengthening it cannot
 * silently extend a promise already made.
 */
export const DELETION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/** The instant a deletion requested at `from` becomes eligible for purge. */
export function getPurgeDueDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + DELETION_WINDOW_MS)
}

/** The three states an account can be in, as far as deletion is concerned. */
export type AccountDeletionState = 'active' | 'pending_deletion' | 'purged'

export interface DeletionColumns {
  deletionRequestedAt?: Date | string | null
  deletionScheduledFor?: Date | string | null
  deletedAt?: Date | string | null
}

/**
 * Which of the three states a user row is in.
 *
 * `purged` wins over `pending_deletion`: a purged row always has both stamps,
 * and the interesting fact about it is that the data is already gone.
 */
export function accountDeletionState(user: DeletionColumns): AccountDeletionState {
  if (user.deletedAt) return 'purged'
  if (user.deletionRequestedAt) return 'pending_deletion'
  return 'active'
}

/**
 * May this account still be used?
 *
 * Deliberately keyed on `deletionRequestedAt` alone and NOT on the 30-day
 * deadline. The window is how long we keep the data before destroying it, not
 * how long the customer keeps access — an account that is still usable during
 * those 30 days would keep accruing the very data we promised to delete, and
 * would keep serving sites whose billing we already cancelled.
 *
 * Fails CLOSED by construction: any non-null stamp blocks.
 */
export function isAccountAccessBlocked(user: DeletionColumns): boolean {
  return accountDeletionState(user) !== 'active'
}

/** Is this account past its purge deadline and not yet purged? */
export function isPurgeDue(user: DeletionColumns, now: Date = new Date()): boolean {
  if (user.deletedAt) return false
  if (!user.deletionScheduledFor) return false
  return new Date(user.deletionScheduledFor) <= now
}

/* ────────────────────────────────────────────────────────────────────────────
 * Two-step confirmation
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Does the typed confirmation match the account being deleted?
 *
 * Case- and whitespace-insensitive because the user is retyping their own
 * address from memory, not proving knowledge of a secret — the session already
 * proved who they are. The point of the phrase is deliberateness: it makes an
 * accidental double-click, a stray Enter, or a replayed request impossible.
 *
 * Fails closed on any missing side.
 */
export function confirmationMatches(
  typed: unknown,
  accountEmail: string | null | undefined
): boolean {
  if (typeof typed !== 'string' || !accountEmail) return false
  const a = typed.trim().toLowerCase()
  const b = accountEmail.trim().toLowerCase()
  if (!a || !b) return false
  return a === b
}

/* ────────────────────────────────────────────────────────────────────────────
 * Billing: what has to be cancelled before anything is deleted
 * ──────────────────────────────────────────────────────────────────────────── */

/** One live MercadoPago subscription that must be cancelled before deletion. */
export interface LivePreapproval {
  /** Product label, for logs and for the itemised failure report. */
  readonly product: string
  /** Prisma delegate key, so the caller can write the local status back. */
  readonly delegate: string
  /** Row id within that model. */
  readonly rowId: string
  /** The MercadoPago preapproval id to cancel. */
  readonly preapprovalId: string
}

/**
 * Subscription statuses that mean "there is nothing left to cancel".
 *
 * `pending_payment` is deliberately NOT here: a preapproval id can already
 * exist while the `authorized` webhook is still in flight, and that is exactly
 * the subscription that would keep charging a departed customer.
 */
const SETTLED_SUBSCRIPTION_STATUSES = new Set(['cancelled', 'suspended'])

/** Does this subscription row still have billing that needs stopping? */
export function subscriptionNeedsCancellation(row: {
  status?: string | null
  preapprovalId?: string | null
}): boolean {
  if (!row.preapprovalId) return false
  return !SETTLED_SUBSCRIPTION_STATUSES.has(row.status ?? '')
}

/**
 * Same question for a generated site, which models billing differently.
 *
 * A Project has no `status: 'cancelled'` — it carries billingStatus +
 * suspendedReason (see lib/project-billing.ts). Only the deliberate
 * `suspended`/`cancelled` pair means MercadoPago was already told; a project
 * suspended for `payment_failed` may still have a live preapproval retrying.
 */
export function projectNeedsCancellation(row: {
  preapprovalId?: string | null
  billingStatus?: string | null
  suspendedReason?: string | null
}): boolean {
  if (!row.preapprovalId) return false
  return !(row.billingStatus === 'suspended' && row.suspendedReason === 'cancelled')
}

/** Result of one cancellation attempt. */
export interface CancellationOutcome {
  readonly product: string
  readonly rowId: string
  readonly preapprovalId: string
  readonly ok: boolean
  /** Present only on failure — a short, non-sensitive reason for the report. */
  readonly reason?: string
}

/**
 * Is it safe to proceed with the deletion?
 *
 * The rule the whole feature hangs on: EVERY live preapproval must be confirmed
 * cancelled. One unconfirmed cancellation means one person still being charged
 * for an account that no longer exists, which is strictly worse than a deletion
 * that failed loudly and can be retried.
 */
export function allCancellationsSucceeded(outcomes: readonly CancellationOutcome[]): boolean {
  return outcomes.every((o) => o.ok)
}

/* ────────────────────────────────────────────────────────────────────────────
 * The purge plan
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * What happens to one model when an account is purged.
 *
 *   delete     the whole row goes. Only for rows that are pure personal data
 *              with no financial meaning.
 *   anonymise  the row survives with its identity columns cleared, because it
 *              also carries billing facts we must keep.
 */
export type PurgeAction = 'delete' | 'anonymise'

export interface PurgeSpec {
  /** Prisma delegate key on PrismaClient. */
  readonly delegate: string
  /** Human label, used in logs and in the operator-facing counts. */
  readonly label: string
  readonly action: PurgeAction
  /**
   * Non-nullable String columns holding personal data → set to ''.
   * (Prisma rejects null on a required column, so these cannot be nulled.)
   */
  readonly blank?: readonly string[]
  /** Nullable columns holding personal data → set to null. */
  readonly nulls?: readonly string[]
  /**
   * Columns under a UNIQUE constraint that must nonetheless be freed for
   * reuse, and so need a per-row placeholder derived from the row id rather
   * than a shared constant. Anything listed here forces a per-row UPDATE.
   */
  readonly uniquePlaceholders?: readonly string[]
  /**
   * Why this row is kept at all. Present on every `anonymise` spec — this is
   * the list the owner has to confirm with an accountant, so it lives beside
   * the code that enforces it.
   */
  readonly retains?: string
}

/**
 * The 12 subscription products, and the personal data each one holds.
 *
 * ALL TWELVE ARE ANONYMISED, NEVER DELETED. Each row is the record of a
 * recurring commercial relationship: which plan, at what discount, paid through
 * which MercadoPago preapproval, over which dates. That is a financial record.
 * What is stripped is everything that says *who* — and, critically, the
 * encrypted credential blobs, which are secrets we have no business holding one
 * second past the relationship.
 */
export const SUBSCRIPTION_PURGE_SPECS: readonly PurgeSpec[] = [
  {
    delegate: 'monitoringSubscription',
    label: 'MonitoringSubscription',
    action: 'anonymise',
    // credentialUser/Pass + IV + tag are the customer's JUDICIAL PORTAL login,
    // encrypted at rest. Destroyed outright — an encrypted secret is still a
    // secret, and the key that opens it lives in the same deployment.
    blank: [
      'cuil',
      'credentialUser',
      'credentialPass',
      'credentialIv',
      'credentialTag',
      'notificationEmail',
      'payerEmail',
    ],
    retains: 'status, plan, portal, preapprovalId, couponId, discountApplied, trial/provision dates, n8nTenantId, createdAt',
  },
  {
    delegate: 'reviewsSubscription',
    label: 'ReviewsSubscription',
    action: 'anonymise',
    blank: [
      'businessName',
      'businessType',
      'searchUrl',
      'googleEmail',
      'notificationEmail',
      'payerEmail',
    ],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, n8nTenantId',
  },
  {
    delegate: 'linkedInSubscription',
    label: 'LinkedInSubscription',
    action: 'anonymise',
    blank: ['industry', 'audience', 'notificationEmail', 'payerEmail'],
    nulls: ['linkedinName', 'linkedinHeadline', 'telegramChatId'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, postsGenerated/Published counters',
  },
  {
    delegate: 'tradingSubscription',
    label: 'TradingSubscription',
    action: 'anonymise',
    blank: ['notificationEmail', 'payerEmail'],
    nulls: ['telegramChatId'],
    retains: 'status, plan, symbols, timeframe, preapprovalId, couponId, discountApplied, dates, signalsSent',
  },
  {
    delegate: 'leadsSubscription',
    label: 'LeadsSubscription',
    action: 'anonymise',
    blank: ['nichesList', 'citiesList', 'notificationEmail', 'payerEmail'],
    nulls: ['googleSheetUrl', 'n8nWorkflowId'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, leadsGenerated',
  },
  {
    delegate: 'emailMarketingSubscription',
    label: 'EmailMarketingSubscription',
    action: 'anonymise',
    blank: ['businessName', 'senderName', 'senderEmail', 'notificationEmail', 'payerEmail'],
    // googleSheetId points at a sheet full of the customer's own contact list —
    // third parties again. The sheet is not ours to delete, but the pointer is.
    nulls: ['googleSheetId', 'contactsUploadedAt'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, contactCount, n8nWorkflowId',
  },
  {
    delegate: 'prospeccionSubscription',
    label: 'ProspeccionSubscription',
    action: 'anonymise',
    blank: [
      'businessName',
      'senderName',
      'senderEmail',
      'website',
      'nichesList',
      'citiesList',
      'serviciosDesc',
      'notificationEmail',
      'payerEmail',
    ],
    nulls: ['googleSheetId'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, n8n workflow ids',
  },
  {
    delegate: 'facturacionSubscription',
    label: 'FacturacionSubscription',
    action: 'anonymise',
    // cuit + razonSocial identify the CUSTOMER'S OWN taxpayer, not ours. They
    // are provisioning config for the invoices that customer issues — those
    // invoices live in ARCA and in the Flask backend, not in this table. Our
    // own fiscal record of THEM is preapprovalId + plan + dates, which stays.
    // FLAGGED FOR THE ACCOUNTANT: if local law requires us to keep the payer's
    // CUIT, move 'cuit' and 'razonSocial' out of this list.
    blank: ['cuit', 'razonSocial', 'notificationEmail', 'payerEmail'],
    nulls: ['flaskUserEmail'],
    retains: 'status, plan, puntoVenta, condicionIva, preapprovalId, couponId, discountApplied, dates, flaskTenantId',
  },
  {
    delegate: 'causasSubscription',
    label: 'CausasSubscription',
    action: 'anonymise',
    // mevUser/mevPass + IV + tag: the customer's MEV/SCBA judicial credentials.
    // Same reasoning as MonitoringSubscription — destroyed, not retained.
    blank: [
      'mevUser',
      'mevPass',
      'mevIv',
      'mevTag',
      'dptoId',
      'dptoNombre',
      'notificationEmail',
      'payerEmail',
    ],
    nulls: ['lastScrapeAt'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, scraperTenantId',
  },
  {
    delegate: 'turnosSubscription',
    label: 'TurnosSubscription',
    action: 'anonymise',
    blank: [
      'businessName',
      'businessType',
      'scheduleDays',
      'scheduleSlots',
      'practiceAreas',
      'holidays',
      'notificationEmail',
      'payerEmail',
      'phone',
      'address',
    ],
    nulls: ['logoUrl', 'n8nWorkflowId', 'googleCalendarId', 'googleSheetId'],
    // `slug` is the PUBLIC booking URL (/turnos/{slug}) and is UNIQUE. Left
    // as-is it would keep the departed business's name addressable forever and
    // block anyone else from ever claiming it.
    uniquePlaceholders: ['slug'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates',
  },
  {
    delegate: 'suiteJuridicaSubscription',
    label: 'SuiteJuridicaSubscription',
    action: 'anonymise',
    blank: ['payerEmail'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, the 4 child subscription ids',
  },
  {
    delegate: 'lexPostSubscription',
    label: 'LexPostSubscription',
    action: 'anonymise',
    blank: ['notificationEmail', 'payerEmail'],
    nulls: ['igUsername', 'lexpostUserEmail'],
    retains: 'status, plan, preapprovalId, couponId, discountApplied, dates, lexpostTenantId, publication counters',
  },
] as const

/**
 * Everything else the purge touches, in the order it must run.
 *
 * ORDER IS LOAD-BEARING in exactly one place: `inquiry` matches on the account
 * email, so it MUST run before `user`, which is what erases that email.
 */
export const PURGE_PLAN: readonly PurgeSpec[] = [
  {
    delegate: 'passwordResetToken',
    label: 'PasswordResetToken',
    action: 'delete',
  },
  {
    delegate: 'media',
    label: 'Media',
    action: 'delete',
  },
  {
    // Leads captured on the customer's PUBLISHED SITES. See the long note on
    // deleteThirdPartyData() below — these belong to the site's visitors, not
    // to the account holder, and we hold them only as a processor.
    delegate: 'siteLead',
    label: 'SiteLead',
    action: 'delete',
  },
  {
    // Scraped judicial case files: caratula, expediente number, movements.
    // Third-party litigation data about the customer's CLIENTS. No financial
    // meaning whatsoever.
    delegate: 'causasCase',
    label: 'CausasCase',
    action: 'delete',
  },
  ...SUBSCRIPTION_PURGE_SPECS,
  {
    delegate: 'project',
    label: 'Project',
    action: 'anonymise',
    // businessData/sections are the site's entire content: business name,
    // address, phone, staff, photos. All of it personal or business-identifying.
    blank: ['name', 'businessData', 'sections', 'mediaIds'],
    nulls: ['template', 'thumbnail', 'publishedUrl', 'coverImageId', 'subdomain'],
    // `slug` is required and addressable; `subdomain` is UNIQUE and must be
    // freed so the next customer can claim it (it is nulled above, which frees
    // it — PostgreSQL unique indexes permit many NULLs).
    uniquePlaceholders: ['slug'],
    retains:
      'plan, hasPaid, preapprovalId, billingStatus, suspendedAt/Reason, couponId, couponRedeemedAt, grantedBy/At, views, createdAt',
  },
  {
    // The agency's OWN sales funnel. No foreign key to User — see
    // buildInquiryAnonymisation() for why it is matched on email instead.
    delegate: 'inquiry',
    label: 'Inquiry',
    action: 'anonymise',
    blank: ['name', 'email', 'message'],
    nulls: ['phone', 'company', 'website', 'ipAddress', 'userAgent'],
    retains: 'service, packageId, budget, source, status, createdAt (anonymous funnel statistics)',
  },
  {
    delegate: 'user',
    label: 'User',
    action: 'anonymise',
    nulls: ['name', 'password', 'image', 'freeAccountNote'],
    // `email` is UNIQUE and gets a per-row tombstone rather than '' — see
    // tombstoneEmail(). Blanking it would collide the moment a second account
    // is purged.
    uniquePlaceholders: ['email'],
    retains: 'id (the FK anchor for the whole billing trail), plan, isFreeAccount, createdAt, the three deletion timestamps',
  },
] as const

/**
 * A non-routable placeholder for a UNIQUE column that must be freed.
 *
 * `.invalid` is reserved by RFC 2606 and can never resolve, so a tombstone can
 * never be mailed even by accident. Derived from the row id so it is unique by
 * construction — two accounts purged in the same sweep cannot collide — and so
 * an operator staring at a tombstone can still tell which row it was.
 */
export function tombstoneValue(field: string, rowId: string): string {
  return field === 'email' ? `deleted-${rowId}@deleted.invalid` : `deleted-${rowId}`
}

/**
 * The `data` payload that anonymises one row under a given spec.
 *
 * Pure, and returns a plain object, so a test can assert the exact shape
 * without a database — which is the only practical way to review that a
 * destructive statement clears what it claims to clear.
 */
export function buildAnonymisation(spec: PurgeSpec, rowId: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of spec.blank ?? []) data[field] = ''
  for (const field of spec.nulls ?? []) data[field] = null
  for (const field of spec.uniquePlaceholders ?? []) data[field] = tombstoneValue(field, rowId)
  return data
}

/* ────────────────────────────────────────────────────────────────────────────
 * Executing the purge
 * ──────────────────────────────────────────────────────────────────────────── */

/** The subset of a Prisma model delegate the purge actually uses. */
export interface PurgeDelegate {
  findMany?: (args: any) => Promise<any[]>
  updateMany?: (args: any) => Promise<{ count: number }>
  update?: (args: any) => Promise<any>
  deleteMany?: (args: any) => Promise<{ count: number }>
}

/** Just enough of PrismaClient to run a purge — an object of delegates. */
export type PurgeClient = Record<string, PurgeDelegate>

/** What one purge did: the DB tally, plus the files the caller must unlink. */
export interface PurgeResult {
  readonly counts: PurgeCounts
  readonly uploadFilenames: readonly string[]
}

/**
 * How each model is reached from a user id.
 *
 * Three shapes, because the graph is three levels deep:
 *   direct    the model has its own `userId` column;
 *   viaParent the model hangs off a parent that has one (SiteLead → Project,
 *             CausasCase → CausasSubscription);
 *   self      the User row itself.
 *
 * Getting this wrong is the failure mode the whole exercise is about: a missed
 * relation is either a foreign-key error at delete time or personal data left
 * behind that the policy says was deleted.
 */
const SCOPE_BY_DELEGATE: Record<string, (userId: string) => Record<string, unknown>> = {
  user: (userId) => ({ id: userId }),
  siteLead: (userId) => ({ project: { userId } }),
  causasCase: (userId) => ({ subscription: { userId } }),
}

function scopeFor(delegate: string, userId: string): Record<string, unknown> {
  const special = SCOPE_BY_DELEGATE[delegate]
  return special ? special(userId) : { userId }
}

/** Per-model tally of what a purge actually touched. */
export type PurgeCounts = Record<string, number>

/**
 * Turns a stored Media.url into the filename on disk, or null.
 *
 * Deleting the Media ROW is not enough. `GET /api/uploads/[filename]` reads
 * straight off the filesystem and is PUBLIC and UNAUTHENTICATED — it never
 * consults the database. So a purge that only drops the row leaves every photo
 * the customer ever uploaded permanently fetchable by anyone holding the URL,
 * which is not "deleted" by any reading of the policy.
 *
 * Returns only the basename, and refuses anything containing a path separator
 * or `..`, so a poisoned `url` column can never make the caller unlink outside
 * the uploads directory.
 */
export function uploadFilenameFromUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const match = url.match(/^\/api\/uploads\/([^/?#]+)$/)
  if (!match) return null
  const filename = match[1]
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null
  }
  return filename
}

/**
 * Runs one spec against one account. Returns the number of rows affected.
 *
 * `anonymise` uses a single updateMany when it can, and falls back to a per-row
 * update loop only when the spec needs a value derived from the row id (a
 * UNIQUE column). That fallback is why this reads the ids first.
 */
async function applySpec(
  client: PurgeClient,
  spec: PurgeSpec,
  userId: string
): Promise<number> {
  const delegate = client[spec.delegate]
  if (!delegate) {
    throw new Error(`[account-deletion] unknown Prisma delegate '${spec.delegate}'`)
  }
  const where = scopeFor(spec.delegate, userId)

  if (spec.action === 'delete') {
    const { count } = await delegate.deleteMany!({ where })
    return count
  }

  if (!spec.uniquePlaceholders?.length) {
    const { count } = await delegate.updateMany!({
      where,
      data: buildAnonymisation(spec, ''),
    })
    return count
  }

  const rows = await delegate.findMany!({ where, select: { id: true } })
  for (const row of rows) {
    await delegate.update!({
      where: { id: row.id },
      data: buildAnonymisation(spec, row.id),
    })
  }
  return rows.length
}

/**
 * Anonymises the agency's own sales enquiries left by this person.
 *
 * `Inquiry` has NO foreign key to `User` — it is the public contact form, open
 * to anyone. So the only link back to a departing account holder is the email
 * they typed, and matching on it is the difference between honouring the policy
 * and leaving their name, phone, IP and message sitting in the CRM forever.
 *
 * Exact, case-insensitive match only. Deliberately never a fuzzy or domain
 * match: over-matching here would erase a live sales conversation with somebody
 * else entirely.
 *
 * FLAGGED FOR REVIEW: an enquiry is arguably a commercial record of its own.
 * It is anonymised rather than deleted so the funnel statistics (which service,
 * which package, what budget band, won/lost) survive without the person.
 */
async function anonymiseInquiries(
  client: PurgeClient,
  spec: PurgeSpec,
  email: string | null | undefined
): Promise<number> {
  if (!email) return 0
  const delegate = client[spec.delegate]
  if (!delegate) return 0
  const { count } = await delegate.updateMany!({
    where: { email: { equals: email, mode: 'insensitive' } },
    data: buildAnonymisation(spec, ''),
  })
  return count
}

/**
 * Executes the full purge for one account.
 *
 * Takes a client rather than importing `prisma`, so the caller decides whether
 * it runs inside a transaction (it does — see runScheduledPurges) and so tests
 * can pass fakes and assert the exact statements issued.
 *
 * Returns the per-model counts, which the maintenance job logs (those counts
 * are the only evidence anyone will ever have that a purge did what it said),
 * plus the upload filenames the caller must unlink once the transaction has
 * COMMITTED. Deliberately not unlinked in here: a filesystem write cannot be
 * rolled back, so deleting files inside the transaction would destroy them even
 * on a path where the database changes are undone.
 */
export async function purgeAccount(
  client: PurgeClient,
  account: { id: string; email?: string | null },
  now: Date = new Date()
): Promise<PurgeResult> {
  const counts: PurgeCounts = {}

  // Read the upload filenames BEFORE the Media rows are deleted — afterwards
  // there is nothing left to tell us which files on disk were theirs.
  const mediaRows = (await client.media?.findMany?.({
    where: { userId: account.id },
    select: { url: true, thumbnailUrl: true },
  })) ?? []
  const uploadFilenames = [
    ...new Set(
      mediaRows
        .flatMap((m: { url?: unknown; thumbnailUrl?: unknown }) => [m.url, m.thumbnailUrl])
        .map(uploadFilenameFromUrl)
        .filter((f): f is string => f !== null)
    ),
  ]

  for (const spec of PURGE_PLAN) {
    const affected =
      spec.delegate === 'inquiry'
        ? await anonymiseInquiries(client, spec, account.email)
        : await applySpec(client, spec, account.id)
    if (affected > 0) counts[spec.label] = affected
  }

  // The tombstone stamp is a separate write from the User anonymisation above
  // so that `deletedAt` can never be set by a spec that half-succeeded: if
  // anything in the loop throws, the transaction rolls back and the account is
  // still due, so the next sweep retries it.
  await client.user.update!({
    where: { id: account.id },
    data: { deletedAt: now },
  })

  return { counts, uploadFilenames }
}

/**
 * Accounts whose 30 days are up.
 *
 * `take` is a deliberate cap: the daily job shares a request timeout with every
 * other thing expire-trials does, and a purge is a multi-statement transaction
 * per account. A backlog drains over consecutive days rather than timing the
 * whole maintenance run out and expiring no trials either.
 */
export async function findAccountsDueForPurge(
  delegate: PurgeDelegate,
  now: Date = new Date(),
  take = 50
): Promise<Array<{ id: string; email: string | null }>> {
  return delegate.findMany!({
    where: {
      deletionScheduledFor: { lte: now },
      deletedAt: null,
    },
    select: { id: true, email: true },
    take,
  })
}

/**
 * The data the immediate phase writes once billing is confirmed stopped.
 *
 * Pure, so the ordering guarantee ("never stamped before MercadoPago said yes")
 * is enforced by the call site and provable in a test.
 */
export function buildDeletionRequestData(now: Date = new Date()) {
  return {
    deletionRequestedAt: now,
    deletionScheduledFor: getPurgeDueDate(now),
  }
}
