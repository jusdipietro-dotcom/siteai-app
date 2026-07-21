import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS, SCRAPER_CONTROL_TIMEOUT_MS } from '@/lib/fetch-timeouts'

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

    const sub = await prisma.causasSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (sub.status === 'cancelled') {
      return NextResponse.json({ error: 'Suscripción ya cancelada' }, { status: 400 })
    }

    // Cancel MercadoPago preapproval if exists
    if (sub.preapprovalId) {
      try {
        const mpToken = process.env.MP_ACCESS_TOKEN
        if (mpToken) {
          await fetch(`https://api.mercadopago.com/preapproval/${sub.preapprovalId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${mpToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' }),
            signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
          })
        }
      } catch (mpErr) {
        console.error('[Causas Cancel] Error cancelling MP preapproval:', mpErr)
      }
    }

    // Deactivate in scraper if provisioned
    if (sub.scraperTenantId) {
      try {
        const scraperUrl = process.env.CAUSAS_SCRAPER_URL
        const scraperKey = process.env.CAUSAS_SCRAPER_API_KEY
        if (scraperUrl && scraperKey) {
          await fetch(`${scraperUrl}/api/tenant/${sub.scraperTenantId}/deactivate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${scraperKey}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(SCRAPER_CONTROL_TIMEOUT_MS),
          })
        }
      } catch (scraperErr) {
        console.error('[Causas Cancel] Error deactivating scraper tenant:', scraperErr)
      }
    }

    await prisma.causasSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Causas Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
