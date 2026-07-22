import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { isLinkedInPlanId, type LinkedInPlanId } from '@/lib/linkedin-plans'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// Keyed by the canonical plan-id union so this route-local title override
// cannot drift from lib/linkedin-plans.ts.
const LINKEDIN_PLANS: Record<LinkedInPlanId, { monthly: number; title: string }> = {
  basico:      { monthly: 12000, title: 'LinkedIn IA Básico — Automatic IA Lab' },
  profesional: { monthly: 20000, title: 'LinkedIn IA Profesional — Automatic IA Lab' },
  agencia:     { monthly: 45000, title: 'LinkedIn IA Agencia — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP LinkedIn] MP_ACCESS_TOKEN no está configurado')
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

    const sub = await prisma.linkedInSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (sub.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Esta suscripción ya fue procesada' }, { status: 400 })
    }

    if (sub.preapprovalId) {
      console.log(`[MP LinkedIn] Subscription ${subscriptionId} already has preapproval ${sub.preapprovalId} — skipping`)
      return NextResponse.json({ error: 'Ya se generó un link de pago para esta suscripción. Refrescá la página.' }, { status: 409 })
    }

    // Membership check first: the map is a plain object, so a stored plan of
    // 'toString' would resolve through Object.prototype to a truthy function,
    // pass the guard below, and price the preapproval at NaN.
    const planConfig = isLinkedInPlanId(sub.plan) ? LINKEDIN_PLANS[sub.plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const isFreeTrial = sub.discountApplied >= 100
    const finalPrice = isFreeTrial
      ? planConfig.monthly
      : Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/linkedin?mp_return=true&sub=${subscriptionId}`
    const startDate = new Date(Date.now() + 120_000).toISOString()

    const extRef = `linkedin:${subscriptionId}:${sub.plan}`

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
        ...(isFreeTrial
          ? { free_trial: { frequency: 1, frequency_type: 'months' } }
          : sub.plan === 'basico'
            ? { free_trial: { frequency: 3, frequency_type: 'days' } }
            : {}),
      },
      back_url: backUrl,
    }

    console.log('[MP LinkedIn] Creating preapproval:', { plan: sub.plan, subscriptionId, price: finalPrice })

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
      console.error('[MP LinkedIn] Error:', res.status, JSON.stringify(data, null, 2))
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    const initPoint = data.init_point
    if (!initPoint || !data.id) {
      console.error('[MP LinkedIn] Missing init_point or id:', { init_point: !!initPoint, id: !!data.id })
      return NextResponse.json({ error: 'MercadoPago no devolvió link de pago' }, { status: 502 })
    }

    await prisma.linkedInSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    console.log('[MP LinkedIn] Preapproval created:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP LinkedIn] Exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
