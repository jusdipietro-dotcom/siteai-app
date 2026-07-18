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

    const subscriptions = await prisma.linkedInSubscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        plan: true,
        linkedinName: true,
        industry: true,
        audience: true,
        telegramChatId: true,
        postsGenerated: true,
        postsPublished: true,
        payerEmail: true,
        discountApplied: true,
        trialEndsAt: true,
        provisionedAt: true,
        createdAt: true,
        coupon: { select: { code: true, discount: true } },
      },
    })

    return NextResponse.json({ subscriptions: subscriptions.map(effectiveSubscriptionStatus) })
  } catch (err) {
    console.error('[LinkedIn Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
