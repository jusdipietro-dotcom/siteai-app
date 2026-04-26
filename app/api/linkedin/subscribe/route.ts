import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isUserFreeAccount } from '@/lib/free-account'
import { isValidEmail } from '@/lib/validators'
import { getTrialEndDate } from '@/lib/trial'
import { LINKEDIN_PLANS } from '@/lib/linkedin-plans'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`linkedin-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, linkedinName, industry, audience, notificationEmail, payerEmail, couponCode } = body

    const planConfig = LINKEDIN_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    if (!industry?.trim()) {
      return NextResponse.json({ error: 'Industria requerida' }, { status: 400 })
    }
    if (!audience?.trim()) {
      return NextResponse.json({ error: 'Publico objetivo requerido' }, { status: 400 })
    }
    if (!isValidEmail(notificationEmail)) {
      return NextResponse.json({ error: 'Email de notificaciones invalido' }, { status: 400 })
    }
    if (!isValidEmail(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturacion invalido' }, { status: 400 })
    }

    // Check existing active subscriptions
    const activeSubs = await prisma.linkedInSubscription.count({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] },
      },
    })
    if (activeSubs >= planConfig.maxProfiles) {
      return NextResponse.json(
        { error: `El plan ${planConfig.title} permite hasta ${planConfig.maxProfiles} perfil${planConfig.maxProfiles > 1 ? 'es' : ''}. Podes cambiar a un plan superior.` },
        { status: 400 }
      )
    }

    // Cancel stale pending_payment records
    await prisma.linkedInSubscription.updateMany({
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

    const subscription = await prisma.linkedInSubscription.create({
      data: {
        userId: session.user.id,
        plan,
        linkedinName: linkedinName?.trim() || null,
        industry: industry.trim(),
        audience: audience.trim(),
        notificationEmail: notificationEmail.toLowerCase().trim(),
        payerEmail: payerEmail.toLowerCase().trim(),
        couponId,
        discountApplied,
      },
    })

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.linkedInSubscription.update({
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

    // Trial: check if user already used trial for this service
    const previousSub = await prisma.linkedInSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['cancelled', 'suspended', 'trial_expired'] },
      },
    })
    // First time → 3-day trial (no payment needed)
    if (!previousSub) {
      await prisma.linkedInSubscription.update({
        where: { id: subscription.id },
        data: { status: 'trial', trialEndsAt: getTrialEndDate() },
      })
      return NextResponse.json({
        subscriptionId: subscription.id,
        plan,
        status: 'trial',
        trialEndsAt: getTrialEndDate().toISOString(),
        nextStep: 'trial_started',
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
    console.error('[LinkedIn Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
