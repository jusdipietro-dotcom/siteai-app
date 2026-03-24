import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getPlanConfig } from '@/lib/email-marketing-plans'

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

    const body = await req.json()
    const { plan, businessName, contactCount, senderName, senderEmail, notificationEmail, payerEmail, couponCode } = body

    // ── Validar plan ──
    const planConfig = getPlanConfig(plan)
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // ── Validar campos requeridos ──
    if (!businessName?.trim()) {
      return NextResponse.json({ error: 'Nombre del negocio requerido' }, { status: 400 })
    }
    if (!senderName?.trim()) {
      return NextResponse.json({ error: 'Nombre del remitente requerido' }, { status: 400 })
    }
    if (!senderEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de envío inválido' }, { status: 400 })
    }
    if (!notificationEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // ── Validar límite de contactos del plan ──
    const parsedContactCount = parseInt(contactCount, 10) || 0
    if (parsedContactCount > planConfig.maxContacts) {
      return NextResponse.json(
        { error: `El plan ${planConfig.name} permite hasta ${planConfig.maxContacts.toLocaleString()} contactos. Necesitás un plan superior.` },
        { status: 400 }
      )
    }

    // ── Validar tipo de remitente según plan ──
    const emailDomain = senderEmail.toLowerCase().trim().split('@')[1]
    if (planConfig.senderType === 'gmail' && emailDomain !== 'gmail.com') {
      return NextResponse.json(
        { error: `El plan ${planConfig.name} solo permite enviar desde Gmail (@gmail.com). Para usar tu dominio propio necesitás el plan Profesional o superior.` },
        { status: 400 }
      )
    }
    // workspace = cualquier dominio excepto gmail (se asume Google Workspace)
    // any = sin restricción

    // ── Verificar duplicado activo para el mismo negocio ──
    const existing = await prisma.emailMarketingSubscription.findFirst({
      where: {
        userId: session.user.id,
        businessName: businessName.trim(),
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tenés una campaña activa para este negocio' },
        { status: 409 }
      )
    }

    // ── Verificar límite de campañas activas del plan ──
    const activeSubs = await prisma.emailMarketingSubscription.count({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (activeSubs >= planConfig.maxCampaigns) {
      const label = planConfig.maxCampaigns >= 99 ? 'campañas ilimitadas' : `${planConfig.maxCampaigns} campaña${planConfig.maxCampaigns > 1 ? 's' : ''}`
      return NextResponse.json(
        { error: `Tu plan (${planConfig.name}) permite hasta ${label}. Ya tenés ${activeSubs} activa${activeSubs > 1 ? 's' : ''}. Upgrade a un plan superior para agregar más.` },
        { status: 400 }
      )
    }

    // ── Verificar límite de remitentes distintos del plan ──
    const distinctSenders = await prisma.emailMarketingSubscription.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning'] },
      },
      select: { senderEmail: true },
      distinct: ['senderEmail'],
    })
    const newSender = senderEmail.toLowerCase().trim()
    const existingSenders = distinctSenders.map(s => s.senderEmail)
    const isNewSender = !existingSenders.includes(newSender)
    if (isNewSender && existingSenders.length >= planConfig.maxSenders) {
      const label = planConfig.maxSenders >= 99 ? 'remitentes ilimitados' : `${planConfig.maxSenders} remitente${planConfig.maxSenders > 1 ? 's' : ''}`
      return NextResponse.json(
        { error: `Tu plan (${planConfig.name}) permite hasta ${label}. Ya usás ${existingSenders.length}. Upgrade para agregar otro remitente.` },
        { status: 400 }
      )
    }

    // ── Cancelar suscripciones pendientes viejas ──
    await prisma.emailMarketingSubscription.updateMany({
      where: {
        userId: session.user.id,
        status: 'pending_payment',
      },
      data: { status: 'cancelled' },
    })

    // ── Validar cupón ──
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

    // ── Crear suscripción ──
    const subscription = await prisma.emailMarketingSubscription.create({
      data: {
        userId: session.user.id,
        plan,
        businessName: businessName.trim(),
        contactCount: parsedContactCount,
        senderName: senderName.trim(),
        senderEmail: newSender,
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
