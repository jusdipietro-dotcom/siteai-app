/**
 * The thirteen products, as the admin panel sees them.
 *
 * Twelve are subscription models (see SUBSCRIPTION_PURGE_SPECS in
 * lib/account-deletion.ts, which is the same list from the deletion side) plus
 * the website generator, whose `Project` model bills differently: a coupon
 * redemption there never opens a MercadoPago preapproval, and it carries
 * billingStatus/graceUntil instead of a status string. That difference is
 * absorbed here so the panel can show all thirteen in one shape.
 *
 * `/admin/suscripciones` queried three of them and was blind to the other ten.
 * The list existing as data — not as three hand-written branches — is what
 * makes adding the fourteenth product a one-line change instead of a rediscovery.
 *
 * Pure module: no Prisma, no React. The route does the I/O, the client renders.
 */

/** Source of truth for the product ids. The type is derived so they cannot drift. */
export const ADMIN_PRODUCT_IDS = [
  'monitoreo',
  'resenas',
  'linkedin',
  'crypto',
  'leads',
  'email-marketing',
  'prospeccion',
  'facturacion',
  'causas',
  'turnos',
  'suite-juridica',
  'lexpost',
  'sitios',
] as const

export type AdminProductId = (typeof ADMIN_PRODUCT_IDS)[number]

export interface AdminProductMeta {
  id: AdminProductId
  /** Human label, matching the sidebar the customer sees. */
  label: string
  /** Prisma delegate key. Same spelling as lib/account-deletion.ts uses. */
  delegate: string
  /**
   * Does this product store encrypted third-party credentials?
   *
   * Only two do, and both must have those columns stripped before the row
   * leaves the server. Flagged as data rather than remembered per call site,
   * because the failure mode of forgetting is shipping a customer's judicial
   * portal password to a browser.
   */
  storesCredentials: boolean
}

export const ADMIN_PRODUCTS: readonly AdminProductMeta[] = [
  { id: 'monitoreo', label: 'Monitoreo Judicial', delegate: 'monitoringSubscription', storesCredentials: true },
  { id: 'resenas', label: 'Reseñas Google IA', delegate: 'reviewsSubscription', storesCredentials: false },
  { id: 'linkedin', label: 'LinkedIn IA', delegate: 'linkedInSubscription', storesCredentials: false },
  { id: 'crypto', label: 'Señales Crypto', delegate: 'tradingSubscription', storesCredentials: false },
  { id: 'leads', label: 'Captación Leads', delegate: 'leadsSubscription', storesCredentials: false },
  { id: 'email-marketing', label: 'Email Marketing', delegate: 'emailMarketingSubscription', storesCredentials: false },
  { id: 'prospeccion', label: 'Prospección IA', delegate: 'prospeccionSubscription', storesCredentials: false },
  { id: 'facturacion', label: 'Facturación ARCA', delegate: 'facturacionSubscription', storesCredentials: false },
  { id: 'causas', label: 'Dashboard Causas', delegate: 'causasSubscription', storesCredentials: true },
  { id: 'turnos', label: 'Turnos Online', delegate: 'turnosSubscription', storesCredentials: false },
  { id: 'suite-juridica', label: 'Suite Jurídica', delegate: 'suiteJuridicaSubscription', storesCredentials: false },
  { id: 'lexpost', label: 'LexPost Legal', delegate: 'lexPostSubscription', storesCredentials: false },
  { id: 'sitios', label: 'Generador de Sitios', delegate: 'project', storesCredentials: false },
]

/**
 * Narrows an untrusted value (a query string) to a known product id.
 *
 * Checks the list instead of indexing a lookup object, for the same reason
 * isWebsitePlanId and isSiteLeadStatus do: a plain object resolves
 * `['toString']` through Object.prototype and returns a truthy function, which
 * is enough to slip past an `if (!found)` guard.
 */
export function isAdminProductId(value: unknown): value is AdminProductId {
  return typeof value === 'string' && ADMIN_PRODUCT_IDS.some((id) => id === value)
}

export function getAdminProduct(id: unknown): AdminProductMeta | undefined {
  return isAdminProductId(id) ? ADMIN_PRODUCTS.find((p) => p.id === id) : undefined
}

/** Default page size for one product's rows. */
export const ADMIN_SUBSCRIPTIONS_PAGE_SIZE = 50

/** Hard ceiling, so one request can never dump a whole table. */
export const ADMIN_SUBSCRIPTIONS_MAX_LIMIT = 100

/** Clamps a client-supplied page size into [1, MAX]. Junk falls back to the default. */
export function clampSubscriptionsLimit(
  raw: unknown,
  fallback = ADMIN_SUBSCRIPTIONS_PAGE_SIZE,
  max = ADMIN_SUBSCRIPTIONS_MAX_LIMIT
): number {
  const requested = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN
  if (!Number.isFinite(requested) || requested < 1) return fallback
  return Math.min(Math.floor(requested), max)
}

/**
 * One subscription row, in the single shape all thirteen products share.
 *
 * WHAT IS NOT HERE IS THE POINT. Every product model carries some subset of:
 * encrypted credentials, CUIT/CUIL, payer email, notification email, sender
 * email, Google account, Telegram chat id, n8n/tenant ids, MercadoPago
 * preapproval id. None of it is in this type. The panel's job is to answer
 * "who is subscribed to what, in what state" — `user.email` already identifies
 * the person, so every additional identifier would be data leaving the server
 * for no reason, and a route that returns a column can never be trusted not to
 * log it.
 *
 * The escape hatch for genuinely product-specific facts is `title` / `subtitle`
 * / `metric`: three short, already-rendered strings the route builds, rather
 * than thirteen bespoke payloads.
 */
export interface AdminSubscriptionRow {
  id: string
  product: AdminProductId
  /**
   * The status to act on, with trial expiry already applied. A row can sit at
   * 'trial' long after trialEndsAt passed (there is no scheduler), so the
   * stored value is not the truth — see effectiveSubscriptionStatus.
   */
  status: string
  /** What the column literally says, when it differs from `status`. Null otherwise. */
  storedStatus: string | null
  plan: string
  /** Primary identifier for this row within its product. Never an email. */
  title: string | null
  /** Secondary descriptor: portal, industry, business type, provenance. */
  subtitle: string | null
  /** Product-specific counter, already formatted. */
  metric: string | null
  discountApplied: number
  couponCode: string | null
  couponDiscount: number | null
  /**
   * Whether encrypted credentials are on file. `null` for the eleven products
   * that never store any — distinct from `false`, which means "this product
   * stores credentials and this row has none", i.e. it cannot be provisioned.
   */
  hasCredentials: boolean | null
  trialEndsAt: string | null
  provisionedAt: string | null
  createdAt: string
  /**
   * Date the subscription went down (cancelled or suspended), or null while it
   * is still live. For the twelve products it is the row's `updatedAt` read at
   * the moment it is down — there is no dedicated cancellation-timestamp column,
   * and the last write to a cancelled row is the cancellation. For the website
   * generator it is the exact `Project.suspendedAt`.
   */
  cancelledAt: string | null
  user: { id: string; name: string | null; email: string }
}

export interface AdminSubscriptionsResponse {
  /** Row count per product id. Thirteen entries, always — including zeros. */
  counts: Record<AdminProductId, number>
  /** Which product `rows` belongs to. */
  product: AdminProductId
  rows: AdminSubscriptionRow[]
  /** True total for `product`, so the UI can say "50 of 137" instead of guessing. */
  total: number
  limit: number
  /** Id of the last row, or null when this is the final page. */
  nextCursor: string | null
}
