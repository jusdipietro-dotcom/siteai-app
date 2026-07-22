import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isUserFreeAccount } from '@/lib/free-account'
import { getTrialEndDate, expireStaleTrials, hasUsedTrial } from '@/lib/trial'
import { LEXPOST_PLANS as LEXPOST_PLANS_RAW, isLexpostPlanId, type LexpostPlanId } from '@/lib/lexpost-plans'

// Adapter: keep legacy field names (limit, accounts) used by this endpoint.
const LEXPOST_PLANS = Object.fromEntries(
  Object.entries(LEXPOST_PLANS_RAW).map(([k, v]) => [k, {
    monthly: v.monthly,
    title: v.title,
    limit: v.publicationsLimit,
    accounts: v.igAccountCount,
  }])
) as Record<LexpostPlanId, { monthly: number; title: string; limit: number; accounts: number }>

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`lexpost-sub:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, notificationEmail, payerEmail, igUsername, couponCode } = body

    // Membership check first: the adapter map is a plain object, so indexing it
    // with an unvalidated body value would resolve 'toString' through
    // Object.prototype and return a truthy function.
    const planConfig = isLexpostPlanId(plan) ? LEXPOST_PLANS[plan] : undefined
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!notificationEmail || !emailRegex.test(notificationEmail)) {
      return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Make stored trial status truthful first, so 'trial' below can only mean
      // a trial that is still running. Without this an expired trial blocks the
      // user from subscribing at all — no access and no way to pay.
      await expireStaleTrials(tx.lexPostSubscription, session.user.id)

      // Check existing active subscription
      const existing = await tx.lexPostSubscription.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ['active', 'provisioning', 'trial'] },
        },
      })
      if (existing) {
        return { error: 'Ya tenes una suscripcion activa de LexPost', status: 409 } as const
      }

      // Cancel stale pending
      await tx.lexPostSubscription.updateMany({
        where: { userId: session.user.id, status: 'pending_payment' },
        data: { status: 'cancelled' },
      })

      // Validate coupon
      let couponId: string | null = null
      let discountApplied = 0

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
        if (!coupon || !coupon.active) {
          return { error: 'Cupon invalido', status: 400 } as const
        }
        if (coupon.usedCount >= coupon.maxUses) {
          return { error: 'Cupon agotado', status: 400 } as const
        }
        const now = new Date()
        if (now < coupon.validFrom || now > coupon.validUntil) {
          return { error: 'Cupon expirado', status: 400 } as const
        }
        couponId = coupon.id
        discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
      }

      const subscription = await tx.lexPostSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          igUsername: igUsername || null,
          igAccountCount: planConfig.accounts,
          publicationsLimit: planConfig.limit,
          notificationEmail: notificationEmail.toLowerCase(),
          payerEmail: (payerEmail || notificationEmail).toLowerCase(),
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

    // Free account bypass
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.lexPostSubscription.update({
        where: { id: subscription.id },
        data: { status: 'active', discountApplied: 100, provisionedAt: new Date() },
      })
      return NextResponse.json({
        freeActivation: true,
        subscription: { ...subscription, status: 'active' },
      })
    }

    // Trial for first-time users. Any prior row counts — this check previously
    // looked only at ['cancelled','suspended'], so a user whose trial had
    // expired ('trial_expired', or still literally 'trial') was handed a brand
    // new trial on every attempt.
    const usedTrial = await hasUsedTrial(
      prisma.lexPostSubscription,
      session.user.id,
      subscription.id
    )
    if (!usedTrial) {
      await prisma.lexPostSubscription.update({
        where: { id: subscription.id },
        data: { status: 'trial', trialEndsAt: getTrialEndDate() },
      })
      return NextResponse.json({
        freeActivation: true,
        subscription: { ...subscription, status: 'trial', trialEndsAt: getTrialEndDate() },
      })
    }

    // Full 100% coupon → free
    if (discountApplied >= 100) {
      await prisma.lexPostSubscription.update({
        where: { id: subscription.id },
        data: { status: 'active', provisionedAt: new Date() },
      })
      return NextResponse.json({
        freeActivation: true,
        subscription: { ...subscription, status: 'active' },
      })
    }

    // Payment required — frontend should call /api/mp/create-lexpost-subscription
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
    console.error('[LexPost Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
