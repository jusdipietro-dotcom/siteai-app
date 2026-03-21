import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

const MONITORING_PLANS: Record<string, { monthly: number; title: string }> = {
  basico:      { monthly: 19000, title: 'Monitoreo Judicial Básico — Automatic IA Lab' },
  profesional: { monthly: 35000, title: 'Monitoreo Judicial Profesional — Automatic IA Lab' },
  estudio:     { monthly: 75000, title: 'Monitoreo Judicial Estudio — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP Monitoring] MP_ACCESS_TOKEN no está configurado')
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

    const planConfig = MONITORING_PLANS[sub.plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Calculate price with discount
    const finalPrice = Math.round(planConfig.monthly * (1 - sub.discountApplied / 100))

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const backUrl = `${baseUrl}/monitoreo?mp_return=true&sub=${subscriptionId}`
    const startDate = new Date(Date.now() + 120_000).toISOString() // 2 min buffer

    // external_reference format: "monitoring:subscriptionId:plan"
    const body = {
      reason: planConfig.title,
      external_reference: `monitoring:${subscriptionId}:${sub.plan}`,
      payer_email: (payerEmail ?? sub.payerEmail).toLowerCase(),
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        start_date: startDate,
        transaction_amount: finalPrice,
        currency_id: 'ARS',
      },
      back_url: backUrl,
    }

    console.log('[MP Monitoring] Creating preapproval:', { plan: sub.plan, subscriptionId, price: finalPrice })

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[MP Monitoring] Error:', res.status, JSON.stringify(data, null, 2))
      return NextResponse.json({ error: data.message ?? 'Error de MercadoPago' }, { status: res.status })
    }

    const initPoint = data.init_point
    if (!initPoint || !data.id) {
      console.error('[MP Monitoring] Missing init_point or id:', { init_point: !!initPoint, id: !!data.id })
      return NextResponse.json({ error: 'MercadoPago no devolvió link de pago' }, { status: 502 })
    }

    // Update subscription with preapproval ID
    await prisma.monitoringSubscription.update({
      where: { id: subscriptionId },
      data: { preapprovalId: data.id },
    })

    console.log('[MP Monitoring] Preapproval created:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP Monitoring] Exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
