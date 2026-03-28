import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/turnos/configure
 * Updates a pending_config turnos subscription with business name, slug, etc.,
 * then transitions it to 'provisioning' so the provisioning flow can activate it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, businessName, slug, phone, address } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Validate fields
    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre del negocio invalido' }, { status: 400 })
    }
    const normalizedSlug = (slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!normalizedSlug || normalizedSlug.length < 3) {
      return NextResponse.json({ error: 'Slug invalido (minimo 3 caracteres)' }, { status: 400 })
    }

    // Find the subscription — must belong to this user and be pending_config
    const sub = await prisma.turnosSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        status: 'pending_config',
      },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada o no esta pendiente de configuracion' }, { status: 404 })
    }

    // Check slug uniqueness
    const slugExists = await prisma.turnosSubscription.findFirst({
      where: {
        slug: normalizedSlug,
        id: { not: subscriptionId },
        status: { in: ['active', 'provisioning', 'pending_config'] },
      },
    })
    if (slugExists) {
      return NextResponse.json({ error: 'Ese slug ya esta en uso. Elegi otro.' }, { status: 409 })
    }

    // Update with business data and transition to provisioning
    await prisma.turnosSubscription.update({
      where: { id: subscriptionId },
      data: {
        businessName: businessName.trim(),
        slug: normalizedSlug,
        phone: phone || '',
        address: address || '',
        status: 'provisioning',
      },
    })

    console.log(`[Turnos Configure] Subscription ${subscriptionId} configured -> provisioning (slug: ${normalizedSlug})`)

    return NextResponse.json({ status: 'provisioning', message: 'Configuracion guardada. Activando servicio...' })
  } catch (err) {
    console.error('[Turnos Configure] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
