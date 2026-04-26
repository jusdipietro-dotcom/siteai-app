import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendInquiryNotificationEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_SERVICES = ['diseno-web', 'seo', 'custom', 'premium'] as const

const inquirySchema = z.object({
  service: z.enum(ALLOWED_SERVICES),
  packageId: z.string().max(80).optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(160).optional().nullable(),
  website: z.string().max(240).optional().nullable(),
  budget: z.string().max(80).optional().nullable(),
  message: z.string().min(10).max(4000),
  source: z.string().max(120).optional().nullable(),
  honeypot: z.string().max(0).optional(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)

  const limit = checkRateLimit(`inquiries:${ip}`, { maxRequests: 5, windowSeconds: 600 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas consultas desde esta IP. Intenta de nuevo mas tarde.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const parsed = inquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  if (parsed.data.honeypot && parsed.data.honeypot.length > 0) {
    return NextResponse.json({ ok: true, id: 'spam' }, { status: 200 })
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        service: parsed.data.service,
        packageId: parsed.data.packageId ?? null,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone?.trim() || null,
        company: parsed.data.company?.trim() || null,
        website: parsed.data.website?.trim() || null,
        budget: parsed.data.budget?.trim() || null,
        message: parsed.data.message.trim(),
        source: parsed.data.source?.trim() || null,
        ipAddress: ip,
        userAgent,
      },
    })

    sendInquiryNotificationEmail(inquiry).catch((err) => {
      console.error('[inquiries] email send failed', err)
    })

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 })
  } catch (err) {
    console.error('[inquiries] create failed', err)
    return NextResponse.json({ error: 'No se pudo guardar la consulta' }, { status: 500 })
  }
}
