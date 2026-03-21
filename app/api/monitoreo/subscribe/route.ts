import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptPortalCredentials } from '@/lib/encryption'

const MONITORING_PLANS: Record<string, { monthly: number; title: string; maxCuils: number }> = {
  basico:       { monthly: 19000, title: 'Monitoreo Judicial Básico',       maxCuils: 1 },
  profesional:  { monthly: 35000, title: 'Monitoreo Judicial Profesional',  maxCuils: 3 },
  estudio:      { monthly: 75000, title: 'Monitoreo Judicial Estudio',      maxCuils: 8 },
}

export async function POST(req: NextRequest) {
  try {
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
    if (!notificationEmail || !notificationEmail.includes('@')) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail || !payerEmail.includes('@')) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // Check existing active subscription for same CUIT
    const normalizedCuil = cuil.replace(/[-\s]/g, '')
    const existing = await prisma.monitoringSubscription.findFirst({
      where: {
        userId: session.user.id,
        cuil: normalizedCuil,
        status: { in: ['active', 'provisioning'] },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tenés una suscripción activa para este CUIT' },
        { status: 409 }
      )
    }

    // Auto-cancel stale pending_payment records for the same CUIT
    await prisma.monitoringSubscription.updateMany({
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
      discountApplied = coupon.discount
    }

    // Encrypt credentials (per-portal)
    const encrypted = encryptPortalCredentials({
      pjnUser: (portal === 'PJN' || portal === 'AMBOS') ? pjnUser : undefined,
      pjnPass: (portal === 'PJN' || portal === 'AMBOS') ? pjnPass : undefined,
      scbaUser: (portal === 'SCBA' || portal === 'AMBOS') ? scbaUser : undefined,
      scbaPass: (portal === 'SCBA' || portal === 'AMBOS') ? scbaPass : undefined,
    })

    // Create subscription
    const subscription = await prisma.monitoringSubscription.create({
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

    // NOTE: Coupon usedCount is incremented in the MP webhook handler
    // AFTER payment is confirmed, not here at subscription creation time.
    // This prevents abandoned checkouts from consuming coupon uses.

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
