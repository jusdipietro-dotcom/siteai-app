import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * MCP service endpoint — returns the cases of a single user's active
 * causas subscription. Authenticated with a service token (no NextAuth session),
 * scoped to a user identified by env MCP_CAUSAS_DEFAULT_EMAIL (or ?userEmail=).
 *
 * Called by mcp-abogadoenquilmes (https://mcp.abogadoenquilmes.com).
 */
export async function GET(req: NextRequest) {
  const expectedToken = process.env.MCP_SERVICE_TOKEN
  if (!expectedToken) {
    return NextResponse.json(
      { error: 'MCP_SERVICE_TOKEN not configured on server' },
      { status: 503 }
    )
  }

  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ') || auth.slice(7).trim() !== expectedToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userEmail =
    searchParams.get('userEmail') ?? process.env.MCP_CAUSAS_DEFAULT_EMAIL ?? ''
  if (!userEmail) {
    return NextResponse.json(
      { error: 'userEmail param required (or set MCP_CAUSAS_DEFAULT_EMAIL)' },
      { status: 400 }
    )
  }

  const search = searchParams.get('search') ?? ''
  const estado = searchParams.get('estado') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
  )

  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const sub = await prisma.causasSubscription.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) {
    return NextResponse.json(
      { cases: [], total: 0, page, limit, totalPages: 0, lastScrapeAt: null, estados: [] },
      { status: 200 }
    )
  }

  const where: Record<string, unknown> = { subscriptionId: sub.id }
  if (search) {
    where.OR = [
      { caratula: { contains: search, mode: 'insensitive' } },
      { nroExpediente: { contains: search, mode: 'insensitive' } },
      { courtName: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (estado) {
    where.estado = estado
  }

  const [cases, total, estados] = await Promise.all([
    prisma.causasCase.findMany({
      where,
      orderBy: { scrapedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.causasCase.count({ where }),
    prisma.causasCase.groupBy({
      by: ['estado'],
      where: { subscriptionId: sub.id },
      _count: true,
    }),
  ])

  return NextResponse.json({
    cases: cases.map((c) => ({
      ...c,
      movimientos: JSON.parse(c.movimientos || '[]'),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    lastScrapeAt: sub.lastScrapeAt,
    estados: estados.map((e) => ({ estado: e.estado, count: e._count })),
  })
}
