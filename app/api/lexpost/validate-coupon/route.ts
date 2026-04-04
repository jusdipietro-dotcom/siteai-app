import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`coupon-lexpost:${ip}`, { maxRequests: 10, windowSeconds: 60 })
    if (!rl.allowed) {
      return NextResponse.json({ valid: false, discount: 0, message: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ valid: false, discount: 0, message: 'No autorizado' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ valid: false, discount: 0, message: 'Codigo requerido' })
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, discount: 0, message: 'Cupon invalido' })
    }

    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ valid: false, discount: 0, message: 'Cupon expirado' })
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, discount: 0, message: 'Cupon agotado' })
    }

    if (coupon.discount === 100) {
      return NextResponse.json({ valid: true, discount: 100, message: `Cupon ${coupon.code}: servicio 100% gratuito` })
    }

    return NextResponse.json({ valid: true, discount: coupon.discount, message: `Cupon ${coupon.code}: ${coupon.discount}% de descuento aplicado` })
  } catch (err) {
    console.error('[LexPost Validate Coupon] Error:', err)
    return NextResponse.json({ valid: false, discount: 0, message: 'Error interno' }, { status: 500 })
  }
}
