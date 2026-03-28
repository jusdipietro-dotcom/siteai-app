import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.turnosSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
    if (sub.status === 'cancelled') return NextResponse.json({ error: 'Ya cancelada' }, { status: 400 })

    // Cancel MP preapproval
    if (sub.preapprovalId) {
      try {
        const mpToken = process.env.MP_ACCESS_TOKEN
        if (mpToken) {
          await fetch(`https://api.mercadopago.com/preapproval/${sub.preapprovalId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          })
        }
      } catch (e) { console.error('[Turnos Cancel] MP error:', e) }
    }

    // Deactivate n8n workflow if provisioned
    if (sub.n8nWorkflowId) {
      try {
        const n8nUrl = process.env.N8N_API_URL
        const n8nKey = process.env.N8N_API_KEY
        if (n8nUrl && n8nKey) {
          await fetch(`${n8nUrl}/api/v1/workflows/${sub.n8nWorkflowId}/deactivate`, {
            method: 'POST',
            headers: { 'X-N8N-API-KEY': n8nKey },
          })
        }
      } catch (e) { console.error('[Turnos Cancel] n8n error:', e) }
    }

    await prisma.turnosSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ status: 'cancelled' })
  } catch (err) {
    console.error('[Turnos Cancel] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
