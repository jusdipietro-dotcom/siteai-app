import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const REVIEWS_PLANS: Record<string, { monthly: number; title: string; maxProfiles: number }> = {
  basico:    { monthly: 15000, title: 'Reseñas Google IA Básico',    maxProfiles: 1 },
  profesional: { monthly: 25000, title: 'Reseñas Google IA Profesional', maxProfiles: 3 },
  premium:   { monthly: 45000, title: 'Reseñas Google IA Premium',   maxProfiles: 10 },
}

export { REVIEWS_PLANS }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`reviews-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, businessName, businessType, searchUrl, googleEmail, responseTone, notificationEmail, payerEmail, couponCode } = body

    // Validate plan
    const planConfig = REVIEWS_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate required fields
    if (!businessName?.trim()) {
      return NextResponse.json({ error: 'Nombre del negocio requerido' }, { status: 400 })
    }
    if (!businessType?.trim()) {
      return NextResponse.json({ error: 'Tipo de negocio requerido' }, { status: 400 })
    }
    if (!searchUrl?.trim()) {
      return NextResponse.json({ error: 'URL de búsqueda requerida' }, { status: 400 })
    }
    if (!googleEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de Google inválido' }, { status: 400 })
    }
    if (!notificationEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }
    if (!['profesional', 'cercano', 'formal'].includes(responseTone ?? '')) {
      return NextResponse.json({ error: 'Tono de respuesta inválido' }, { status: 400 })
    }

    // Check existing active subscription for same business
    const existing = await prisma.reviewsSubscription.findFirst({
      where: {
        userId: session.user.id,
        businessName: businessName.trim(),
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tenés una suscripción activa para este negocio' },
        { status: 409 }
      )
    }

    // Enforce max profiles per plan
    const activeSubs = await prisma.reviewsSubscription.count({
      where: {
        userId: session.user.id,
        status: { in: ['active', 'provisioning', 'pending_payment'] },
      },
    })
    if (activeSubs >= planConfig.maxProfiles) {
      return NextResponse.json(
        { error: `El plan ${planConfig.title} permite hasta ${planConfig.maxProfiles} perfil${planConfig.maxProfiles > 1 ? 'es' : ''}. Podés cambiar a un plan superior.` },
        { status: 400 }
      )
    }

    // Cancel stale pending_payment records for same business
    await prisma.reviewsSubscription.updateMany({
      where: {
        userId: session.user.id,
        businessName: businessName.trim(),
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

    // Build Google Search URL if not provided as full URL
    let finalSearchUrl = searchUrl.trim()
    if (!finalSearchUrl.startsWith('http')) {
      finalSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(finalSearchUrl)}`
    }

    const subscription = await prisma.reviewsSubscription.create({
      data: {
        userId: session.user.id,
        plan,
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        searchUrl: finalSearchUrl,
        googleEmail: googleEmail.toLowerCase().trim(),
        responseTone: responseTone ?? 'profesional',
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
    console.error('[Reviews Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
