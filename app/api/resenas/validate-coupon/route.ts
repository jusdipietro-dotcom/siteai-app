import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`coupon-resenas:${ip}`, { maxRequests: 10, windowSeconds: 60 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá un momento.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, error: 'Cupón inválido' })
    }

    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ valid: false, error: 'Cupón expirado' })
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'Cupón agotado' })
    }

    return NextResponse.json({
      valid: true,
      discount: coupon.discount,
      code: coupon.code,
    })
  } catch (err) {
    console.error('[Validate Coupon Reviews] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
