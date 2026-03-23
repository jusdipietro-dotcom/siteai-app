import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PROVISIONING_SECRET = process.env.SCRAPER_API_KEY

function authenticateRequest(req: NextRequest): boolean {
  // Prefer header auth over query params (query params leak in logs)
  const apiKey = req.headers.get('x-api-key')
    || req.nextUrl.searchParams.get('apiKey')
  if (!PROVISIONING_SECRET) {
    console.error('[Trading Provision] SCRAPER_API_KEY not configured')
    return false
  }
  return apiKey === PROVISIONING_SECRET
}

/**
 * GET /api/trading/provision/[id]?apiKey=...
 * Returns subscription data for the trading bot to validate
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sub = await prisma.tradingSubscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (!['provisioning', 'active'].includes(sub.status)) {
      return NextResponse.json({ error: `Cannot provision subscription with status: ${sub.status}` }, { status: 403 })
    }

    return NextResponse.json({
      subscriptionId: sub.id,
      userId: sub.userId,
      userName: sub.user.name,
      userEmail: sub.user.email,
      status: sub.status,
      plan: sub.plan,
      symbols: sub.symbols,
      timeframe: sub.timeframe,
      telegramChatId: sub.telegramChatId,
      notificationEmail: sub.notificationEmail,
      payerEmail: sub.payerEmail,
      signalsSent: sub.signalsSent,
      provisionedAt: sub.provisionedAt,
    })
  } catch (err) {
    console.error('[Trading Provision GET] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/trading/provision/[id]?apiKey=...
 * Body: { action: 'activate', telegramChatId: '...' }
 *    or { action: 'suspend' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, telegramChatId } = body

    const sub = await prisma.tradingSubscription.findUnique({
      where: { id: params.id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (action === 'activate') {
      if (!telegramChatId) {
        return NextResponse.json({ error: 'telegramChatId required for activation' }, { status: 400 })
      }

      // Atomic: only activate if still in provisioning state
      const { count } = await prisma.tradingSubscription.updateMany({
        where: { id: params.id, status: 'provisioning' },
        data: {
          status: 'active',
          telegramChatId,
          provisionedAt: new Date(),
        },
      })

      if (count === 0) {
        return NextResponse.json({ error: `Cannot activate subscription with status: ${sub.status}` }, { status: 400 })
      }

      console.log(`[Trading Provision] Subscription ${params.id} activated — telegramChatId: ${telegramChatId}`)
      return NextResponse.json({ status: 'active', telegramChatId })
    }

    if (action === 'suspend') {
      await prisma.tradingSubscription.update({
        where: { id: params.id },
        data: { status: 'suspended' },
      })

      console.log(`[Trading Provision] Subscription ${params.id} suspended`)
      return NextResponse.json({ status: 'suspended' })
    }

    return NextResponse.json({ error: 'Invalid action. Use: activate, suspend' }, { status: 400 })
  } catch (err) {
    console.error('[Trading Provision PATCH] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
