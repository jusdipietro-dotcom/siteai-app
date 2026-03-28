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

    const subscriptions = await prisma.turnosSubscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        plan: true,
        slug: true,
        businessName: true,
        businessType: true,
        colorPrimary: true,
        colorAccent: true,
        slotDuration: true,
        phone: true,
        address: true,
        notificationEmail: true,
        payerEmail: true,
        discountApplied: true,
        trialEndsAt: true,
        provisionedAt: true,
        createdAt: true,
        coupon: { select: { code: true, discount: true } },
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (err) {
    console.error('[Turnos Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
