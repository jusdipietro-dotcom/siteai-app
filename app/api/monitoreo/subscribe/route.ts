import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptPortalCredentials } from '@/lib/encryption'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isUserFreeAccount } from '@/lib/free-account'
import { getTrialEndDate, expireStaleTrials, hasUsedTrial } from '@/lib/trial'
import { MONITOREO_PLANS as MONITORING_PLANS } from '@/lib/monitoreo-plans'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 subscriptions per 10 minutes per IP
    const ip = getClientIp(req)
    const rl = checkRateLimit(`subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, portal, cuil, pjnUser, pjnPass, scbaUser, scbaPass, notificationEmail, payerEmail, couponCode } = body

    // Validate plan
    const planConfig = MONITORING_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate required fields
    if (!portal || !['PJN', 'SCBA', 'AMBOS'].includes(portal)) {
      return NextResponse.json({ error: 'Portal inválido. Opciones: PJN, SCBA, AMBOS' }, { status: 400 })
    }
    if (!cuil || !/^\d{2}-?\d{7,8}-?\d$/.test(cuil.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 })
    }
    // Validate per-portal credentials
    if ((portal === 'PJN' || portal === 'AMBOS') && (!pjnUser || !pjnPass)) {
      return NextResponse.json({ error: 'Las credenciales de PJN son obligatorias' }, { status: 400 })
    }
    if ((portal === 'SCBA' || portal === 'AMBOS') && (!scbaUser || !scbaPass)) {
      return NextResponse.json({ error: 'Las credenciales de SCBA son obligatorias' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!notificationEmail || !emailRegex.test(notificationEmail) || notificationEmail.length > 254) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail || !emailRegex.test(payerEmail) || payerEmail.length > 254) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    const normalizedCuil = cuil.replace(/[-\s]/g, '')

    // Encrypt credentials (per-portal) — outside transaction (CPU-bound)
    const encrypted = encryptPortalCredentials({
      pjnUser: (portal === 'PJN' || portal === 'AMBOS') ? pjnUser : undefined,
      pjnPass: (portal === 'PJN' || portal === 'AMBOS') ? pjnPass : undefined,
      scbaUser: (portal === 'SCBA' || portal === 'AMBOS') ? scbaUser : undefined,
      scbaPass: (portal === 'SCBA' || portal === 'AMBOS') ? scbaPass : undefined,
    })

    // Atomic transaction: check + cancel stale + validate coupon + create
    const result = await prisma.$transaction(async (tx) => {
      // Make stored trial status truthful first, so every 'trial' below can
      // only mean a trial that is still running. Scoped to the user, not the
      // CUIL: an expired trial is expired whichever CUIL it was opened for.
      await expireStaleTrials(tx.monitoringSubscription, session.user.id)

      // Check existing active subscription for same CUIT
      const existing = await tx.monitoringSubscription.findFirst({
        where: {
          userId: session.user.id,
          cuil: normalizedCuil,
          status: { in: ['active', 'provisioning', 'trial'] },
        },
      })
      if (existing) {
        return { error: 'Ya tenés una suscripción activa para este CUIT', status: 409 } as const
      }

      // Enforce max CUITs per plan (exclude pending_payment to avoid lockout from abandoned flows)
      const activeSubs = await tx.monitoringSubscription.count({
        where: {
          userId: session.user.id,
          status: { in: ['active', 'provisioning', 'trial'] },
        },
      })
      if (activeSubs >= planConfig.maxCuils) {
        return {
          error: `El plan ${planConfig.title} permite hasta ${planConfig.maxCuils} CUIT${planConfig.maxCuils > 1 ? 's' : ''}. Podés cambiar a un plan superior para agregar más.`,
          status: 400,
        } as const
      }

      // Auto-cancel stale pending_payment records for the same CUIT
      await tx.monitoringSubscription.updateMany({
        where: {
          userId: session.user.id,
          cuil: normalizedCuil,
          status: 'pending_payment',
        },
        data: { status: 'cancelled' },
      })

      // Validate coupon if provided
      let couponId: string | null = null
      let discountApplied = 0

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
        if (!coupon || !coupon.active) {
          return { error: 'Cupón inválido o expirado', status: 400 } as const
        }
        if (coupon.usedCount >= coupon.maxUses) {
          return { error: 'Cupón agotado', status: 400 } as const
        }
        const now = new Date()
        if (now < coupon.validFrom || now > coupon.validUntil) {
          return { error: 'Cupón fuera del período de validez', status: 400 } as const
        }
        couponId = coupon.id
        discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
      }

      // Create subscription
      const subscription = await tx.monitoringSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          portal,
          cuil: normalizedCuil,
          ...encrypted,
          notificationEmail: notificationEmail.toLowerCase(),
          payerEmail: payerEmail.toLowerCase(),
          couponId,
          discountApplied,
        },
      })

      return { subscription, discountApplied }
    })

    // Handle transaction result
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { subscription, discountApplied } = result

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.monitoringSubscription.update({
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

    // Separate question: has this user ever subscribed before? Any prior row
    // means the trial is spent — they continue to payment instead.
    const usedTrial = await hasUsedTrial(
      prisma.monitoringSubscription,
      session.user.id,
      subscription.id
    )
    // First time → 3-day trial (no payment needed)
    if (!usedTrial) {
      await prisma.monitoringSubscription.update({
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

    // Calculate final price
    const finalPrice = Math.round(planConfig.monthly * (1 - discountApplied / 100))

    return NextResponse.json({
      subscriptionId: subscription.id,
      plan,
      portal,
      cuil: subscription.cuil,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment', // Frontend should redirect to payment
    })
  } catch (err) {
    console.error('[Monitoreo Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
