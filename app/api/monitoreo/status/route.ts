import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { effectiveSubscriptionStatus } from '@/lib/trial'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const subscriptions = await prisma.monitoringSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        plan: true,
        portal: true,
        cuil: true,
        notificationEmail: true,
        payerEmail: true,
        discountApplied: true,
        trialEndsAt: true,
        provisionedAt: true,
        createdAt: true,
        updatedAt: true,
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions: subscriptions.map(effectiveSubscriptionStatus) })
  } catch (err) {
    console.error('[Monitoreo Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
