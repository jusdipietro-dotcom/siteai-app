import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.tradingSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }

    if (sub.status === 'cancelled') {
      return NextResponse.json({ error: 'La suscripción ya está cancelada' }, { status: 400 })
    }

    // Cancel MercadoPago preapproval (skip if no preapprovalId or free subscription)
    if (sub.preapprovalId && !sub.preapprovalId.startsWith('free-') && MP_ACCESS_TOKEN) {
      try {
        await fetch(`https://api.mercadopago.com/preapproval/${sub.preapprovalId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
          signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
        })
      } catch (err) {
        console.error('[Trading Cancel] Error cancelling MP preapproval:', err)
      }
    }

    await prisma.tradingSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    console.log(`[Trading Cancel] Subscription ${subscriptionId} cancelled by user ${session.user.id}`)

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Trading Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
