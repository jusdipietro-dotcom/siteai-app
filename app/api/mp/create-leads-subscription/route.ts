import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS, N8N_WEBHOOK_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { isLeadsPlanId, type LeadsPlanId } from '@/lib/leads-plans'
import { requestLogger } from '@/lib/request-log'

const log = requestLogger({ route: 'api/mp/create-leads-subscription' })

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// Keyed by the canonical plan-id union so this route-local title override
// cannot drift from lib/leads-plans.ts.
const LEADS_PLANS: Record<LeadsPlanId, { monthly: number; title: string }> = {
  basico:      { monthly: 18000, title: 'Captación de Leads IA Básico — Automatic IA Lab' },
  profesional: { monthly: 35000, title: 'Captación de Leads IA Profesional — Automatic IA Lab' },
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

    const { subscriptionId, payerEmail } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.leadsSubscription.findFirst({
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
    const planConfig = isLeadsPlanId(sub.plan) ? LEADS_PLANS[sub.plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const finalPrice = Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    // 100% discount: skip MercadoPago, activate directly
    if (finalPrice <= 0) {
      await prisma.leadsSubscription.update({
        where: { id: subscriptionId },
        data: { status: 'provisioning', preapprovalId: `free-${subscriptionId}` },
      })
      log.info('100% discount — skipping MP, direct provisioning for ${subscriptionId}')

      // Trigger provisioning directly
      const webhookUrl = process.env.N8N_LEADS_PROVISIONING_WEBHOOK
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: sub.id,
              userId: sub.userId,
              plan: sub.plan,
              googleSheetUrl: sub.googleSheetUrl,
              notificationEmail: sub.notificationEmail,
            }),
            signal: AbortSignal.timeout(N8N_WEBHOOK_TIMEOUT_MS),
          })
        } catch (err) {
          log.error('Free provisioning webhook failed', { err })
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://automaticialab.com'
      return NextResponse.json({
        init_point: `${baseUrl}/leads?mp_return=true&status=approved&sub=${subscriptionId}`,
        id: `free-${subscriptionId}`,
        free: true,
      })
    }

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/leads?mp_return=true&sub=${subscriptionId}`

    const extRef = `leads:${subscriptionId}:${sub.plan}`

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
        ...(sub.plan === 'basico'
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

    await prisma.leadsSubscription.update({
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
