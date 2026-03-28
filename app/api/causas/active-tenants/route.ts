import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { decryptCredentials } from '@/lib/encryption'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Returns active causas tenants for the scraper service.
 * Authenticated with API key (not user session).
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '')
    const expected = process.env.CAUSAS_SCRAPER_API_KEY
    if (!expected || !apiKey || !safeCompare(apiKey, expected)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const activeSubs = await prisma.causasSubscription.findMany({
      where: { status: 'active' },
      include: { user: { select: { email: true, name: true } } },
    })

    const tenants = activeSubs.map((sub) => {
      const creds = decryptCredentials({
        credentialUser: sub.mevUser,
        credentialPass: sub.mevPass,
        credentialIv: sub.mevIv,
        credentialTag: sub.mevTag,
      })

      return {
        tenantId: sub.scraperTenantId || sub.id,
        subscriptionId: sub.id,
        plan: sub.plan,
        mevUser: creds.username,
        mevPass: creds.password,
        dptoTipo: sub.dptoTipo,
        dptoId: sub.dptoId,
        scrapeFrequency: sub.scrapeFrequency,
        notificationEmail: sub.notificationEmail,
        userEmail: sub.user.email,
        userName: sub.user.name,
        lastScrapeAt: sub.lastScrapeAt,
      }
    })

    return NextResponse.json({ tenants })
  } catch (err) {
    console.error('[Causas Active Tenants] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
