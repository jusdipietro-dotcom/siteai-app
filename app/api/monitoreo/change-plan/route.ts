import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const VALID_PLANS = ['basico', 'profesional', 'estudio']

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`change-plan:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscriptionId, newPlan } = await req.json()

    if (!subscriptionId || !newPlan) {
      return NextResponse.json({ error: 'subscriptionId y newPlan requeridos' }, { status: 400 })
    }
    if (!VALID_PLANS.includes(newPlan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Fetch current subscription
    const oldSub = await prisma.monitoringSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!oldSub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (!['active', 'provisioning'].includes(oldSub.status)) {
      return NextResponse.json({ error: 'Solo se puede cambiar el plan de una suscripción activa' }, { status: 400 })
    }
    if (oldSub.plan === newPlan) {
      return NextResponse.json({ error: 'Ya tenés este plan' }, { status: 400 })
    }

    // Cancel any existing pending_payment for this CUIT (cleanup)
    await prisma.monitoringSubscription.updateMany({
      where: {
        userId: session.user.id,
        cuil: oldSub.cuil,
        status: 'pending_payment',
      },
      data: { status: 'cancelled' },
    })

    // Create new subscription copying all data from the old one
    const newSub = await prisma.monitoringSubscription.create({
      data: {
        userId: session.user.id,
        plan: newPlan,
        portal: oldSub.portal,
        cuil: oldSub.cuil,
        credentialUser: oldSub.credentialUser,
        credentialPass: oldSub.credentialPass,
        credentialIv: oldSub.credentialIv,
        credentialTag: oldSub.credentialTag,
        notificationEmail: oldSub.notificationEmail,
        payerEmail: oldSub.payerEmail,
        // No coupon on plan changes
        discountApplied: 0,
      },
    })

    console.log(`[Change Plan] ${oldSub.plan} → ${newPlan} | old=${subscriptionId} new=${newSub.id}`)

    return NextResponse.json({
      subscriptionId: newSub.id,
      oldSubscriptionId: subscriptionId,
      oldPlan: oldSub.plan,
      newPlan,
      status: 'pending_payment',
      nextStep: 'payment',
    })
  } catch (err) {
    console.error('[Change Plan] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
