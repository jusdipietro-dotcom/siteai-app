import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getPlanConfig as getProspeccionPlanConfig } from '@/lib/prospeccion-plans'
import { isUserFreeAccount } from '@/lib/free-account'
import { getTrialEndDate, expireStaleTrials, hasUsedTrial } from '@/lib/trial'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/.+/

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`prospeccion-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Per-user rate limit
    const rlUser = checkRateLimit(`prospeccion-subscribe:user:${session.user.id}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rlUser.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
    }
    const {
      plan, businessName, senderName, senderEmail, website,
      nichesList, citiesList, serviciosDesc, colorPrimario,
      notificationEmail, payerEmail, couponCode,
    } = body as {
      plan: string; businessName: string; senderName: string; senderEmail: string;
      website: string; nichesList?: string[]; citiesList?: string[];
      serviciosDesc?: string; colorPrimario?: string;
      notificationEmail: string; payerEmail: string; couponCode?: string
    }

    // Validate plan
    const planConfig = getProspeccionPlanConfig(plan)
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
    }

    // Validate required strings
    if (typeof businessName !== 'string' || businessName.trim().length < 2 || businessName.length > 200) {
      return NextResponse.json({ error: 'Nombre del negocio invalido' }, { status: 400 })
    }
    if (typeof senderName !== 'string' || senderName.trim().length < 2 || senderName.length > 200) {
      return NextResponse.json({ error: 'Nombre del remitente invalido' }, { status: 400 })
    }

    // Validate emails (proper regex, max 254 chars per RFC 5321)
    if (typeof senderEmail !== 'string' || senderEmail.length > 254 || !EMAIL_REGEX.test(senderEmail)) {
      return NextResponse.json({ error: 'Email del remitente invalido' }, { status: 400 })
    }
    if (typeof notificationEmail !== 'string' || notificationEmail.length > 254 || !EMAIL_REGEX.test(notificationEmail)) {
      return NextResponse.json({ error: 'Email de notificaciones invalido' }, { status: 400 })
    }
    if (typeof payerEmail !== 'string' || payerEmail.length > 254 || !EMAIL_REGEX.test(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturacion invalido' }, { status: 400 })
    }

    // Validate website URL
    if (typeof website !== 'string' || website.trim().length < 5 || website.length > 500 || !URL_REGEX.test(website.trim())) {
      return NextResponse.json({ error: 'URL del sitio web invalida' }, { status: 400 })
    }

    // Validate and sanitize nichos and ciudades
    const nichesArr = Array.isArray(nichesList)
      ? nichesList.map(n => typeof n === 'string' ? n.trim().slice(0, 100) : '').filter(n => n.length > 0)
      : []
    const citiesArr = Array.isArray(citiesList)
      ? citiesList.map(c => typeof c === 'string' ? c.trim().slice(0, 100) : '').filter(c => c.length > 0)
      : []
    if (nichesArr.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos un nicho' }, { status: 400 })
    }
    if (citiesArr.length === 0) {
      return NextResponse.json({ error: 'Selecciona al menos una ciudad' }, { status: 400 })
    }
    if (nichesArr.length > planConfig.maxNichos) {
      return NextResponse.json({ error: `Plan ${planConfig.name} permite hasta ${planConfig.maxNichos} nichos` }, { status: 400 })
    }
    if (citiesArr.length > planConfig.maxCiudades) {
      return NextResponse.json({ error: `Plan ${planConfig.name} permite hasta ${planConfig.maxCiudades} ciudades` }, { status: 400 })
    }

    // Sanitize optional fields
    const sanitizedServiciosDesc = typeof serviciosDesc === 'string' ? serviciosDesc.trim().slice(0, 2000) : ''
    const sanitizedColorPrimario = typeof colorPrimario === 'string' && /^#[0-9a-fA-F]{6}$/.test(colorPrimario.trim())
      ? colorPrimario.trim()
      : '#2563eb'

    // Validate coupon only — do NOT increment usedCount here. The MP webhook is
    // the sole incrementer on `authorized`. Counting at subscribe time would
    // double-count every paid use and never refund an abandoned checkout.
    let couponId: string | null = null
    let discountApplied = 0

    if (couponCode && typeof couponCode === 'string' && couponCode.length <= 50) {
      const code = couponCode.toUpperCase().trim()
      const now = new Date()

      const coupon = await prisma.coupon.findUnique({ where: { code } })
      if (!coupon || !coupon.active || now < coupon.validFrom || now > coupon.validUntil) {
        return NextResponse.json({ error: 'Cupon invalido o expirado' }, { status: 400 })
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Cupon agotado' }, { status: 400 })
      }
      couponId = coupon.id
      discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
    } else if (couponCode) {
      return NextResponse.json({ error: 'Codigo de cupon invalido' }, { status: 400 })
    }

    // Make stored trial status truthful first, so 'trial' below can only mean
    // a trial that is still running. Without this an expired trial blocks the
    // user from subscribing at all — no access and no way to pay.
    await expireStaleTrials(prisma.prospeccionSubscription, session.user.id)

    // Check existing active subscription
    const existing = await prisma.prospeccionSubscription.findFirst({
      where: { userId: session.user.id, status: { in: ['active', 'provisioning', 'trial'] } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya tenes una suscripcion activa de Prospeccion' }, { status: 409 })
    }

    // Cancel stale pending_payment + create subscription atomically
    const subscription = await prisma.$transaction(async (tx) => {
      await tx.prospeccionSubscription.updateMany({
        where: { userId: session.user.id, status: 'pending_payment' },
        data: { status: 'cancelled' },
      })
      return tx.prospeccionSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          businessName: businessName.trim(),
          senderName: senderName.trim(),
          senderEmail: senderEmail.toLowerCase().trim(),
          website: website.trim(),
          nichesList: JSON.stringify(nichesArr),
          citiesList: JSON.stringify(citiesArr),
          serviciosDesc: sanitizedServiciosDesc,
          colorPrimario: sanitizedColorPrimario,
          notificationEmail: notificationEmail.toLowerCase().trim(),
          payerEmail: payerEmail.toLowerCase().trim(),
          couponId,
          discountApplied,
        },
      })
    })

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.prospeccionSubscription.update({
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
      prisma.prospeccionSubscription,
      session.user.id,
      subscription.id
    )
    // First time → 3-day trial (no payment needed)
    if (!usedTrial) {
      await prisma.prospeccionSubscription.update({
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
    console.error('[Prospeccion Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
