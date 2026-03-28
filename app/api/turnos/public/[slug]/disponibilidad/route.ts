import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public endpoint: GET /api/turnos/public/{slug}/disponibilidad?fecha=YYYY-MM-DD
 * Returns available slots for a given date.
 * No auth required — this is for the public booking page.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const fecha = req.nextUrl.searchParams.get('fecha')
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ error: 'fecha requerida (YYYY-MM-DD)' }, { status: 400 })
    }

    const sub = await prisma.turnosSubscription.findUnique({ where: { slug } })
    if (!sub || sub.status !== 'active') {
      return NextResponse.json({ error: 'Pagina no encontrada' }, { status: 404 })
    }

    // If n8n workflow is provisioned, proxy to it
    if (sub.n8nWorkflowId) {
      const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.abogadoenquilmes.com'
      try {
        const resp = await fetch(
          `${n8nUrl}/webhook/turnos-disponibilidad-${sub.slug}?fecha=${fecha}`,
          { cache: 'no-store' }
        )
        if (resp.ok) {
          const data = await resp.json()
          return NextResponse.json(data)
        }
      } catch (e) {
        console.error('[Turnos Disponibilidad] n8n proxy error:', e)
      }
    }

    // Fallback: calculate availability from config
    const date = new Date(fecha + 'T12:00:00')
    const dayOfWeek = date.getDay()
    const scheduleDays: number[] = JSON.parse(sub.scheduleDays || '[]')
    const scheduleSlots: Record<string, string[]> = JSON.parse(sub.scheduleSlots || '{}')
    const holidays: string[] = JSON.parse(sub.holidays || '[]')

    // Check if day is available
    if (!scheduleDays.includes(dayOfWeek)) {
      return NextResponse.json({ fecha, diaSemana: dayOfWeek, slots: [], disponibles: 0, total: 0 })
    }

    // Check if holiday
    if (holidays.includes(fecha)) {
      return NextResponse.json({ fecha, diaSemana: dayOfWeek, slots: [], disponibles: 0, total: 0, feriado: true })
    }

    // Get slots for this day
    const daySlots = scheduleSlots[String(dayOfWeek)] || []

    // Without Google Calendar integration, all slots are available
    // Once provisioned, the n8n workflow handles Calendar checks
    const slots = daySlots.map(hora => ({ hora, disponible: true }))

    return NextResponse.json({
      fecha,
      diaSemana: dayOfWeek,
      slots,
      disponibles: slots.length,
      total: slots.length,
    })
  } catch (err) {
    console.error('[Turnos Disponibilidad] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
