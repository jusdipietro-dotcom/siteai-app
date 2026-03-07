import { NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Configuración de planes ────────────────────────────────────────────────
// PRODUCCIÓN: actualizar transaction_amount en ARS según precios reales
const PLAN_CONFIG: Record<string, { amount: number; reason: string }> = {
  essential: {
    amount: 12000,  // ARS $12.000/mes — actualizar para producción
    reason: 'Plan Essential — SiteAI (suscripción mensual)',
  },
  professional: {
    amount: 29000,  // ARS $29.000/mes — actualizar para producción
    reason: 'Plan Professional — SiteAI (suscripción mensual)',
  },
}

export async function POST(req: NextRequest) {
  try {
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

    const body = {
      reason: config.reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: config.amount,
        currency_id: 'ARS',
      },
      back_url: `${APP_URL}/projects/${projectId}/checkout?mp_return=true`,
      external_reference: `${projectId}:${plan}`,
      payer_email: payerEmail,
    }

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
      console.error('[MP] create-subscription error:', data)
      return NextResponse.json(
        { error: data.message ?? 'Error de MercadoPago' },
        { status: res.status }
      )
    }

    return NextResponse.json({ init_point: data.init_point, id: data.id })
  } catch (err) {
    console.error('[MP] create-subscription exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
