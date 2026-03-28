import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptPortalCredentials } from '@/lib/encryption'

/**
 * POST /api/monitoreo/configure
 * Updates a pending_config monitoring subscription with CUIL and portal credentials,
 * then transitions it to 'provisioning' so the provisioning flow can activate it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, cuil, portal, pjnUser, pjnPass, scbaUser, scbaPass } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Validate CUIL
    if (!cuil || !/^\d{2}-?\d{7,8}-?\d$/.test(cuil.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'CUIL invalido (debe ser 11 digitos)' }, { status: 400 })
    }

    // Validate portal
    const validPortal = portal || 'AMBOS'
    if (!['PJN', 'SCBA', 'AMBOS'].includes(validPortal)) {
      return NextResponse.json({ error: 'Portal invalido. Opciones: PJN, SCBA, AMBOS' }, { status: 400 })
    }

    // Validate per-portal credentials
    const needsPjn = validPortal === 'PJN' || validPortal === 'AMBOS'
    const needsScba = validPortal === 'SCBA' || validPortal === 'AMBOS'

    if (needsPjn && (!pjnUser || !pjnPass)) {
      return NextResponse.json({ error: 'Las credenciales de PJN son obligatorias' }, { status: 400 })
    }
    if (needsScba && (!scbaUser || !scbaPass)) {
      return NextResponse.json({ error: 'Las credenciales de SCBA son obligatorias' }, { status: 400 })
    }

    const normalizedCuil = cuil.replace(/[-\s]/g, '')

    // Find the subscription — must belong to this user and be pending_config
    const sub = await prisma.monitoringSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        status: 'pending_config',
      },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada o no esta pendiente de configuracion' }, { status: 404 })
    }

    // Encrypt credentials
    const encrypted = encryptPortalCredentials({
      pjnUser: needsPjn ? pjnUser : undefined,
      pjnPass: needsPjn ? pjnPass : undefined,
      scbaUser: needsScba ? scbaUser : undefined,
      scbaPass: needsScba ? scbaPass : undefined,
    })

    // Update with credentials and transition to provisioning
    await prisma.monitoringSubscription.update({
      where: { id: subscriptionId },
      data: {
        cuil: normalizedCuil,
        portal: validPortal,
        ...encrypted,
        status: 'provisioning',
      },
    })

    console.log(`[Monitoreo Configure] Subscription ${subscriptionId} configured -> provisioning (portal: ${validPortal})`)

    return NextResponse.json({ status: 'provisioning', message: 'Configuracion guardada. Activando monitoreo...' })
  } catch (err) {
    console.error('[Monitoreo Configure] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
