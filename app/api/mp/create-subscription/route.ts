import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// ─── Configuración de planes ────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, { monthly: number; annual: number; title: string }> = {
  essential:    { monthly: 12000, annual: 8400,  title: 'Plan Essential — Automatic IA Lab' },
  professional: { monthly: 29000, annual: 20300, title: 'Plan Professional — Automatic IA Lab' },
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP] MP_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ error: 'Pago no configurado. Contactá soporte.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { plan, projectId, payerEmail, billing } = await req.json()
    const isAnnual = billing === 'annual'

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

    // Límite de proyectos activos: Essential=1, Professional=3
    const paidCount = await prisma.project.count({
      where: { userId: session.user.id, hasPaid: true, id: { not: projectId } },
    })
    const maxAllowed = plan === 'professional' ? 3 : 1
    if (paidCount >= maxAllowed) {
      return NextResponse.json(
        { error: `Tu plan permite hasta ${maxAllowed} proyecto${maxAllowed > 1 ? 's' : ''} activo${maxAllowed > 1 ? 's' : ''}. Cancelá uno existente para continuar.` },
        { status: 403 }
      )
    }

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    // MP redirige al back_url y agrega ?preapproval_id=XXX automáticamente
    const backUrl = `${baseUrl}/projects/${projectId}/checkout?mp_return=true`

    // start_date: 1 minuto en el futuro para evitar rechazo por latencia de red
    const startDate = new Date(Date.now() + 60_000).toISOString()

    const body = {
      reason: config.title,
      external_reference: `${projectId}:${plan}`,
      payer_email: payerEmail.toLowerCase(),
      auto_recurring: {
        frequency: isAnnual ? 12 : 1,
        frequency_type: 'months',
        start_date: startDate,
        transaction_amount: isAnnual ? config.annual : config.monthly,
        currency_id: 'ARS',
      },
      back_url: backUrl,
      status: 'pending',
    }

    console.log('[MP] creating preapproval for', { plan, projectId, payerEmail: payerEmail.toLowerCase() })

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
      console.error('[MP] create preapproval error (status=%d):', res.status, JSON.stringify(data, null, 2))
      const mpMessage = data.message ?? data.error ?? 'Error de MercadoPago'
      const mpCause = Array.isArray(data.cause)
        ? data.cause.map((c: { code?: string; description?: string }) => c.description ?? c.code).join(', ')
        : null
      return NextResponse.json(
        { error: mpCause ? `${mpMessage}: ${mpCause}` : mpMessage, mp_status: res.status },
        { status: res.status }
      )
    }

    const initPoint = data.init_point
    if (!initPoint) {
      console.error('[MP] preapproval missing init_point:', data)
      return NextResponse.json({ error: 'MercadoPago no devolvió un link de suscripción' }, { status: 502 })
    }

    console.log('[MP] preapproval created, id:', data.id)
    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    console.error('[MP] create-subscription exception:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
