import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptCredentials } from '@/lib/encryption'

/**
 * POST /api/causas/configure
 * Updates a pending_config causas subscription with MEV credentials and departamento,
 * then transitions it to 'provisioning' so the provisioning flow can activate it.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, mevUser, mevPass, dptoId, dptoNombre } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    // Validate fields
    if (!mevUser || mevUser.trim().length < 2) {
      return NextResponse.json({ error: 'Usuario MEV invalido' }, { status: 400 })
    }
    if (!mevPass || mevPass.length < 4) {
      return NextResponse.json({ error: 'Contrasena MEV invalida' }, { status: 400 })
    }
    if (!dptoId) {
      return NextResponse.json({ error: 'Departamento judicial requerido' }, { status: 400 })
    }

    // Find the subscription — must belong to this user and be pending_config
    const sub = await prisma.causasSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        status: 'pending_config',
      },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada o no esta pendiente de configuracion' }, { status: 404 })
    }

    // Encrypt MEV credentials
    const encrypted = encryptCredentials(mevUser.trim(), mevPass)

    // Update with credentials and departamento, transition to provisioning
    await prisma.causasSubscription.update({
      where: { id: subscriptionId },
      data: {
        mevUser: encrypted.credentialUser,
        mevPass: encrypted.credentialPass,
        mevIv: encrypted.credentialIv,
        mevTag: encrypted.credentialTag,
        dptoId,
        dptoNombre: dptoNombre || '',
        dptoTipo: 'CC',
        status: 'provisioning',
      },
    })

    console.log(`[Causas Configure] Subscription ${subscriptionId} configured -> provisioning`)

    return NextResponse.json({ status: 'provisioning', message: 'Configuracion guardada. Activando servicio...' })
  } catch (err) {
    console.error('[Causas Configure] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
