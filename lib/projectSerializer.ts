import type { Project } from '@/types'

// Serializes a Project object for storage in SQLite (JSON fields as strings)
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
