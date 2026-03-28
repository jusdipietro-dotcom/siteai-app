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

    // Validate and sanitize inputs
    const colorRegex = /^#[0-9a-fA-F]{6}$/
    const maxStringLen = 200
    const maxJsonSize = 10000 // bytes

    if (body.scheduleDays !== undefined) {
      if (!Array.isArray(body.scheduleDays) || body.scheduleDays.some((d: unknown) => typeof d !== 'number' || d < 0 || d > 6))
        return NextResponse.json({ error: 'scheduleDays debe ser un array de numeros 0-6' }, { status: 400 })
      updateData.scheduleDays = JSON.stringify(body.scheduleDays)
    }
    if (body.scheduleSlots !== undefined) {
      const json = JSON.stringify(body.scheduleSlots)
      if (typeof body.scheduleSlots !== 'object' || json.length > maxJsonSize)
        return NextResponse.json({ error: 'scheduleSlots invalido o muy grande' }, { status: 400 })
      updateData.scheduleSlots = json
    }
    if (body.slotDuration !== undefined) {
      const dur = Number(body.slotDuration)
      if (!Number.isInteger(dur) || dur < 10 || dur > 120)
        return NextResponse.json({ error: 'slotDuration debe ser entre 10 y 120 minutos' }, { status: 400 })
      updateData.slotDuration = dur
    }
    if (body.practiceAreas !== undefined) {
      if (!Array.isArray(body.practiceAreas) || JSON.stringify(body.practiceAreas).length > maxJsonSize)
        return NextResponse.json({ error: 'practiceAreas invalido o muy grande' }, { status: 400 })
      updateData.practiceAreas = JSON.stringify(body.practiceAreas)
    }
    if (body.holidays !== undefined) {
      if (!Array.isArray(body.holidays) || JSON.stringify(body.holidays).length > maxJsonSize)
        return NextResponse.json({ error: 'holidays invalido o muy grande' }, { status: 400 })
      updateData.holidays = JSON.stringify(body.holidays)
    }
    if (body.colorPrimary !== undefined) {
      if (typeof body.colorPrimary !== 'string' || !colorRegex.test(body.colorPrimary))
        return NextResponse.json({ error: 'colorPrimary debe ser un color hex (#RRGGBB)' }, { status: 400 })
      updateData.colorPrimary = body.colorPrimary
    }
    if (body.colorAccent !== undefined) {
      if (typeof body.colorAccent !== 'string' || !colorRegex.test(body.colorAccent))
        return NextResponse.json({ error: 'colorAccent debe ser un color hex (#RRGGBB)' }, { status: 400 })
      updateData.colorAccent = body.colorAccent
    }
    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || body.phone.length > maxStringLen)
        return NextResponse.json({ error: 'phone invalido' }, { status: 400 })
      updateData.phone = body.phone
    }
    if (body.address !== undefined) {
      if (typeof body.address !== 'string' || body.address.length > maxStringLen)
        return NextResponse.json({ error: 'address invalido' }, { status: 400 })
      updateData.address = body.address
    }
    if (body.businessName !== undefined) {
      if (typeof body.businessName !== 'string' || body.businessName.length > maxStringLen || body.businessName.length < 1)
        return NextResponse.json({ error: 'businessName invalido' }, { status: 400 })
      updateData.businessName = body.businessName
    }

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
