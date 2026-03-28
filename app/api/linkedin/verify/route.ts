import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

/**
 * GET /api/linkedin/verify?chatId=123456
 *
 * Called by the Telegram bot (from n8n) to verify if a chatId has an active subscription.
 * Protected by SCRAPER_API_KEY (same pattern as other internal APIs).
 *
 * Returns: { active: boolean, plan: string, postsPerMonth: number, postsGenerated: number }
 */

const PLAN_LIMITS: Record<string, number> = {
  basico: 20,
  profesional: 60,
  agencia: 200,
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get('apiKey') ?? req.headers.get('x-api-key')
  if (!apiKey || !process.env.SCRAPER_API_KEY || !safeCompare(apiKey, process.env.SCRAPER_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chatId = req.nextUrl.searchParams.get('chatId')
  const email = req.nextUrl.searchParams.get('email')

  // Search by email — used by /vincular command to find unlinked subscriptions
  if (email) {
    const sub = await prisma.linkedInSubscription.findFirst({
      where: {
        status: 'active',
        user: { email: email.toLowerCase() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!sub) {
      return NextResponse.json({ active: false, subscriptionId: null, plan: null })
    }

    return NextResponse.json({
      active: true,
      subscriptionId: sub.id,
      plan: sub.plan,
      alreadyLinked: !!sub.telegramChatId,
    })
  }

  if (!chatId) {
    return NextResponse.json({ error: 'chatId or email required' }, { status: 400 })
  }

  const sub = await prisma.linkedInSubscription.findFirst({
    where: {
      telegramChatId: chatId,
      status: 'active',
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!sub) {
    return NextResponse.json({
      active: false,
      plan: null,
      postsPerMonth: 0,
      postsGenerated: 0,
    })
  }

  // Monthly counter reset: if the current month differs from last reset, reset counter
  const now = new Date()
  const updatedMonth = sub.updatedAt.getMonth()
  const updatedYear = sub.updatedAt.getFullYear()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let postsGenerated = sub.postsGenerated
  if (currentYear > updatedYear || currentMonth > updatedMonth) {
    // New month — reset counters
    await prisma.linkedInSubscription.update({
      where: { id: sub.id },
      data: { postsGenerated: 0, postsPublished: 0 },
    })
    postsGenerated = 0
  }

  return NextResponse.json({
    active: true,
    plan: sub.plan,
    postsPerMonth: PLAN_LIMITS[sub.plan] ?? 20,
    postsGenerated,
    subscriptionId: sub.id,
  })
}

/**
 * POST /api/linkedin/verify
 *
 * Called by the bot to link a chatId to a subscription, or to increment post counters.
 * Body: { action: 'link', chatId: '123', subscriptionId: 'xxx' }
 *    or { action: 'increment', chatId: '123', type: 'generated' | 'published' }
 */
export async function POST(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get('apiKey') ?? req.headers.get('x-api-key')
  if (!apiKey || !process.env.SCRAPER_API_KEY || !safeCompare(apiKey, process.env.SCRAPER_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action, chatId } = body

  if (action === 'link') {
    const { subscriptionId } = body
    if (!chatId || !subscriptionId) {
      return NextResponse.json({ error: 'chatId and subscriptionId required' }, { status: 400 })
    }

    await prisma.linkedInSubscription.update({
      where: { id: subscriptionId },
      data: { telegramChatId: chatId },
    })

    return NextResponse.json({ linked: true })
  }

  if (action === 'increment') {
    const { type } = body // 'generated' or 'published'
    if (!chatId || !type) {
      return NextResponse.json({ error: 'chatId and type required' }, { status: 400 })
    }

    const sub = await prisma.linkedInSubscription.findFirst({
      where: { telegramChatId: chatId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    if (!sub) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    const data: Record<string, { increment: number }> = {}
    if (type === 'generated') data.postsGenerated = { increment: 1 }
    if (type === 'published') data.postsPublished = { increment: 1 }

    await prisma.linkedInSubscription.update({
      where: { id: sub.id },
      data,
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
