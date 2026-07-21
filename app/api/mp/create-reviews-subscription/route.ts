import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS, N8N_WEBHOOK_TIMEOUT_MS } from '@/lib/fetch-timeouts'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

const REVIEWS_PLANS: Record<string, { monthly: number; title: string }> = {
  basico:      { monthly: 15000, title: 'Reseñas Google IA Básico — Automatic IA Lab' },
  profesional: { monthly: 25000, title: 'Reseñas Google IA Profesional — Automatic IA Lab' },
  premium:     { monthly: 45000, title: 'Reseñas Google IA Premium — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP Reviews] MP_ACCESS_TOKEN no está configurado')
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

    const sub = await prisma.reviewsSubscription.findFirst({
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

    const planConfig = REVIEWS_PLANS[sub.plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    const finalPrice = Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    // 100% discount: skip MercadoPago, activate directly
    if (finalPrice <= 0) {
      await prisma.reviewsSubscription.update({
        where: { id: subscriptionId },
        data: { status: 'provisioning', preapprovalId: `free-${subscriptionId}` },
      })
      console.log(`[MP Reviews] 100% discount — skipping MP, direct provisioning for ${subscriptionId}`)

      // Trigger provisioning directly
      const webhookUrl = process.env.N8N_REVIEWS_PROVISIONING_WEBHOOK
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: sub.id,
              userId: sub.userId,
              plan: sub.plan,
              businessName: sub.businessName,
              businessType: sub.businessType,
              searchUrl: sub.searchUrl,
              googleEmail: sub.googleEmail,
              responseTone: sub.responseTone,
              notificationEmail: sub.notificationEmail,
            }),
            signal: AbortSignal.timeout(N8N_WEBHOOK_TIMEOUT_MS),
          })
        } catch (err) {
          console.error('[MP Reviews] Free provisioning webhook failed:', err)
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://automaticialab.com'
      return NextResponse.json({
        init_point: `${baseUrl}/resenas?mp_return=true&status=approved&sub=${subscriptionId}`,
        id: `free-${subscriptionId}`,
        free: true,
      })
    }

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/resenas?mp_return=true&sub=${subscriptionId}`
    const startDate = new Date(Date.now() + 120_000).toISOString()

    const extRef = `reviews:${subscriptionId}:${sub.plan}`

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

    console.log('[MP Reviews] Creating preapproval:', { plan: sub.plan, subscriptionId, price: finalPrice })

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
      console.error('[MP Reviews] Error:', res.status, JSON.stringify(data, null, 2))
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    const initPoint = data.init_point
    if (!initPoint || !data.id) {
      console.error('[MP Reviews] Missing init_point or id')
      return NextResponse.json({ error: 'MercadoPago no devolvió link de pago' }, { status: 502 })
    }

    await prisma.reviewsSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    console.log('[MP Reviews] Preapproval created:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP Reviews] Exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
