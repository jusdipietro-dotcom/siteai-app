import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/facturacion/configure
 * Updates a pending_config facturacion subscription with the user's business data,
 * then transitions it to 'provisioning' so the provisioning flow can activate it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, cuit, razonSocial, puntoVenta, condicionIva } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Validate fields
    if (!cuit || !/^\d{2}-?\d{7,8}-?\d$/.test(cuit.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'CUIT invalido (debe ser 11 digitos)' }, { status: 400 })
    }
    if (!razonSocial || razonSocial.trim().length < 3) {
      return NextResponse.json({ error: 'Razon social invalida' }, { status: 400 })
    }
    const pv = parseInt(puntoVenta, 10)
    if (!pv || pv < 1 || pv > 99999) {
      return NextResponse.json({ error: 'Punto de venta invalido (1-99999)' }, { status: 400 })
    }

    const normalizedCuit = cuit.replace(/[-\s]/g, '')

    // Find the subscription — must belong to this user and be pending_config
    const sub = await prisma.facturacionSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        status: 'pending_config',
      },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada o no esta pendiente de configuracion' }, { status: 404 })
    }

    // Update with business data and transition to provisioning
    await prisma.facturacionSubscription.update({
      where: { id: subscriptionId },
      data: {
        cuit: normalizedCuit,
        razonSocial: razonSocial.trim(),
        puntoVenta: pv,
        condicionIva: condicionIva || 'Responsable Inscripto',
        status: 'provisioning',
      },
    })

    console.log(`[Facturacion Configure] Subscription ${subscriptionId} configured -> provisioning`)

    return NextResponse.json({ status: 'provisioning', message: 'Configuracion guardada. Activando servicio...' })
  } catch (err) {
    console.error('[Facturacion Configure] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
