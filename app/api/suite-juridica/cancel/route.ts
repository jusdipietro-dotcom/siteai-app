import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

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

    const sub = await prisma.suiteJuridicaSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
    if (sub.status === 'cancelled') return NextResponse.json({ error: 'Ya esta cancelada' }, { status: 400 })

    // Cancel MP preapproval
    if (sub.preapprovalId && ACCESS_TOKEN) {
      try {
        await fetch(`https://api.mercadopago.com/preapproval/${sub.preapprovalId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
      } catch (e) {
        console.error('[Suite Juridica Cancel] MP error:', e)
      }
    }

    // Cancel the suite subscription
    await prisma.suiteJuridicaSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    // Cancel all 4 individual subscriptions if they exist
    const cancelSub = async (model: string, id: string | null) => {
      if (!id) return
      try {
        // Use raw query to cancel any subscription model generically
        await prisma.$executeRawUnsafe(
          `UPDATE "${model}" SET status = 'cancelled' WHERE id = $1 AND status IN ('active', 'provisioning', 'pending_payment', 'pending_config')`,
          id
        )
      } catch (e) {
        console.error(`[Suite Cancel] Error cancelling ${model} ${id}:`, e)
      }
    }

    await Promise.all([
      cancelSub('MonitoringSubscription', sub.monitoringSubId),
      cancelSub('FacturacionSubscription', sub.facturacionSubId),
      cancelSub('CausasSubscription', sub.causasSubId),
      cancelSub('TurnosSubscription', sub.turnosSubId),
    ])

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Suite Juridica Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
