import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

/** GET: List all free accounts */
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { isFreeAccount: true },
    select: {
      id: true,
      email: true,
      name: true,
      isFreeAccount: true,
      freeAccountNote: true,
      createdAt: true,
      _count: {
        select: {
          monitoringSubscriptions: true,
          facturacionSubscriptions: true,
          causasSubscriptions: true,
          turnosSubscriptions: true,
          suiteJuridicaSubscriptions: true,
          reviewsSubscriptions: true,
          linkedinSubscriptions: true,
          leadsSubscriptions: true,
          prospeccionSubscriptions: true,
          emailMarketingSubscriptions: true,
          tradingSubscriptions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ users })
}

/** POST: Grant free access to a user by email */
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { email, note } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) {
    return NextResponse.json({ error: `No existe un usuario con email ${email}` }, { status: 404 })
  }

  if (user.isFreeAccount) {
    return NextResponse.json({ error: 'Este usuario ya tiene cuenta gratuita' }, { status: 409 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isFreeAccount: true,
      freeAccountNote: note || null,
    },
  })

  return NextResponse.json({ status: 'ok', userId: user.id, email: user.email })
}

/** DELETE: Revoke free access */
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: { isFreeAccount: false, freeAccountNote: null },
  })

  return NextResponse.json({ status: 'ok' })
}
