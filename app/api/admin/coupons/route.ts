import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  try {
    const { code, discount, maxUses, validUntil } = await req.json()

    if (!code || typeof code !== 'string' || code.length < 3) {
      return NextResponse.json({ error: 'Código inválido (mín. 3 caracteres)' }, { status: 400 })
    }
    if (!discount || discount < 1 || discount > 100) {
      return NextResponse.json({ error: 'Descuento debe ser entre 1 y 100' }, { status: 400 })
    }
    if (!validUntil) {
      return NextResponse.json({ error: 'Fecha de vencimiento requerida' }, { status: 400 })
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un cupón con ese código' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount,
        maxUses: maxUses ?? 1,
        validUntil: new Date(validUntil),
        createdBy: session.user!.id,
      },
    })

    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('[Admin Coupons] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await prisma.coupon.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
