import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { isLexpostPlanId, type LexpostPlanId } from '@/lib/lexpost-plans'
import { requestLogger } from '@/lib/request-log'

const log = requestLogger({ route: 'api/mp/create-lexpost-subscription' })

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// Keyed by LexpostPlanId so this local title override cannot drift from the
// canonical id list in lib/lexpost-plans.ts.
const LEXPOST_PLANS: Record<LexpostPlanId, { monthly: number; title: string }> = {
  basico:       { monthly: 15000, title: 'LexPost Basico — Automatic IA Lab' },
  profesional:  { monthly: 25000, title: 'LexPost Profesional — Automatic IA Lab' },
  estudio:      { monthly: 45000, title: 'LexPost Estudio — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      log.error('MP_ACCESS_TOKEN no esta configurado')
      return NextResponse.json({ error: 'El sistema de pago no esta configurado. Contacta soporte.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, payerEmail } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Fetch the lexpost subscription
    const sub = await prisma.lexPostSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
    }
    if (sub.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Esta suscripcion ya fue procesada' }, { status: 400 })
    }

    // Idempotency: if a preapproval already exists, don't create another
    if (sub.preapprovalId) {
      log.info('Subscription already has a preapproval — skipping', { subscriptionId: subscriptionId, preapprovalId: sub.preapprovalId })
      return NextResponse.json({ error: 'Ya se genero un link de pago para esta suscripcion. Refresca la pagina.' }, { status: 409 })
    }

    // Membership check first: a stored plan of 'toString' would otherwise
    // resolve through Object.prototype and price the preapproval at NaN.
    const planConfig = isLexpostPlanId(sub.plan) ? LEXPOST_PLANS[sub.plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
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

    const backUrl = `${baseUrl}/lexpost?mp_return=true&sub=${subscriptionId}`

    // external_reference format: "lexpost:subscriptionId:plan"
    const extRef = `lexpost:${subscriptionId}:${sub.plan}`

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
      return NextResponse.json({ error: 'MercadoPago no devolvio link de pago' }, { status: 502 })
    }

    // Update subscription with preapproval ID
    await prisma.lexPostSubscription.update({
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
