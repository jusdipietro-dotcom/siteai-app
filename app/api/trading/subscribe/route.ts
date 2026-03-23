import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const TRADING_PLANS: Record<string, { monthly: number; title: string; maxSymbols: number; timeframes: string[] }> = {
  basico:      { monthly: 15000, title: 'Trading Signals Basico',      maxSymbols: 5,  timeframes: ['1h'] },
  profesional: { monthly: 25000, title: 'Trading Signals Profesional', maxSymbols: 15, timeframes: ['15m', '1h', '4h'] },
  premium:     { monthly: 40000, title: 'Trading Signals Premium',     maxSymbols: 30, timeframes: ['15m', '1h', '4h', '1d'] },
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`trading-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, symbols, timeframe, telegramChatId, notificationEmail, payerEmail, couponCode } = body

    const planConfig = TRADING_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    if (!notificationEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones invalido' }, { status: 400 })
    }
    if (!payerEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de facturacion invalido' }, { status: 400 })
    }

    // Validate timeframe for plan
    if (timeframe && !planConfig.timeframes.includes(timeframe)) {
      return NextResponse.json({ error: `El plan ${planConfig.title} no incluye timeframe ${timeframe}` }, { status: 400 })
    }

    // Check existing active subscriptions
    const activeSubs = await prisma.tradingSubscription.count({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning', 'pending_payment'] },
      },
    })
    if (activeSubs >= 1) {
      return NextResponse.json(
        { error: 'Ya tenes una suscripcion de Trading activa. Cancela la actual para cambiar de plan.' },
        { status: 400 }
      )
    }

    // Cancel stale pending_payment records
    await prisma.tradingSubscription.updateMany({
      where: {
        userId: session.user.id,
        status: 'pending_payment',
      },
      data: { status: 'cancelled' },
    })

    // Validate coupon
    let couponId: string | null = null
    let discountApplied = 0

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: 'Cupon invalido o expirado' }, { status: 400 })
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Cupon agotado' }, { status: 400 })
      }
      const now = new Date()
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ error: 'Cupon fuera del periodo de validez' }, { status: 400 })
      }
      couponId = coupon.id
      discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
    }

    // Validate symbols count
    const symbolList = symbols?.trim() || 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT'
    const symbolCount = symbolList.split(',').length
    if (symbolCount > planConfig.maxSymbols) {
      return NextResponse.json(
        { error: `El plan ${planConfig.title} permite hasta ${planConfig.maxSymbols} pares. Enviaste ${symbolCount}.` },
        { status: 400 }
      )
    }

    const subscription = await prisma.tradingSubscription.create({
      data: {
        userId: session.user.id,
        plan,
        symbols: symbolList,
        timeframe: timeframe || '1h',
        telegramChatId: telegramChatId?.trim() || null,
        notificationEmail: notificationEmail.toLowerCase().trim(),
        payerEmail: payerEmail.toLowerCase().trim(),
        couponId,
        discountApplied,
      },
    })

    const finalPrice = Math.round(planConfig.monthly * (1 - discountApplied / 100))

    return NextResponse.json({
      subscriptionId: subscription.id,
      plan,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Trading Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
