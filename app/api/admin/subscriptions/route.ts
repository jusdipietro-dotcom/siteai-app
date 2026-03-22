import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [monitoring, reviews, linkedin] = await Promise.all([
    prisma.monitoringSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reviewsSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.linkedInSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Strip encrypted credential values from monitoring — admin sees metadata only
  const safeMonitoring = monitoring.map(({ credentialUser, credentialPass, credentialIv, credentialTag, ...rest }) => ({
    ...rest,
    hasCredentials: !!(credentialUser && credentialPass),
  }))

  return NextResponse.json({
    subscriptions: safeMonitoring,
    reviews,
    linkedin,
  })
}
