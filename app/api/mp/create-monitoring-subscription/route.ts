import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { isMonitoreoPlanId, type MonitoreoPlanId } from '@/lib/monitoreo-plans'
import { requestLogger } from '@/lib/request-log'

const log = requestLogger({ route: 'api/mp/create-monitoring-subscription' })

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// Keyed by the canonical plan-id union so this route-local title override
// cannot drift from lib/monitoreo-plans.ts.
const MONITORING_PLANS: Record<MonitoreoPlanId, { monthly: number; title: string }> = {
  basico:      { monthly: 19000, title: 'Monitoreo Judicial Básico — Automatic IA Lab' },
  profesional: { monthly: 35000, title: 'Monitoreo Judicial Profesional — Automatic IA Lab' },
  estudio:     { monthly: 75000, title: 'Monitoreo Judicial Estudio — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      log.error('MP_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ error: 'El sistema de pago no está configurado. Contactá soporte.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, payerEmail, replacesSubscriptionId } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Fetch the monitoring subscription
    const sub = await prisma.monitoringSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (sub.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Esta suscripción ya fue procesada' }, { status: 400 })
    }

    // Idempotency: if a preapproval already exists, don't create another
    if (sub.preapprovalId) {
      log.info('Subscription already has a preapproval — skipping', { subscriptionId: subscriptionId, preapprovalId: sub.preapprovalId })
      return NextResponse.json({ error: 'Ya se generó un link de pago para esta suscripción. Refrescá la página.' }, { status: 409 })
    }

    // Membership check first: the map is a plain object, so a stored plan of
    // 'toString' would resolve through Object.prototype to a truthy function,
    // pass the guard below, and price the preapproval at NaN.
    const planConfig = isMonitoreoPlanId(sub.plan) ? MONITORING_PLANS[sub.plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Calculate price with discount
    const isFreeTrial = sub.discountApplied >= 100
    const finalPrice = isFreeTrial
      ? planConfig.monthly // Full price for recurring (after free trial)
      : Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/monitoreo?mp_return=true&sub=${subscriptionId}`
    const startDate = new Date(Date.now() + 120_000).toISOString() // 2 min buffer

    // external_reference format: "monitoring:subscriptionId:plan" or "monitoring:subscriptionId:plan:replacesSubId"
    // IMPORTANT: MP preapproval webhooks must be configured in the MP Developer Dashboard
    // URL: https://automaticialab.com/api/mp/webhook | Events: preapproval
    const extRef = replacesSubscriptionId
      ? `monitoring:${subscriptionId}:${sub.plan}:${replacesSubscriptionId}`
      : `monitoring:${subscriptionId}:${sub.plan}`

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
        // 100% discount = first month free; basic plan = 3-day free trial
        ...(isFreeTrial
          ? { free_trial: { frequency: 1, frequency_type: 'months' } }
          : sub.plan === 'basico'
            ? { free_trial: { frequency: 3, frequency_type: 'days' } }
            : {}),
      },
      back_url: backUrl,
    }

    log.info('Creating preapproval', { plan: sub.plan, subscriptionId, price: finalPrice })

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
      log.error('MercadoPago rejected the preapproval', { httpStatus: res.status, mpResponse: data })
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    const initPoint = data.init_point
    if (!initPoint || !data.id) {
      log.error('MercadoPago response is missing init_point or id', { hasInitPoint: !!initPoint, hasId: !!data.id })
      return NextResponse.json({ error: 'MercadoPago no devolvió link de pago' }, { status: 502 })
    }

    // Update subscription with preapproval ID
    await prisma.monitoringSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    log.info('Preapproval created', { preapprovalId: data.id })
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    log.error('Unhandled exception creating the preapproval', { err })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
