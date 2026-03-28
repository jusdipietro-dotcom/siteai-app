import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

const FLASK_PROVISION_SECRET = process.env.FLASK_PROVISION_SECRET

/**
 * Generate a short-lived JWT token for SSO into the Flask facturacion backend.
 * The Flask backend validates this token and creates a session.
 */
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

    const sub = await prisma.facturacionSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
        status: 'active',
      },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción activa no encontrada' }, { status: 404 })
    }

    if (!sub.flaskTenantId) {
      return NextResponse.json({ error: 'La suscripción no está provisionada aún' }, { status: 400 })
    }

    if (!FLASK_PROVISION_SECRET) {
      return NextResponse.json({ error: 'Sistema de facturación no configurado' }, { status: 503 })
    }

    // Generate short-lived JWT (5 minutes) for Flask SSO
    const secret = new TextEncoder().encode(FLASK_PROVISION_SECRET)
    const ssoToken = await new SignJWT({
      sub: session.user.id,
      email: sub.flaskUserEmail || session.user.email,
      tenantId: sub.flaskTenantId,
      plan: sub.plan,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .setIssuer('automaticialab-portal')
      .sign(secret)

    return NextResponse.json({ ssoToken })
  } catch (err) {
    console.error('[Facturacion SSO Token] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
