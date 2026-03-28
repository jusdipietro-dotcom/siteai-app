import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Codigo requerido' }, { status: 400 })

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon || !coupon.active) return NextResponse.json({ error: 'Cupon invalido' }, { status: 404 })
    if (coupon.usedCount >= coupon.maxUses) return NextResponse.json({ error: 'Cupon agotado' }, { status: 400 })
    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validUntil) return NextResponse.json({ error: 'Cupon fuera del periodo de validez' }, { status: 400 })

    return NextResponse.json({ valid: true, code: coupon.code, discount: coupon.discount })
  } catch (err) {
    console.error('[Turnos Validate Coupon] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
