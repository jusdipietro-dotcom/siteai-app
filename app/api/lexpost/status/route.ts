import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const subscription = await prisma.lexPostSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'trial', 'provisioning', 'pending_payment'] },
      },
      select: {
        id: true,
        status: true,
        plan: true,
        igUsername: true,
        publicationsUsed: true,
        publicationsLimit: true,
        notificationEmail: true,
        provisionedAt: true,
        createdAt: true,
        trialEndsAt: true,
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const isFree = (session.user as { isFreeAccount?: boolean }).isFreeAccount === true

    return NextResponse.json({
      subscription: subscription ? { ...subscription, freeAccount: isFree } : null,
    })
  } catch (err) {
    console.error('[LexPost Status] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
