import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// ─── Configuración de planes ────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, { amount: number; title: string }> = {
  essential: {
    amount: 12000,
    title: 'Plan Essential — SiteAI',
  },
  professional: {
    amount: 29000,
    title: 'Plan Professional — SiteAI',
  },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP] MP_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ error: 'Pago no configurado. Contactá soporte.' }, { status: 503 })
    }

    const { plan, projectId, payerEmail } = await req.json()

    const config = PLAN_CONFIG[plan]
    if (!config) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    if (!payerEmail || !payerEmail.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })
    }

    // Construir URLs desde la variable de entorno o desde los headers del request
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    const successUrl = `${baseUrl}/projects/${projectId}/checkout?mp_return=true&status=approved`
    const failureUrl = `${baseUrl}/projects/${projectId}/checkout?mp_return=true&status=failure`
    const pendingUrl = `${baseUrl}/projects/${projectId}/checkout?mp_return=true&status=pending`

    // Usar Checkout Pro (preference) — compatible con app "Integración con CheckoutPro"
    const body = {
      items: [
        {
          id: `plan-${plan}`,
          title: config.title,
          description: `Acceso mensual al ${config.title}`,
          quantity: 1,
          unit_price: config.amount,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: payerEmail.toLowerCase(),
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      external_reference: `${projectId}:${plan}`,
      statement_descriptor: 'SiteAI',
    }

    console.log('[MP] creating preference, back_urls:', { successUrl, failureUrl })

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[MP] create preference error (status=%d):', res.status, JSON.stringify(data, null, 2))
      const mpMessage = data.message ?? data.error ?? 'Error de MercadoPago'
      const mpCause = Array.isArray(data.cause)
        ? data.cause.map((c: { code?: string; description?: string }) => c.description ?? c.code).join(', ')
        : null
      return NextResponse.json(
        { error: mpCause ? `${mpMessage}: ${mpCause}` : mpMessage, mp_status: res.status },
        { status: res.status }
      )
    }

    // En test mode: sandbox_init_point. En producción: init_point
    const initPoint = data.sandbox_init_point ?? data.init_point
    if (!initPoint) {
      console.error('[MP] missing init_point:', data)
      return NextResponse.json({ error: 'MercadoPago no devolvió un link de pago' }, { status: 502 })
    }

    console.log('[MP] preference created, id:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP] create-subscription exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
