import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { FACTURACION_PLANS } from '@/lib/facturacion-plans'
import { isUserFreeAccount } from '@/lib/free-account'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 subscriptions per 10 minutes per IP
    const ip = getClientIp(req)
    const rl = checkRateLimit(`facturacion-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, cuit, razonSocial, puntoVenta, condicionIva, notificationEmail, payerEmail, couponCode } = body

    // Validate plan
    const planConfig = FACTURACION_PLANS[plan as keyof typeof FACTURACION_PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate required fields
    if (!cuit || !/^\d{2}-?\d{7,8}-?\d$/.test(cuit.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'CUIT inválido (debe ser 11 dígitos)' }, { status: 400 })
    }
    if (!razonSocial || razonSocial.trim().length < 3) {
      return NextResponse.json({ error: 'Razón social inválida' }, { status: 400 })
    }
    const pv = parseInt(puntoVenta, 10)
    if (!pv || pv < 1 || pv > 99999) {
      return NextResponse.json({ error: 'Punto de venta inválido (1-99999)' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!notificationEmail || !emailRegex.test(notificationEmail) || notificationEmail.length > 254) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail || !emailRegex.test(payerEmail) || payerEmail.length > 254) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    const normalizedCuit = cuit.replace(/[-\s]/g, '')

    // Atomic transaction: check + cancel stale + validate coupon + create
    const result = await prisma.$transaction(async (tx) => {
      // Check existing active subscription for same CUIT
      const existing = await tx.facturacionSubscription.findFirst({
        where: {
          userId: session.user.id,
          cuit: normalizedCuit,
          status: { in: ['active', 'provisioning'] },
        },
      })
      if (existing) {
        return { error: 'Ya tenés una suscripción activa de facturación para este CUIT', status: 409 } as const
      }

      // Auto-cancel stale pending_payment records for the same CUIT
      await tx.facturacionSubscription.updateMany({
        where: {
          userId: session.user.id,
          cuit: normalizedCuit,
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
      const subscription = await tx.facturacionSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          cuit: normalizedCuit,
          razonSocial: razonSocial.trim(),
          puntoVenta: pv,
          condicionIva: condicionIva || 'Responsable Inscripto',
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
      await prisma.facturacionSubscription.update({
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

    // Calculate final price
    const finalPrice = Math.round(planConfig.monthly * (1 - discountApplied / 100))

    return NextResponse.json({
      subscriptionId: subscription.id,
      plan,
      cuit: subscription.cuit,
      razonSocial: subscription.razonSocial,
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Facturacion Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
