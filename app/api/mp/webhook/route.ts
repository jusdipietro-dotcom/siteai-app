import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[MP Webhook] Received:', JSON.stringify(body))

    if (body.type === 'preapproval' && body.data?.id) {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${body.data.id}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
      })

      const preapproval = await res.json()
      const { status, external_reference, id: preapprovalId } = preapproval

      // external_reference format: "projectId:plan"
      const [projectId, plan] = (external_reference ?? '').split(':')

      console.log(
        `[MP Webhook] preapproval=${preapprovalId} | status=${status} | project=${projectId} | plan=${plan}`
      )

      if (status === 'authorized' && projectId) {
        await prisma.project.updateMany({
          where: { id: projectId },
          data: { hasPaid: true, plan: plan ?? 'essential', preapprovalId },
        })
        console.log(`[MP Webhook] Project ${projectId} activated — plan: ${plan}`)
      }

      if ((status === 'cancelled' || status === 'paused') && projectId) {
        await prisma.project.updateMany({
          where: { id: projectId },
          data: { hasPaid: false },
        })
        console.log(`[MP Webhook] Project ${projectId} deactivated (${status})`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[MP Webhook] Error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

// MP verifica el endpoint con GET al registrarlo
export async function GET() {
  return NextResponse.json({ status: 'MP webhook activo' })
}
