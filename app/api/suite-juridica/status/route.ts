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

    const subscriptions = await prisma.suiteJuridicaSubscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { coupon: { select: { code: true, discount: true } } },
    })

    return NextResponse.json({
      subscriptions: subscriptions.map(effectiveSubscriptionStatus).map(s => ({
        id: s.id,
        status: s.status,
        plan: s.plan,
        monitoringSubId: s.monitoringSubId,
        facturacionSubId: s.facturacionSubId,
        causasSubId: s.causasSubId,
        turnosSubId: s.turnosSubId,
        trialEndsAt: s.trialEndsAt,
        provisionedAt: s.provisionedAt,
        createdAt: s.createdAt,
        coupon: s.coupon,
      })),
    })
  } catch (err) {
    console.error('[Suite Juridica Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
