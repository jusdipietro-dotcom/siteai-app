import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { sendReviewRequestEmail } from '@/lib/email'
import { isValidEmail } from '@/lib/validators'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  to: z.string().email(),
  customerName: z.string().min(2).max(120),
  productUsed: z.string().min(2).max(80),
  daysActive: z.number().int().min(0).max(3650).optional(),
  googleReviewUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  if (!isValidEmail(parsed.data.to)) {
    return NextResponse.json({ error: 'Email destinatario invalido' }, { status: 400 })
  }

  try {
    await sendReviewRequestEmail(parsed.data.to, {
      customerName: parsed.data.customerName,
      productUsed: parsed.data.productUsed,
      daysActive: parsed.data.daysActive,
      googleReviewUrl: parsed.data.googleReviewUrl,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/request-review]', err)
    return NextResponse.json({ error: 'Falló el envío' }, { status: 500 })
  }
}
