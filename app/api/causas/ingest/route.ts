import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCausasPlanConfig } from '@/lib/causas-plans'

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Receives scraped cases from the causas-scraper service.
 * Authenticated with API key. Upserts cases for the subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '')
    const expected = process.env.CAUSAS_SCRAPER_API_KEY
    if (!expected || !apiKey || !safeCompare(apiKey, expected)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, cases } = await req.json()
    if (!subscriptionId || !Array.isArray(cases)) {
      return NextResponse.json({ error: 'subscriptionId and cases[] required' }, { status: 400 })
    }

    // Verify subscription exists and is active
    const sub = await prisma.causasSubscription.findFirst({
      where: { id: subscriptionId, status: 'active' },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found or inactive' }, { status: 404 })
    }

    // Enforce maxCausas limit per plan
    const planConfig = getCausasPlanConfig(sub.plan)
    const maxCausas = planConfig?.maxCausas ?? 30
    const currentCount = await prisma.causasCase.count({ where: { subscriptionId } })
    const newCaseIds = new Set(
      cases.filter((c: { nidCausa?: string }) => c.nidCausa).map((c: { nidCausa: string }) => String(c.nidCausa))
    )
    // Count how many of the incoming cases are truly new (not updates)
    const existingCases = await prisma.causasCase.findMany({
      where: { subscriptionId, nidCausa: { in: [...newCaseIds] } },
      select: { nidCausa: true },
    })
    const existingIds = new Set(existingCases.map((c) => c.nidCausa))
    const trulyNewCount = [...newCaseIds].filter((id) => !existingIds.has(id)).length
    if (maxCausas < 999999 && currentCount + trulyNewCount > maxCausas) {
      return NextResponse.json({
        error: `Plan ${sub.plan} permite hasta ${maxCausas} causas. Actualmente: ${currentCount}, intentando agregar ${trulyNewCount} nuevas.`,
        currentCount,
        maxCausas,
      }, { status: 403 })
    }

    // Upsert each case
    let upserted = 0
    for (const c of cases) {
      if (!c.nidCausa) continue

      await prisma.causasCase.upsert({
        where: {
          subscriptionId_nidCausa: {
            subscriptionId,
            nidCausa: String(c.nidCausa),
          },
        },
        create: {
          subscriptionId,
          caratula: c.caratula || '',
          nroExpediente: c.nroExpediente || '',
          estado: c.estado || '',
          courtName: c.courtName || '',
          setName: c.setName || '',
          pidJuzgado: c.pidJuzgado || '',
          nidCausa: String(c.nidCausa),
          fechaInicio: c.fechaInicio || '',
          movimientos: JSON.stringify(c.movimientos || []),
          totalMovimientos: c.totalMovimientos || (c.movimientos?.length ?? 0),
          scrapedAt: c.scrapedAt ? new Date(c.scrapedAt) : new Date(),
        },
        update: {
          caratula: c.caratula || undefined,
          nroExpediente: c.nroExpediente || undefined,
          estado: c.estado || undefined,
          courtName: c.courtName || undefined,
          movimientos: JSON.stringify(c.movimientos || []),
          totalMovimientos: c.totalMovimientos || (c.movimientos?.length ?? 0),
          scrapedAt: c.scrapedAt ? new Date(c.scrapedAt) : new Date(),
        },
      })
      upserted++
    }

    // Update subscription stats
    const totalCases = await prisma.causasCase.count({ where: { subscriptionId } })
    await prisma.causasSubscription.update({
      where: { id: subscriptionId },
      data: {
        totalCausas: totalCases,
        lastScrapeAt: new Date(),
      },
    })

    return NextResponse.json({ upserted, totalCases })
  } catch (err) {
    console.error('[Causas Ingest] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
