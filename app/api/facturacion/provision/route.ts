import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { FLASK_BACKEND_TIMEOUT_MS } from '@/lib/fetch-timeouts'

const FLASK_BACKEND_URL = process.env.FLASK_BACKEND_URL
const FLASK_PROVISION_SECRET = process.env.FLASK_PROVISION_SECRET

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Provision a facturacion subscription by creating a tenant in the Flask backend.
 * Called internally after payment confirmation (from webhook trigger).
 * Also accepts PATCH from Flask callback to confirm provisioning.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth: only internal calls with provision secret
    const secret = req.headers.get('x-portal-secret')
    if (!FLASK_PROVISION_SECRET || !secret || !safeCompare(secret, FLASK_PROVISION_SECRET)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.facturacionSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }

    if (sub.status !== 'provisioning') {
      return NextResponse.json({ error: `Estado inválido: ${sub.status}` }, { status: 400 })
    }

    if (!FLASK_BACKEND_URL) {
      console.error('[Facturacion Provision] FLASK_BACKEND_URL not configured')
      return NextResponse.json({ error: 'Backend de facturación no configurado' }, { status: 503 })
    }

    // Create tenant in Flask backend
    const provisionRes = await fetch(`${FLASK_BACKEND_URL}/auth/portal-provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-Secret': FLASK_PROVISION_SECRET,
      },
      body: JSON.stringify({
        cuit: sub.cuit,
        razonSocial: sub.razonSocial,
        puntoVenta: sub.puntoVenta,
        condicionIva: sub.condicionIva,
        email: sub.user.email,
        nombre: sub.user.name || sub.razonSocial,
        plan: sub.plan,
      }),
      signal: AbortSignal.timeout(FLASK_BACKEND_TIMEOUT_MS),
    })

    if (!provisionRes.ok) {
      const errData = await provisionRes.json().catch(() => ({}))
      console.error('[Facturacion Provision] Flask error:', provisionRes.status, errData)
      return NextResponse.json({ error: 'Error al crear tenant en backend de facturación' }, { status: 502 })
    }

    const flaskData = await provisionRes.json()

    // Update subscription with Flask tenant info
    await prisma.facturacionSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        flaskTenantId: flaskData.tenantId,
        flaskUserEmail: flaskData.userEmail || sub.user.email,
        provisionedAt: new Date(),
      },
    })

    console.log(`[Facturacion Provision] Subscription ${subscriptionId} → active (Flask tenant: ${flaskData.tenantId})`)

    return NextResponse.json({
      status: 'active',
      flaskTenantId: flaskData.tenantId,
    })
  } catch (err) {
    console.error('[Facturacion Provision] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
