import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTurnosPlanConfig } from '@/lib/turnos-plans'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { requestLogger } from '@/lib/request-log'

const log = requestLogger({ route: 'api/mp/create-turnos-subscription' })

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      return NextResponse.json({ error: 'El sistema de pago no esta configurado.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, payerEmail } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.turnosSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
    if (sub.status !== 'pending_payment') return NextResponse.json({ error: 'Ya procesada' }, { status: 400 })
    if (sub.preapprovalId) return NextResponse.json({ error: 'Ya se genero un link de pago.' }, { status: 409 })

    const planConfig = getTurnosPlanConfig(sub.plan)
    if (!planConfig) return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })

    const isFreeTrial = sub.discountApplied >= 100
    const finalPrice = isFreeTrial
      ? planConfig.monthly
      : Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/turnos?mp_return=true&sub=${subscriptionId}`
    const extRef = `turnos:${subscriptionId}:${sub.plan}`

    const body: Record<string, unknown> = {
      reason: planConfig.title,
      external_reference: extRef,
      payer_email: (payerEmail ?? sub.payerEmail).toLowerCase(),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        // No `start_date` on purpose: it caps how long the customer has to
        // finish MercadoPago's checkout, and once it passes MercadoPago
        // silently disables its own "Confirmar" button — no error, no log, the
        // sale just dies. See app/api/mp/create-subscription/route.ts.
        transaction_amount: finalPrice,
        currency_id: 'ARS',
        ...(isFreeTrial
          ? { free_trial: { frequency: 1, frequency_type: 'months' } }
          : sub.plan === 'basico'
            ? { free_trial: { frequency: 3, frequency_type: 'days' } }
            : {}),
      },
      back_url: backUrl,
    }

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
    })

    const data = await res.json()
    if (!res.ok) {
      log.error('MercadoPago rejected the preapproval', { httpStatus: res.status, mpResponse: data })
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    if (!data.init_point || !data.id) {
      return NextResponse.json({ error: 'MercadoPago no devolvio link de pago' }, { status: 502 })
    }

    await prisma.turnosSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    return NextResponse.json({ init_point: data.init_point, id: data.id })
  } catch (err) {
    log.error('Unhandled exception creating the preapproval', { err })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
