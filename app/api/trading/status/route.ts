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

    const subscriptions = await prisma.tradingSubscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { coupon: { select: { code: true, discount: true } } },
    })

    return NextResponse.json({ subscriptions })
  } catch (err) {
    console.error('[Trading Status] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
