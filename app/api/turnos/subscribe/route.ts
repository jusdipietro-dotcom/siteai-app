import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { TURNOS_PLANS } from '@/lib/turnos-plans'
import { isUserFreeAccount } from '@/lib/free-account'
import { getTrialEndDate, expireStaleTrials, hasUsedTrial } from '@/lib/trial'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`turnos-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      plan, slug, businessName, businessType, practiceAreas,
      scheduleDays, scheduleSlots, slotDuration,
      colorPrimary, colorAccent, phone, address,
      notificationEmail, payerEmail, couponCode,
    } = body

    const planConfig = TURNOS_PLANS[plan as keyof typeof TURNOS_PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    // Validate slug
    const normalizedSlug = (slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!normalizedSlug || normalizedSlug.length < 3 || normalizedSlug.length > 60) {
      return NextResponse.json({ error: 'Slug invalido (3-60 caracteres, solo letras, numeros y guiones)' }, { status: 400 })
    }
    if (!businessName || businessName.trim().length < 3) {
      return NextResponse.json({ error: 'Nombre del negocio invalido' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!notificationEmail || !emailRegex.test(notificationEmail)) {
      return NextResponse.json({ error: 'Email de notificaciones invalido' }, { status: 400 })
    }
    if (!payerEmail || !emailRegex.test(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturacion invalido' }, { status: 400 })
    }

    // Validate practice areas limit
    const areas = Array.isArray(practiceAreas) ? practiceAreas : []
    if (areas.length > planConfig.maxAreas && planConfig.maxAreas < 999) {
      return NextResponse.json({ error: `El plan ${planConfig.name} permite hasta ${planConfig.maxAreas} areas` }, { status: 400 })
    }

    // Validate schedule days against plan (L-V vs L-S)
    if (Array.isArray(scheduleDays)) {
      const allowedDays = planConfig.diasPermitidos === 'L-S' ? [1,2,3,4,5,6] : [1,2,3,4,5]
      const invalidDays = scheduleDays.filter((d: number) => !allowedDays.includes(d))
      if (invalidDays.length > 0) {
        return NextResponse.json({ error: `El plan ${planConfig.name} permite dias ${planConfig.diasPermitidos}` }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Make stored trial status truthful first, so 'trial' below can only mean
      // a trial that is still running. Without this an expired trial counts
      // against the plan limit and can lock the user out of paying.
      await expireStaleTrials(tx.turnosSubscription, session.user.id)

      // Check existing active subscriptions against plan limit (maxProfesionales)
      const activeSubs = await tx.turnosSubscription.count({
        where: { userId: session.user.id, status: { in: ['active', 'provisioning', 'pending_config', 'trial'] } },
      })
      if (activeSubs >= planConfig.maxProfesionales) {
        return {
          error: activeSubs === 1
            ? 'Ya tenes una agenda activa de Turnos Online. Actualiza al plan Estudio para agregar mas profesionales.'
            : `Ya tenes ${activeSubs} agendas activas (maximo ${planConfig.maxProfesionales} para plan ${planConfig.name}).`,
          status: 409,
        } as const
      }

      // Check slug uniqueness
      const slugTaken = await tx.turnosSubscription.findUnique({ where: { slug: normalizedSlug } })
      if (slugTaken) {
        return { error: 'Ese slug ya esta en uso. Elegir otro.', status: 409 } as const
      }

      // Cancel stale pending
      await tx.turnosSubscription.updateMany({
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

      const subscription = await tx.turnosSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          slug: normalizedSlug,
          businessName: businessName.trim(),
          businessType: businessType || 'Estudio Juridico',
          colorPrimary: colorPrimary || '#1a365d',
          colorAccent: colorAccent || '#c9a84c',
          scheduleDays: JSON.stringify(scheduleDays || []),
          scheduleSlots: JSON.stringify(scheduleSlots || {}),
          slotDuration: slotDuration || 30,
          practiceAreas: JSON.stringify(areas),
          holidays: JSON.stringify([]),
          phone: phone || '',
          address: address || '',
          notificationEmail: notificationEmail.toLowerCase(),
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
      await prisma.turnosSubscription.update({
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
      prisma.turnosSubscription,
      session.user.id,
      subscription.id
    )
    // First time → 3-day trial (no payment needed)
    if (!usedTrial) {
      await prisma.turnosSubscription.update({
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
      slug: subscription.slug,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Turnos Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
