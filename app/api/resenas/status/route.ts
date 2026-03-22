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

    const subscriptions = await prisma.reviewsSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        plan: true,
        businessName: true,
        businessType: true,
        searchUrl: true,
        googleEmail: true,
        responseTone: true,
        notificationEmail: true,
        payerEmail: true,
        discountApplied: true,
        provisionedAt: true,
        createdAt: true,
        updatedAt: true,
        coupon: { select: { code: true, discount: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (err) {
    console.error('[Reviews Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
