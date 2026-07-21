import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FLASK_BACKEND_TIMEOUT_MS, MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const FLASK_BACKEND_URL = process.env.FLASK_BACKEND_URL
const FLASK_PROVISION_SECRET = process.env.FLASK_PROVISION_SECRET

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

    const sub = await prisma.facturacionSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }

    if (sub.status === 'cancelled' || sub.status === 'suspended') {
      return NextResponse.json({ error: 'La suscripción ya está cancelada' }, { status: 400 })
    }

    // 1. Cancel MercadoPago preapproval if exists
    if (sub.preapprovalId && MP_ACCESS_TOKEN) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sub.preapprovalId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
          signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
        })
        const mpData = await mpRes.json()
        console.log(`[Facturacion Cancel] MP preapproval ${sub.preapprovalId}: ${mpRes.status} - ${mpData.status}`)
      } catch (err) {
        console.error('[Facturacion Cancel] Error cancelling MP preapproval:', err)
      }
    }

    // 2. Deactivate tenant in Flask backend
    if (sub.flaskTenantId && FLASK_BACKEND_URL && FLASK_PROVISION_SECRET) {
      try {
        await fetch(`${FLASK_BACKEND_URL}/auth/portal-deprovision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Portal-Secret': FLASK_PROVISION_SECRET,
          },
          body: JSON.stringify({ tenantId: sub.flaskTenantId }),
          signal: AbortSignal.timeout(FLASK_BACKEND_TIMEOUT_MS),
        })
        console.log(`[Facturacion Cancel] Flask tenant ${sub.flaskTenantId} deactivated`)
      } catch (err) {
        console.error('[Facturacion Cancel] Error deactivating Flask tenant:', err)
      }
    }

    // 3. Update subscription status
    await prisma.facturacionSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    console.log(`[Facturacion Cancel] Subscription ${subscriptionId} cancelled by user ${session.user.id}`)

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Facturacion Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
