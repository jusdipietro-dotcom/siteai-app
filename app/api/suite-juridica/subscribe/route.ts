import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { SUITE_JURIDICA_PLANS } from '@/lib/suite-juridica-plans'
import { isUserFreeAccount } from '@/lib/free-account'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`suite-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, payerEmail, couponCode } = body

    const planConfig = SUITE_JURIDICA_PLANS[plan as keyof typeof SUITE_JURIDICA_PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!payerEmail || !emailRegex.test(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturacion invalido' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check existing active suite subscription
      const existing = await tx.suiteJuridicaSubscription.findFirst({
        where: { userId: session.user.id, status: { in: ['active', 'provisioning'] } },
      })
      if (existing) {
        return { error: 'Ya tenes una Suite Juridica activa', status: 409 } as const
      }

      // Cancel stale pending
      await tx.suiteJuridicaSubscription.updateMany({
        where: { userId: session.user.id, status: 'pending_payment' },
        data: { status: 'cancelled' },
      })

      // Validate coupon
      let couponId: string | null = null
      let discountApplied = 0
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
        if (!coupon || !coupon.active) return { error: 'Cupon invalido o expirado', status: 400 } as const
        if (coupon.usedCount >= coupon.maxUses) return { error: 'Cupon agotado', status: 400 } as const
        const now = new Date()
        if (now < coupon.validFrom || now > coupon.validUntil) return { error: 'Cupon fuera del periodo de validez', status: 400 } as const
        couponId = coupon.id
        discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
      }

      const subscription = await tx.suiteJuridicaSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          payerEmail: payerEmail.toLowerCase(),
          couponId,
          discountApplied,
        },
      })

      return { subscription, discountApplied }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { subscription, discountApplied } = result

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.suiteJuridicaSubscription.update({
        where: { id: subscription.id },
        data: { status: 'active', discountApplied: 100, provisionedAt: new Date() },
      })
      return NextResponse.json({
        subscriptionId: subscription.id,
        plan,
        status: 'active',
        nextStep: 'done',
        freeAccount: true,
      })
    }

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
    console.error('[Suite Juridica Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
