import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { isTradingPlanId, type TradingPlanId } from '@/lib/trading-plans'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// Keyed by the canonical plan-id union so this route-local title override
// cannot drift from lib/trading-plans.ts.
const TRADING_PLANS: Record<TradingPlanId, { monthly: number; title: string }> = {
  basico:      { monthly: 20000, title: 'Señales Crypto IA Básico — Automatic IA Lab' },
  profesional: { monthly: 35000, title: 'Señales Crypto IA Profesional — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP Trading] MP_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ error: 'El sistema de pago no está configurado. Contactá soporte.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, payerEmail } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.tradingSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (sub.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Esta suscripción ya fue procesada' }, { status: 400 })
    }
    if (sub.preapprovalId) {
      return NextResponse.json({ error: 'Ya se generó un link de pago para esta suscripción.' }, { status: 409 })
    }

    // Membership check first: the map is a plain object, so a stored plan of
    // 'toString' would resolve through Object.prototype to a truthy function,
    // pass the guard below, and price the preapproval at NaN.
    const planConfig = isTradingPlanId(sub.plan) ? TRADING_PLANS[sub.plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const finalPrice = Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    // 100% discount: skip MercadoPago, activate directly
    if (finalPrice <= 0) {
      await prisma.tradingSubscription.update({
        where: { id: subscriptionId },
        data: { status: 'provisioning', preapprovalId: `free-${subscriptionId}` },
      })
      console.log(`[MP Trading] 100% discount — skipping MP, direct provisioning for ${subscriptionId}`)

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://automaticialab.com'
      return NextResponse.json({
        init_point: `${baseUrl}/crypto?mp_return=true&status=approved&sub=${subscriptionId}`,
        id: `free-${subscriptionId}`,
        free: true,
      })
    }

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/crypto?mp_return=true&sub=${subscriptionId}`
    const startDate = new Date(Date.now() + 120_000).toISOString()

    const extRef = `trading:${subscriptionId}:${sub.plan}`

    const body: Record<string, unknown> = {
      reason: planConfig.title,
      external_reference: extRef,
      payer_email: (payerEmail ?? sub.payerEmail).toLowerCase(),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        start_date: startDate,
        transaction_amount: finalPrice,
        currency_id: 'ARS',
        ...(sub.plan === 'basico'
          ? { free_trial: { frequency: 3, frequency_type: 'days' } }
          : {}),
      },
      back_url: backUrl,
    }

    console.log('[MP Trading] Creating preapproval:', { plan: sub.plan, subscriptionId, price: finalPrice })

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[MP Trading] Error:', res.status, JSON.stringify(data, null, 2))
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    const initPoint = data.init_point
    if (!initPoint || !data.id) {
      console.error('[MP Trading] Missing init_point or id')
      return NextResponse.json({ error: 'MercadoPago no devolvió link de pago' }, { status: 502 })
    }

    await prisma.tradingSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    console.log('[MP Trading] Preapproval created:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP Trading] Exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
