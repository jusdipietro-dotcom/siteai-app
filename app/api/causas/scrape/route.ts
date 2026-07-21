import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SCRAPER_CONTROL_TIMEOUT_MS } from '@/lib/fetch-timeouts'

/**
 * Trigger an on-demand scrape for the user's active subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const subscriptionId = body.subscriptionId

    const sub = subscriptionId
      ? await prisma.causasSubscription.findFirst({
          where: { id: subscriptionId, userId: session.user.id, status: 'active' },
        })
      : await prisma.causasSubscription.findFirst({
          where: { userId: session.user.id, status: 'active' },
          orderBy: { createdAt: 'desc' },
        })

    if (!sub) {
      return NextResponse.json({ error: 'No tenés una suscripción activa' }, { status: 404 })
    }

    // Rate limit: 1 manual scrape per 30 minutes
    if (sub.lastScrapeAt) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
      if (sub.lastScrapeAt > thirtyMinAgo) {
        const waitMinutes = Math.ceil((sub.lastScrapeAt.getTime() + 30 * 60 * 1000 - Date.now()) / 60000)
        return NextResponse.json({
          error: `Última sincronización muy reciente. Esperá ${waitMinutes} minuto${waitMinutes > 1 ? 's' : ''}.`,
        }, { status: 429 })
      }
    }

    // Trigger scrape via scraper service
    const scraperUrl = process.env.CAUSAS_SCRAPER_URL
    const scraperKey = process.env.CAUSAS_SCRAPER_API_KEY
    if (!scraperUrl || !scraperKey) {
      return NextResponse.json({ error: 'Scraper no configurado' }, { status: 503 })
    }

    const tenantId = sub.scraperTenantId || sub.id
    const resp = await fetch(`${scraperUrl}/api/tenant/${tenantId}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${scraperKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(SCRAPER_CONTROL_TIMEOUT_MS),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[Causas Scrape] Scraper error:', errText)
      return NextResponse.json({ error: 'Error iniciando sincronización' }, { status: 502 })
    }

    return NextResponse.json({ status: 'scraping', message: 'Sincronización iniciada. Los resultados estarán disponibles en unos minutos.' })
  } catch (err) {
    console.error('[Causas Scrape] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
