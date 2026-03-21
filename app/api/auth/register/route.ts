import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per 10 minutes per IP
    const ip = getClientIp(req)
    const rl = checkRateLimit(`register:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos de registro. Esperá unos minutos.' }, { status: 429 })
    }

    const { name, email, password } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (err) {
    console.error('[Register] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
