import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { decryptCredentials } from '@/lib/encryption'
import { SCRAPER_REGISTER_TIMEOUT_MS } from '@/lib/fetch-timeouts'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Internal provisioning endpoint for causas scraper.
 * Called by webhook after payment confirmation.
 * Registers the tenant in the scraper service and triggers first scrape.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify internal secret
    const secret = req.headers.get('x-portal-secret')
    const expected = process.env.CAUSAS_SCRAPER_API_KEY
    if (!expected || !secret || !safeCompare(secret, expected)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }

    const sub = await prisma.causasSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }

    // Decrypt MEV credentials
    const creds = decryptCredentials({
      credentialUser: sub.mevUser,
      credentialPass: sub.mevPass,
      credentialIv: sub.mevIv,
      credentialTag: sub.mevTag,
    })

    // Register tenant in scraper service
    const scraperUrl = process.env.CAUSAS_SCRAPER_URL
    const scraperKey = process.env.CAUSAS_SCRAPER_API_KEY
    if (!scraperUrl || !scraperKey) {
      return NextResponse.json({ error: 'Scraper no configurado' }, { status: 503 })
    }

    const scraperResp = await fetch(`${scraperUrl}/api/tenant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${scraperKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: sub.id,
        mevUser: creds.username,
        mevPass: creds.password,
        dptoTipo: sub.dptoTipo,
        dptoId: sub.dptoId,
        plan: sub.plan,
        scrapeFrequency: sub.scrapeFrequency,
        notificationEmail: sub.notificationEmail,
        userEmail: sub.user.email,
        userName: sub.user.name,
      }),
      signal: AbortSignal.timeout(SCRAPER_REGISTER_TIMEOUT_MS),
    })

    if (!scraperResp.ok) {
      const errText = await scraperResp.text()
      console.error('[Causas Provision] Scraper error:', errText)
      return NextResponse.json({ error: 'Error registrando tenant en scraper' }, { status: 502 })
    }

    const scraperData = await scraperResp.json()

    // Update subscription
    await prisma.causasSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        scraperTenantId: scraperData.tenantId || sub.id,
        provisionedAt: new Date(),
      },
    })

    return NextResponse.json({
      status: 'provisioned',
      scraperTenantId: scraperData.tenantId || sub.id,
    })
  } catch (err) {
    console.error('[Causas Provision] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
