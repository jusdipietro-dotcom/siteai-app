import type { Project, ProjectStatus } from '@/types'
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'
import { effectiveBillingStatus } from '@/lib/project-billing'
import { parseJSON } from '@/lib/published-site'

/**
 * Fields a client request is allowed to write on a Project.
 *
 * Billing state (`plan`, `hasPaid`, `preapprovalId`), `views` and `publishedUrl`
 * are deliberately excluded: they are owned by trusted server code only
 * (the MercadoPago webhook, the publish pipeline, the view counter).
 * Never add a billing field here — that reopens the paywall bypass.
 *
 * `status` is NOT here either, and that is the paywall. Publishing used to be an
 * ordinary field write, so `PUT /api/projects/{id} {"status":"published"}` put a
 * site live for free. Reaching `published` now requires
 * `POST /api/projects/{id}/publish`, which checks payment server-side.
 * Non-publish lifecycle transitions go through sanitizeLifecycleStatus() below,
 * which routes opt into explicitly. Never add `status` back to this list.
 *
 * `subdomain` IS client-writable, but never verbatim: it is normalized and
 * validated server-side on every write (see below). Whether a subdomain
 * actually resolves is a separate concern and is not enforced here.
 */
const CLIENT_WRITABLE_FIELDS = [
  'name',
  'slug',
  'template',
  'businessData',
  'sections',
  'mediaIds',
  'coverImageId',
  'thumbnail',
  'subdomain',
] as const

type ClientWritableField = (typeof CLIENT_WRITABLE_FIELDS)[number]

/**
 * Lifecycle statuses a client may set directly. `published` is deliberately
 * absent — it is the paid state and only the publish endpoint may grant it.
 */
const CLIENT_WRITABLE_STATUSES = ['draft', 'generating', 'ready', 'error'] as const

/**
 * Thrown when a client payload carries a status it may not set itself.
 * Routes translate this into a 400.
 */
export class InvalidStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidStatusError'
  }
}

/**
 * Validates an untrusted lifecycle status.
 * Returns `undefined` when the payload carries no status (nothing to write).
 * Throws for `published` and for anything unrecognized — an attempt to publish
 * through an ordinary write must fail loudly, never be silently dropped, so a
 * caller can never mistake a stripped field for a successful publish.
 */
export function sanitizeLifecycleStatus(raw: unknown): ProjectStatus | undefined {
  if (raw === undefined) return undefined

  if (raw === 'published') {
    throw new InvalidStatusError(
      'No se puede publicar por esta vía. Usá POST /api/projects/{id}/publish.'
    )
  }

  if (
    typeof raw !== 'string' ||
    !(CLIENT_WRITABLE_STATUSES as readonly string[]).includes(raw)
  ) {
    throw new InvalidStatusError('Estado de proyecto inválido')
  }

  return raw as ProjectStatus
}

/**
 * Thrown when a client payload carries a subdomain that cannot be stored.
 * Routes translate this into a 400 with `reason` as the message.
 */
export class InvalidSubdomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSubdomainError'
  }
}

/**
 * Normalizes and validates an untrusted subdomain value.
 * Returns `null` to mean "release the subdomain" (explicit null / empty string).
 * Throws InvalidSubdomainError for anything malformed or reserved — an invalid
 * value must be rejected loudly, never silently dropped.
 */
function sanitizeSubdomain(raw: unknown): string | null {
  if (raw === null) return null
  if (typeof raw !== 'string') {
    throw new InvalidSubdomainError('El subdominio debe ser texto')
  }

  const normalized = normalizeSubdomain(raw)
  if (normalized === '') return null

  // Server-side validation is authoritative. Client normalization is never trusted.
  const validation = validateSubdomain(normalized)
  if (!validation.valid) {
    throw new InvalidSubdomainError(validation.reason ?? 'Subdominio inválido')
  }

  return normalized
}

/**
 * Serializes an untrusted client payload for storage.
 * Strips every field outside CLIENT_WRITABLE_FIELDS before it reaches Prisma,
 * so a crafted request body cannot flip `hasPaid`, escalate `plan`, forge
 * `preapprovalId` / `views` / `publishedUrl`, or set `status` — including
 * `published`, which is what the paywall protects.
 *
 * Callers that legitimately accept a lifecycle status must opt in explicitly by
 * calling sanitizeLifecycleStatus() and merging the result themselves.
 *
 * @throws InvalidSubdomainError when `subdomain` is malformed or reserved.
 */
