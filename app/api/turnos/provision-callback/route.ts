import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

/**
 * POST /api/turnos/provision-callback
 * Called by n8n Turnos-Provisioning workflow after cloning the base workflow.
 * Body: { subscriptionId, n8nWorkflowId, slug, status }
 * Auth: X-Provision-Key header must match TURNOS_PROVISION_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const provisionKey = req.headers.get('x-provision-key')
    const secret = process.env.TURNOS_PROVISION_SECRET
    if (!secret || !provisionKey || !safeCompare(provisionKey, secret)) {
      console.error('[Turnos Callback] Invalid or missing provision key')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, n8nWorkflowId, slug, status } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
    }

    const finalStatus = status === 'error' ? 'error' : 'active'

    const { count } = await prisma.turnosSubscription.updateMany({
      where: { id: subscriptionId, status: 'provisioning' },
      data: {
        status: finalStatus,
        n8nWorkflowId: n8nWorkflowId || null,
        slug: slug || undefined,
        provisionedAt: new Date(),
      },
    })

    console.log(`[Turnos Callback] subscriptionId=${subscriptionId} wfId=${n8nWorkflowId} slug=${slug} status=${finalStatus} updated=${count > 0}`)
    return NextResponse.json({ received: true, updated: count > 0 })
  } catch (err) {
    console.error('[Turnos Callback] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
