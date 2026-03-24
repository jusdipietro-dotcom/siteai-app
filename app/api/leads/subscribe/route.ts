import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const LEADS_PLANS: Record<string, { monthly: number; title: string }> = {
  basico:      { monthly: 18000, title: 'Captación de Leads IA Básico' },
  profesional: { monthly: 35000, title: 'Captación de Leads IA Profesional' },
}

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

    const body = await req.json()
    const { plan, notificationEmail, payerEmail, couponCode, googleSheetUrl, nichesList, citiesList } = body

    // Validate plan
    const planConfig = LEADS_PLANS[plan]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate required fields
    if (!notificationEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail?.includes('@')) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // Validate nichos and ciudades
    const nichesArr = Array.isArray(nichesList) ? nichesList.filter((n: unknown) => typeof n === 'string' && n.trim()) : []
    const citiesArr = Array.isArray(citiesList) ? citiesList.filter((c: unknown) => typeof c === 'string' && c.trim()) : []
    if (nichesArr.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos un nicho' }, { status: 400 })
    }
    if (citiesArr.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos una ciudad' }, { status: 400 })
    }
    // Enforce plan limits
    const planLimits = { basico: { maxNichos: 10, maxCiudades: 5 }, profesional: { maxNichos: 999, maxCiudades: 999 } }
    const lim = planLimits[plan as keyof typeof planLimits] ?? planLimits.basico
    if (nichesArr.length > lim.maxNichos) {
      return NextResponse.json({ error: `Plan ${plan} permite hasta ${lim.maxNichos} nichos` }, { status: 400 })
    }
    if (citiesArr.length > lim.maxCiudades) {
      return NextResponse.json({ error: `Plan ${plan} permite hasta ${lim.maxCiudades} ciudades` }, { status: 400 })
    }

    // Cancel ALL stale pending_payment records for this user
    await prisma.leadsSubscription.updateMany({
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

    const subscription = await prisma.leadsSubscription.create({
      data: {
        userId: session.user.id,
        plan,
        notificationEmail: notificationEmail.toLowerCase().trim(),
        payerEmail: payerEmail.toLowerCase().trim(),
        googleSheetUrl: googleSheetUrl?.trim() || null,
        nichesList: JSON.stringify(nichesArr),
        citiesList: JSON.stringify(citiesArr),
        couponId,
        discountApplied,
      },
    })

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
    console.error('[Leads Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
