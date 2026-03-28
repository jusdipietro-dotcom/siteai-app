import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getPlanConfig } from '@/lib/email-marketing-plans'
import { isUserFreeAccount } from '@/lib/free-account'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_NAME_LENGTH = 200

function sanitizeStr(val: unknown): string {
  return typeof val === 'string' ? val.trim().slice(0, MAX_NAME_LENGTH) : ''
}

function sanitizeEmail(val: unknown): string {
  return typeof val === 'string' ? val.toLowerCase().trim().slice(0, 254) : ''
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`emailmarketing-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = session.user.id

    // ── Parse and sanitize body ──
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body requerido' }, { status: 400 })
    }

    const plan = typeof body.plan === 'string' ? body.plan : ''
    const businessName = sanitizeStr(body.businessName)
    const senderName = sanitizeStr(body.senderName)
    const senderEmail = sanitizeEmail(body.senderEmail)
    const notificationEmail = sanitizeEmail(body.notificationEmail)
    const payerEmail = sanitizeEmail(body.payerEmail)
    const couponCode = typeof body.couponCode === 'string' ? body.couponCode.toUpperCase().trim().slice(0, 50) : ''

    // ── Validate plan ──
    const planConfig = getPlanConfig(plan)
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // ── Validate required fields ──
    if (!businessName) {
      return NextResponse.json({ error: 'Nombre del negocio requerido' }, { status: 400 })
    }
    if (!senderName) {
      return NextResponse.json({ error: 'Nombre del remitente requerido' }, { status: 400 })
    }
    if (!EMAIL_RE.test(senderEmail)) {
      return NextResponse.json({ error: 'Email de envío inválido' }, { status: 400 })
    }
    if (!EMAIL_RE.test(notificationEmail)) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!EMAIL_RE.test(payerEmail)) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // ── Validate contact count ──
    const rawCount = typeof body.contactCount === 'number' ? body.contactCount : parseInt(String(body.contactCount), 10)
    const parsedContactCount = Number.isFinite(rawCount) ? Math.floor(rawCount) : 0
    if (parsedContactCount < 0) {
      return NextResponse.json({ error: 'La cantidad de contactos no puede ser negativa' }, { status: 400 })
    }
    if (parsedContactCount > planConfig.maxContacts) {
      return NextResponse.json(
        { error: `El plan ${planConfig.name} permite hasta ${planConfig.maxContacts.toLocaleString()} contactos. Necesitás un plan superior.` },
        { status: 400 }
      )
    }

    // ── Validate sender type per plan ──
    const emailDomain = senderEmail.split('@').pop() ?? ''
    if (planConfig.senderType === 'gmail' && emailDomain !== 'gmail.com') {
      return NextResponse.json(
        { error: `El plan ${planConfig.name} solo permite enviar desde Gmail (@gmail.com). Para usar tu dominio propio necesitás el plan Profesional o superior.` },
        { status: 400 }
      )
    }

    // ── Check duplicate active subscription for same business (case-insensitive) ──
    const existing = await prisma.emailMarketingSubscription.findFirst({
      where: {
        userId,
        businessName: { equals: businessName, mode: 'insensitive' },
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tenés una campaña activa para este negocio' },
        { status: 409 }
      )
    }

    // ── Check active campaigns limit ──
    const activeSubs = await prisma.emailMarketingSubscription.count({
      where: { userId, status: { in: ['active', 'provisioning'] } },
    })
    if (activeSubs >= planConfig.maxCampaigns) {
      const label = planConfig.maxCampaigns >= 99 ? 'campañas ilimitadas' : `${planConfig.maxCampaigns} campaña${planConfig.maxCampaigns > 1 ? 's' : ''}`
      return NextResponse.json(
        { error: `Tu plan (${planConfig.name}) permite hasta ${label}. Ya tenés ${activeSubs} activa${activeSubs > 1 ? 's' : ''}. Upgrade a un plan superior para agregar más.` },
        { status: 400 }
      )
    }

    // ── Check distinct senders limit (case-insensitive) ──
    const distinctSendersRaw = await prisma.emailMarketingSubscription.findMany({
      where: { userId, status: { in: ['active', 'provisioning'] } },
      select: { senderEmail: true },
      distinct: ['senderEmail'],
    })
    const existingSenders = distinctSendersRaw.map(s => s.senderEmail.toLowerCase())
    const isNewSender = !existingSenders.includes(senderEmail)
    if (isNewSender && existingSenders.length >= planConfig.maxSenders) {
      const label = planConfig.maxSenders >= 99 ? 'remitentes ilimitados' : `${planConfig.maxSenders} remitente${planConfig.maxSenders > 1 ? 's' : ''}`
      return NextResponse.json(
        { error: `Tu plan (${planConfig.name}) permite hasta ${label}. Ya usás ${existingSenders.length}. Upgrade para agregar otro remitente.` },
        { status: 400 }
      )
    }

    // ── Cancel stale pending_payment records ──
    await prisma.emailMarketingSubscription.updateMany({
      where: { userId, status: 'pending_payment' },
      data: { status: 'cancelled' },
    })

    // ── Validate coupon ──
    let couponId: string | null = null
    let discountApplied = 0

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
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

    // ── Create subscription ──
    const subscription = await prisma.emailMarketingSubscription.create({
      data: {
        userId,
        plan,
        businessName,
        contactCount: parsedContactCount,
        senderName,
        senderEmail,
        notificationEmail,
        payerEmail,
        couponId,
        discountApplied,
      },
    })

    // Free account bypass — skip payment
    const isFree = await isUserFreeAccount(userId)
    if (isFree) {
      await prisma.emailMarketingSubscription.update({
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
      businessName: subscription.businessName,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Email Marketing Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
