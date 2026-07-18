import type { Project } from '@/types'

/**
 * Fields a client request is allowed to write on a Project.
 *
 * Billing state (`plan`, `hasPaid`, `preapprovalId`), `views` and `publishedUrl`
 * are deliberately excluded: they are owned by trusted server code only
 * (the MercadoPago webhook, the publish pipeline, the view counter).
 * Never add a billing field here — that reopens the paywall bypass.
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
] as const

type ClientWritableField = (typeof CLIENT_WRITABLE_FIELDS)[number]

/**
 * Serializes an untrusted client payload for storage.
 * Strips every field outside CLIENT_WRITABLE_FIELDS before it reaches Prisma,
 * so a crafted request body cannot flip `hasPaid`, escalate `plan`, or forge
 * `preapprovalId` / `views` / `publishedUrl`.
 */
export function serializeProjectFromClient(body: unknown) {
  if (!body || typeof body !== 'object') return {}

  const source = body as Record<string, unknown>
  const allowed: Partial<Project> = {}

  for (const field of CLIENT_WRITABLE_FIELDS) {
    if (source[field] !== undefined) {
      allowed[field as ClientWritableField] = source[field] as never
    }
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
