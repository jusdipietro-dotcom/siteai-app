import type { Project } from '@/types'
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'

/**
 * Fields a client request is allowed to write on a Project.
 *
 * Billing state (`plan`, `hasPaid`, `preapprovalId`), `views` and `publishedUrl`
 * are deliberately excluded: they are owned by trusted server code only
 * (the MercadoPago webhook, the publish pipeline, the view counter).
 * Never add a billing field here — that reopens the paywall bypass.
 *
 * `subdomain` IS client-writable, but never verbatim: it is normalized and
 * validated server-side on every write (see below). Whether a subdomain
 * actually resolves is a separate concern and is not enforced here.
 */
const CLIENT_WRITABLE_FIELDS = [
  'name',
  'slug',
  'status',
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
 * so a crafted request body cannot flip `hasPaid`, escalate `plan`, or forge
 * `preapprovalId` / `views` / `publishedUrl`.
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

// Deserializes a DB row back into a Project object
export function deserializeProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subdomain: row.subdomain ?? undefined,
    status: row.status,
    plan: row.plan,
    hasPaid: row.hasPaid,
    template: row.template ?? '',
    thumbnail: row.thumbnail ?? undefined,
    publishedUrl: row.publishedUrl ?? undefined,
    views: row.views ?? 0,
    coverImageId: row.coverImageId ?? undefined,
    businessData: JSON.parse(row.businessData),
    sections: JSON.parse(row.sections),
    mediaIds: JSON.parse(row.mediaIds),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
