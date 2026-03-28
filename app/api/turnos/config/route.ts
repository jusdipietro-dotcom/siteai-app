import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET: return current config. PUT: update config. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const sub = await prisma.turnosSubscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
    if (!sub) return NextResponse.json({ error: 'No tenes una suscripcion activa' }, { status: 404 })

    return NextResponse.json({
      id: sub.id,
      slug: sub.slug,
      businessName: sub.businessName,
      businessType: sub.businessType,
      colorPrimary: sub.colorPrimary,
      colorAccent: sub.colorAccent,
      scheduleDays: JSON.parse(sub.scheduleDays),
      scheduleSlots: JSON.parse(sub.scheduleSlots),
      slotDuration: sub.slotDuration,
      practiceAreas: JSON.parse(sub.practiceAreas),
      holidays: JSON.parse(sub.holidays),
      phone: sub.phone,
      address: sub.address,
      notificationEmail: sub.notificationEmail,
      publicUrl: `https://automaticialab.com/turnos/${sub.slug}`,
    })
  } catch (err) {
    console.error('[Turnos Config GET] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const sub = await prisma.turnosSubscription.findFirst({
      where: { userId: session.user.id, status: 'active' },
    })
    if (!sub) return NextResponse.json({ error: 'No tenes una suscripcion activa' }, { status: 404 })

    const body = await req.json()
    const updateData: Record<string, unknown> = {}

    if (body.scheduleDays !== undefined) updateData.scheduleDays = JSON.stringify(body.scheduleDays)
    if (body.scheduleSlots !== undefined) updateData.scheduleSlots = JSON.stringify(body.scheduleSlots)
    if (body.slotDuration !== undefined) updateData.slotDuration = body.slotDuration
    if (body.practiceAreas !== undefined) updateData.practiceAreas = JSON.stringify(body.practiceAreas)
    if (body.holidays !== undefined) updateData.holidays = JSON.stringify(body.holidays)
    if (body.colorPrimary !== undefined) updateData.colorPrimary = body.colorPrimary
    if (body.colorAccent !== undefined) updateData.colorAccent = body.colorAccent
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.businessName !== undefined) updateData.businessName = body.businessName

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    await prisma.turnosSubscription.update({
      where: { id: sub.id },
      data: updateData,
    })

    return NextResponse.json({ status: 'updated' })
  } catch (err) {
    console.error('[Turnos Config PUT] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
