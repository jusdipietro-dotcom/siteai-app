import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS, N8N_WEBHOOK_TIMEOUT_MS } from '@/lib/fetch-timeouts'

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

    const sub = await prisma.reviewsSubscription.findFirst({
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
        console.error('[Reviews Cancel] Error cancelling MP preapproval:', err)
      }
    }

    await prisma.reviewsSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    console.log(`[Reviews Cancel] Subscription ${subscriptionId} cancelled by user ${session.user.id}`)

    // Trigger deprovisioning — remove tenant from n8n review bot
    try {
      const webhookUrl = process.env.N8N_REVIEWS_PROVISIONING_WEBHOOK
      const deprovisionUrl = process.env.N8N_REVIEWS_DEPROVISION_WEBHOOK
        || (webhookUrl ? webhookUrl.replace('reviews-provision', 'reviews-deprovision') : '')
      if (deprovisionUrl && sub.n8nTenantId) {
        const dpRes = await fetch(deprovisionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId, tenantId: sub.n8nTenantId }),
          signal: AbortSignal.timeout(N8N_WEBHOOK_TIMEOUT_MS),
        })
        console.log(`[Reviews Cancel] Deprovision tenant ${sub.n8nTenantId}: ${dpRes.status}`)
      }
    } catch (dpErr) {
      console.error('[Reviews Cancel] Failed to trigger deprovisioning:', dpErr)
    }

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Reviews Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
