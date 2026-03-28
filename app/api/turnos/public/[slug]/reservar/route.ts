import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * Public endpoint: POST /api/turnos/public/{slug}/reservar
 * Creates a booking. No auth required.
 * Body: { nombre, apellido, dni, telefono, email, area, fecha, hora, notas }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Rate limit: 3 bookings per 5 minutes per IP
    const ip = getClientIp(req)
    const rl = checkRateLimit(`turnos-reservar:${slug}:${ip}`, { maxRequests: 3, windowSeconds: 300 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const sub = await prisma.turnosSubscription.findUnique({ where: { slug } })
    if (!sub || sub.status !== 'active') {
      return NextResponse.json({ error: 'Pagina no encontrada' }, { status: 404 })
    }

    const body = await req.json()
    const { nombre, apellido, dni, telefono, email, area, fecha, hora, notas, direccion } = body

    // Basic validation
    if (!nombre || !apellido || !telefono || !email || !fecha || !hora) {
      return NextResponse.json({ error: 'Campos obligatorios: nombre, apellido, telefono, email, fecha, hora' }, { status: 400 })
    }

    // Proxy to n8n workflow if provisioned
    if (sub.n8nWorkflowId) {
      const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.abogadoenquilmes.com'
      try {
        const resp = await fetch(`${n8nUrl}/webhook/turnos-reservar-${sub.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre, apellido, dni, telefono, email,
            area, fecha, hora, notas, direccion,
            slug: sub.slug,
            businessName: sub.businessName,
          }),
        })
        const data = await resp.json()
        if (!resp.ok) {
          return NextResponse.json(data, { status: resp.status })
        }
        return NextResponse.json(data)
      } catch (e) {
        console.error('[Turnos Reservar] n8n proxy error:', e)
        return NextResponse.json({ error: 'Error al procesar la reserva. Intenta de nuevo.' }, { status: 502 })
      }
    }

    // Without n8n, return error (workflow not provisioned yet)
    return NextResponse.json({
      error: 'El sistema de turnos aun se esta configurando. Intenta mas tarde.',
    }, { status: 503 })
  } catch (err) {
    console.error('[Turnos Reservar] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
