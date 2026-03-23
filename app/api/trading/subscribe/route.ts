import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const TRADING_PLANS: Record<string, { monthly: number; title: string; maxPairs: number; reportes: boolean }> = {
  basico:      { monthly: 20000, title: 'Señales Crypto IA Básico',      maxPairs: 30, reportes: false },
  profesional: { monthly: 35000, title: 'Señales Crypto IA Profesional', maxPairs: 30, reportes: true },
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`trading-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, notificationEmail, payerEmail, couponCode } = body

    // Validate plan
    const planConfig = TRADING_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate emails
    if (!notificationEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // Cancel ALL stale pending_payment records for this user
    // This prevents orphaned pending_payment records from accumulating
    await prisma.tradingSubscription.updateMany({
      where: {
        userId: session.user.id,
        status: 'pending_payment',
      },
      data: { status: 'cancelled' },
    })

    // Check existing active subscription
    const existing = await prisma.tradingSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tenés una suscripción de Trading activa. Cancelá la actual para cambiar de plan.' },
        { status: 409 }
      )
    }

    // Validate coupon
    let couponId: string | null = null
    let discountApplied = 0

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
      }
      const now = new Date()
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ error: 'Cupón fuera del período de validez' }, { status: 400 })
      }
      couponId = coupon.id
      discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
    }

    const subscription = await prisma.tradingSubscription.create({
      data: {
        userId: session.user.id,
        plan,
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
