import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptCredentials } from '@/lib/encryption'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { CAUSAS_PLANS } from '@/lib/causas-plans'
import { isUserFreeAccount } from '@/lib/free-account'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`causas-subscribe:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { plan, mevUser, mevPass, dptoId, dptoNombre, dptoTipo, notificationEmail, payerEmail, couponCode } = body

    // Validate plan
    const planConfig = CAUSAS_PLANS[plan as keyof typeof CAUSAS_PLANS]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validate required fields
    if (!mevUser || mevUser.trim().length < 2) {
      return NextResponse.json({ error: 'Usuario MEV inválido' }, { status: 400 })
    }
    if (!mevPass || mevPass.length < 4) {
      return NextResponse.json({ error: 'Contraseña MEV inválida' }, { status: 400 })
    }
    if (!dptoId) {
      return NextResponse.json({ error: 'Departamento judicial requerido' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!notificationEmail || !emailRegex.test(notificationEmail) || notificationEmail.length > 254) {
      return NextResponse.json({ error: 'Email de notificaciones inválido' }, { status: 400 })
    }
    if (!payerEmail || !emailRegex.test(payerEmail) || payerEmail.length > 254) {
      return NextResponse.json({ error: 'Email de facturación inválido' }, { status: 400 })
    }

    // Encrypt MEV credentials
    const encrypted = encryptCredentials(mevUser.trim(), mevPass)

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check existing active subscription
      const existing = await tx.causasSubscription.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ['active', 'provisioning', 'pending_config'] },
        },
      })
      if (existing) {
        return { error: 'Ya tenés una suscripción activa de Dashboard Causas', status: 409 } as const
      }

      // Auto-cancel stale pending_payment records
      await tx.causasSubscription.updateMany({
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
      const subscription = await tx.causasSubscription.create({
        data: {
          userId: session.user.id,
          plan,
          mevUser: encrypted.credentialUser,
          mevPass: encrypted.credentialPass,
          mevIv: encrypted.credentialIv,
          mevTag: encrypted.credentialTag,
          dptoTipo: dptoTipo || 'CC',
          dptoId: String(dptoId),
          dptoNombre: dptoNombre || '',
          scrapeFrequency: planConfig.scrapeFrequency,
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
      await prisma.causasSubscription.update({
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
      monthlyPrice: finalPrice,
      discount: discountApplied,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Causas Subscribe] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
