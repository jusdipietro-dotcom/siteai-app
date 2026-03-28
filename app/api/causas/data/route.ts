import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Returns cases for the user's active causas subscription.
 * Supports pagination, search, and state filter.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('subscriptionId')
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Find active subscription
    const sub = subscriptionId
      ? await prisma.causasSubscription.findFirst({
          where: { id: subscriptionId, userId: session.user.id, status: 'active' },
        })
      : await prisma.causasSubscription.findFirst({
          where: { userId: session.user.id, status: 'active' },
          orderBy: { createdAt: 'desc' },
        })

    if (!sub) {
      return NextResponse.json({ error: 'No tenés una suscripción activa', cases: [], total: 0 }, { status: 200 })
    }

    // Build where clause
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

    const [cases, total] = await Promise.all([
      prisma.causasCase.findMany({
        where,
        orderBy: { scrapedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.causasCase.count({ where }),
    ])

    // Get unique estados for filter
    const estados = await prisma.causasCase.groupBy({
      by: ['estado'],
      where: { subscriptionId: sub.id },
      _count: true,
    })

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
  } catch (err) {
    console.error('[Causas Data] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
