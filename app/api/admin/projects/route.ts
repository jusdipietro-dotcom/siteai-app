import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/** Hard ceiling so a large table can never turn one admin page load into a full dump. */
const MAX_LIMIT = 200

/**
 * GET: list projects for the admin panel.
 *
 * The `select` is deliberately narrow. `businessData` and `sections` are large
 * JSON blobs of the customer's site content — the panel only needs billing
 * metadata, so they are never read, let alone returned.
 *
 * Query params:
 *   q      — case-insensitive match on owner email, project name, slug or subdomain
 *   filter — 'all' (default) | 'paid' | 'free' | 'gifted' | 'suspended'
 *   limit  — page size, capped at MAX_LIMIT
 *   cursor — id of the last row from the previous page
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const filter = searchParams.get('filter') ?? 'all'
  const cursor = searchParams.get('cursor')

  const parsedLimit = Number(searchParams.get('limit'))
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : 50

  const search = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
          { subdomain: { contains: q, mode: 'insensitive' as const } },
          { user: { email: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {}

  const filters: Record<string, object> = {
    all: {},
    paid: { hasPaid: true },
    free: { hasPaid: false },
    gifted: { grantedAt: { not: null } },
    suspended: { billingStatus: 'suspended' },
  }
  const statusWhere = filters[filter] ?? {}

  const where = { AND: [search, statusWhere] }

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        status: true,
        plan: true,
        hasPaid: true,
        billingStatus: true,
        graceUntil: true,
        suspendedAt: true,
        suspendedReason: true,
        grantedBy: true,
        grantedAt: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    projects: rows,
    total,
    nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
  })
}
