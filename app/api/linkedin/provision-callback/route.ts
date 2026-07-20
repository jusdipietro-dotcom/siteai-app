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
 * POST /api/linkedin/provision-callback
 * Called by n8n LinkedIn-Provisioning workflow after registering the profile.
 * Body: { subscriptionId, status }
 * Auth: X-Provision-Key header must match LINKEDIN_PROVISION_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    const provisionKey = req.headers.get('x-provision-key')
    const secret = process.env.LINKEDIN_PROVISION_SECRET
    if (!secret || !provisionKey || !safeCompare(provisionKey, secret)) {
      console.error('[LinkedIn Callback] Invalid or missing provision key')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, status } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
    }

    const finalStatus = status === 'error' ? 'error' : 'active'

    const { count } = await prisma.linkedInSubscription.updateMany({
      where: { id: subscriptionId, status: 'provisioning' },
      data: {
        status: finalStatus,
        provisionedAt: new Date(),
      },
    })

    console.log(`[LinkedIn Callback] subscriptionId=${subscriptionId} status=${finalStatus} updated=${count > 0}`)
    return NextResponse.json({ received: true, updated: count > 0 })
  } catch (err) {
    console.error('[LinkedIn Callback] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
