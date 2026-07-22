import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isUserFreeAccount } from '@/lib/free-account'
import { getTrialEndDate, expireStaleTrials, hasUsedTrial } from '@/lib/trial'
import { getLeadsPlan } from '@/lib/leads-plans'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`leads-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Per-user rate limit
    const rlUser = checkRateLimit(`leads-subscribe:user:${session.user.id}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rlUser.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
    }
    const { plan, notificationEmail, payerEmail, couponCode, googleSheetUrl, nichesList, citiesList } = body as {
      plan: string; notificationEmail: string; payerEmail: string; couponCode?: string;
      googleSheetUrl?: string; nichesList?: string[]; citiesList?: string[]
    }

    // Validate plan. `planConfig.id` is the narrowed, canonical id — use it
    // everywhere below instead of the raw request value.
    const planConfig = getLeadsPlan(plan)
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate emails (proper regex, max 254 chars per RFC 5321)
    if (typeof notificationEmail !== 'string' || notificationEmail.length > 254 || !EMAIL_REGEX.test(notificationEmail)) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (typeof payerEmail !== 'string' || payerEmail.length > 254 || !EMAIL_REGEX.test(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // Validate and sanitize nichos and ciudades
    const nichesArr = Array.isArray(nichesList)
      ? nichesList.map(n => typeof n === 'string' ? n.trim().slice(0, 100) : '').filter(n => n.length > 0)
      : []
    const citiesArr = Array.isArray(citiesList)
      ? citiesList.map(c => typeof c === 'string' ? c.trim().slice(0, 100) : '').filter(c => c.length > 0)
      : []
    if (nichesArr.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos un nicho' }, { status: 400 })
    }
    if (citiesArr.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos una ciudad' }, { status: 400 })
    }
    if (nichesArr.length > planConfig.maxNichos) {
      return NextResponse.json({ error: `Plan ${planConfig.title} permite hasta ${planConfig.maxNichos} nichos` }, { status: 400 })
    }
    if (citiesArr.length > planConfig.maxCiudades) {
      return NextResponse.json({ error: `Plan ${planConfig.title} permite hasta ${planConfig.maxCiudades} ciudades` }, { status: 400 })
    }

    // Validate Google Sheet URL (optional, must be HTTPS Google Sheets if provided)
    let sanitizedSheetUrl: string | null = null
    if (typeof googleSheetUrl === 'string' && googleSheetUrl.trim()) {
      const trimmed = googleSheetUrl.trim().slice(0, 500)
      if (!trimmed.startsWith('https://docs.google.com/spreadsheets/')) {
        return NextResponse.json({ error: 'URL de Google Sheet inválida' }, { status: 400 })
      }
      sanitizedSheetUrl = trimmed
    }

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
        return NextResponse.json({ error: 'Cupón inválido o expirado' }, { status: 400 })
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
      }
      couponId = coupon.id
      discountApplied = Math.min(Math.max(coupon.discount, 0), 100)
    } else if (couponCode) {
      return NextResponse.json({ error: 'Código de cupón inválido' }, { status: 400 })
    }

    // Make stored trial status truthful first, so 'trial' below can only mean
    // a trial that is still running. Without this an expired trial blocks the
    // user from subscribing at all — no access and no way to pay.
    await expireStaleTrials(prisma.leadsSubscription, session.user.id)

    // Check existing active subscription
    const existing = await prisma.leadsSubscription.findFirst({
      where: { userId: session.user.id, status: { in: ['active', 'provisioning', 'trial'] } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya tenes una suscripcion activa de Leads' }, { status: 409 })
    }

    // Cancel stale pending_payment + create subscription atomically
    const subscription = await prisma.$transaction(async (tx) => {
      await tx.leadsSubscription.updateMany({
        where: { userId: session.user.id, status: 'pending_payment' },
        data: { status: 'cancelled' },
      })
      return tx.leadsSubscription.create({
        data: {
          userId: session.user.id,
          plan: planConfig.id,
          notificationEmail: notificationEmail.toLowerCase().trim(),
          payerEmail: payerEmail.toLowerCase().trim(),
          googleSheetUrl: sanitizedSheetUrl,
          nichesList: JSON.stringify(nichesArr),
          citiesList: JSON.stringify(citiesArr),
          couponId,
          discountApplied,
        },
      })
    })

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(session.user.id)
    if (isFree) {
      await prisma.leadsSubscription.update({
        where: { id: subscription.id },
        data: { status: 'active', discountApplied: 100, provisionedAt: new Date() },
      })
      return NextResponse.json({
        subscriptionId: subscription.id,
        plan: planConfig.id,
        status: 'active',
        nextStep: 'done',
        freeAccount: true,
      })
    }

    // Separate question: has this user ever subscribed before? Any prior row
    // means the trial is spent — they continue to payment instead.
    const usedTrial = await hasUsedTrial(
      prisma.leadsSubscription,
      session.user.id,
      subscription.id
    )
    // First time → 3-day trial (no payment needed)
    if (!usedTrial) {
      await prisma.leadsSubscription.update({
        where: { id: subscription.id },
        data: { status: 'trial', trialEndsAt: getTrialEndDate() },
      })
      return NextResponse.json({
        subscriptionId: subscription.id,
        plan: planConfig.id,
        status: 'trial',
        trialEndsAt: getTrialEndDate().toISOString(),
        nextStep: 'trial_started',
      })
    }

    const finalPrice = Math.round(planConfig.monthly * (1 - discountApplied / 100))

    return NextResponse.json({
      subscriptionId: subscription.id,
      plan: planConfig.id,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Leads Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
