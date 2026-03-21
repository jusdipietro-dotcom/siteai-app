import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 3 requests per 10 minutes per IP
    const ip = getClientIp(req)
    const rl = checkRateLimit(`forgot-pw:${ip}`, { maxRequests: 3, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Always return success to avoid email enumeration
    const successResponse = NextResponse.json({ ok: true })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.password) {
      // User doesn't exist or uses Google OAuth — return success anyway
      return successResponse
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://automaticialab.com'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail(email, resetUrl)
      console.log(`[Forgot Password] Reset email sent to ${email}`)
    } catch (err) {
      console.error('[Forgot Password] Failed to send email:', err)
      return NextResponse.json({ error: 'Error al enviar el email. Intentá de nuevo.' }, { status: 500 })
    }

    return successResponse
  } catch (err) {
    console.error('[Forgot Password] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
