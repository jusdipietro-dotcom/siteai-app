import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Provision a turnos subscription:
 * 1. Clone n8n workflow template
 * 2. Configure with client data (calendar, sheets, schedule)
 * 3. Activate workflow
 *
 * For now, marks as active and stores IDs. Full n8n cloning
 * is handled by a provisioning script or manually.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-portal-secret')
    const expected = process.env.TURNOS_PROVISION_SECRET || process.env.N8N_API_KEY
    if (!expected || !secret || secret !== expected) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, n8nWorkflowId, googleCalendarId, googleSheetId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.turnosSubscription.findUnique({ where: { id: subscriptionId } })
    if (!sub) return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })

    await prisma.turnosSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        n8nWorkflowId: n8nWorkflowId || null,
        googleCalendarId: googleCalendarId || null,
        googleSheetId: googleSheetId || null,
        provisionedAt: new Date(),
      },
    })

    return NextResponse.json({ status: 'provisioned' })
  } catch (err) {
    console.error('[Turnos Provision] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