export function serializeProjectFromClient(body: unknown) {
  if (!body || typeof body !== 'object') return {}

  const source = body as Record<string, unknown>
  const allowed: Partial<Project> = {}

  for (const field of CLIENT_WRITABLE_FIELDS) {
    if (source[field] === undefined) continue

    if (field === 'subdomain') {
      allowed.subdomain = sanitizeSubdomain(source[field])
      continue
    }

    allowed[field as ClientWritableField] = source[field] as never
  }

  return serializeProject(allowed)
}

// Serializes a Project object for storage in SQLite (JSON fields as strings).
// TRUSTED SERVER USE ONLY — accepts billing fields. For request bodies use
// serializeProjectFromClient().
export function serializeProject(p: Partial<Project> & { userId?: string }) {
  return {
    ...(p.name !== undefined && { name: p.name }),
    ...(p.slug !== undefined && { slug: p.slug }),
    ...(p.subdomain !== undefined && { subdomain: p.subdomain }),
    ...(p.status !== undefined && { status: p.status }),
    ...(p.plan !== undefined && { plan: p.plan }),
    ...(p.hasPaid !== undefined && { hasPaid: p.hasPaid }),
    ...(p.template !== undefined && { template: p.template }),
    ...(p.thumbnail !== undefined && { thumbnail: p.thumbnail }),
    ...(p.publishedUrl !== undefined && { publishedUrl: p.publishedUrl }),
    ...(p.views !== undefined && { views: p.views }),
    ...(p.coverImageId !== undefined && { coverImageId: p.coverImageId }),
    ...(p.businessData !== undefined && { businessData: JSON.stringify(p.businessData) }),
    ...(p.sections !== undefined && { sections: JSON.stringify(p.sections) }),
    ...(p.mediaIds !== undefined && { mediaIds: JSON.stringify(p.mediaIds) }),
    ...((p as any).userId !== undefined && { userId: (p as any).userId }),
    ...((p as any).preapprovalId !== undefined && { preapprovalId: (p as any).preapprovalId }),
  }
}

// Deserializes a DB row back into a Project object.
//
// Billing state is resolved through effectiveBillingStatus() here rather than
// copied verbatim, so every consumer of this function sees an elapsed grace
// period as 'suspended' even though the row still says 'grace'. That is the
// read-time enforcement: nothing depends on a job having run.
//
// The JSON columns go through parseJSON() — the same tolerant parser the public
// renderer uses — instead of a bare JSON.parse(). GET /api/projects maps this
// over every row the user owns, so a single corrupt row used to 500 the entire
// project list and lock the user out of the dashboard. A corrupt column now
// degrades to an empty value and is logged, which is recoverable in the editor.
export function deserializeProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subdomain: row.subdomain ?? undefined,
    status: row.status,
    plan: row.plan,
    hasPaid: row.hasPaid,
    billingStatus: effectiveBillingStatus(row),
    graceUntil: row.graceUntil ? new Date(row.graceUntil).toISOString() : null,
    suspendedReason: row.suspendedReason ?? null,
    template: row.template ?? '',
    thumbnail: row.thumbnail ?? undefined,
    publishedUrl: row.publishedUrl ?? undefined,
    views: row.views ?? 0,
    coverImageId: row.coverImageId ?? undefined,
    businessData: parseJSON(row.businessData, {} as Project['businessData'], `project ${row.id}.businessData`),
    sections: parseJSON(row.sections, [] as Project['sections'], `project ${row.id}.sections`),
    mediaIds: parseJSON(row.mediaIds, [] as Project['mediaIds'], `project ${row.id}.mediaIds`),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    // Only present when the caller asked Prisma for the filtered relation count
    // (GET /api/projects does; the single-project GET does not). Left undefined
    // otherwise rather than defaulted to 0, so the dashboard can tell "no unread
    // leads" apart from "this response never carried the count" and not render a
    // reassuring zero it did not measure.
    unreadLeads: row._count?.siteLeads,
  }
}
