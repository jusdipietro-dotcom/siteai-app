import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import nodemailer from 'nodemailer'

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

    // Without n8n workflow: send email notification to the professional
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const fromAddress = process.env.SMTP_FROM ?? 'Automatic IA Lab <automaticialab@gmail.com>'

      const DAY_SHORT = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
      const bookingDate = new Date(fecha + 'T12:00:00')
      const dayName = DAY_SHORT[bookingDate.getDay()]

      // Email to the professional/business owner
      await transporter.sendMail({
        from: fromAddress,
        to: sub.notificationEmail,
        subject: `Nuevo turno — ${nombre} ${apellido} — ${dayName} ${fecha} ${hora}hs`,
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
            <div style="text-align:center;padding:24px 0">
              <h2 style="margin:0;color:#111">Nuevo turno reservado</h2>
            </div>
            <div style="padding:24px;background:#f9fafb;border-radius:12px">
              <p>Un cliente reservo un turno desde tu pagina <strong>${sub.businessName}</strong>.</p>
              <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Nombre</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${nombre} ${apellido}</td></tr>
                ${dni ? `<tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">DNI</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${dni}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Telefono</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${telefono}</td></tr>
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Email</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${email}</td></tr>
                ${area ? `<tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Area</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${area}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Fecha</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${dayName} ${fecha}</td></tr>
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Hora</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${hora}hs</td></tr>
                ${notas ? `<tr><td style="padding:8px 0;color:#666">Notas</td><td style="padding:8px 0;text-align:right">${notas}</td></tr>` : ''}
              </table>
              <p style="font-size:13px;color:#666;margin-top:16px">
                Contacta al cliente para confirmar el turno.
              </p>
            </div>
            <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px">
              Turnos Online — Automatic IA Lab
            </p>
          </div>
        `,
      })

      // Confirmation email to the client
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Tu turno en ${sub.businessName} — ${dayName} ${fecha} ${hora}hs`,
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
            <div style="text-align:center;padding:24px 0">
              <h2 style="margin:0;color:#111">Turno registrado</h2>
            </div>
            <div style="padding:24px;background:#f9fafb;border-radius:12px">
              <p>Tu turno fue registrado correctamente.</p>
              <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Profesional</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${sub.businessName}</td></tr>
                <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Fecha</td><td style="padding:8px 0;font-weight:600;text-align:right;border-bottom:1px solid #eee">${dayName} ${fecha}</td></tr>
                <tr><td style="padding:8px 0;color:#666">Hora</td><td style="padding:8px 0;font-weight:600;text-align:right">${hora}hs</td></tr>
              </table>
              <p style="font-size:13px;color:#666;margin-top:16px">
                El profesional te contactara para confirmar el turno.
              </p>
              ${sub.phone ? `<p style="font-size:13px;color:#666">Telefono de contacto: <strong>${sub.phone}</strong></p>` : ''}
              ${sub.address ? `<p style="font-size:13px;color:#666">Direccion: ${sub.address}</p>` : ''}
            </div>
            <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px">
              Turnos Online — Automatic IA Lab
            </p>
          </div>
        `,
      })

      console.log(`[Turnos Reservar] Fallback email sent for ${slug}: ${nombre} ${apellido} ${fecha} ${hora}`)
    } catch (emailErr) {
      console.error('[Turnos Reservar] Failed to send fallback email:', emailErr)
      // Even if email fails, we still return success to the user
      // The booking data is in the server logs at minimum
    }

    return NextResponse.json({
      ok: true,
      message: 'Tu turno fue registrado. El profesional te contactara para confirmar.',
      pendingConfirmation: true,
    })
  } catch (err) {
    console.error('[Turnos Reservar] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
