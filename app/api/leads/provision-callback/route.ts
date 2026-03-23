import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/leads/provision-callback
 * Called by n8n provisioning workflow after cloning and activating the leads workflow.
 * Updates subscription status to 'active' with googleSheetUrl and n8nWorkflowId.
 *
 * Body: { subscriptionId, n8nWorkflowId, googleSheetUrl, status }
 * Auth: X-Provision-Key header must match LEADS_PROVISION_SECRET env var
 */
export async function POST(req: NextRequest) {
  try {
    // Verify provision secret
    const provisionKey = req.headers.get('x-provision-key')
    const secret = process.env.LEADS_PROVISION_SECRET
    if (!secret || provisionKey !== secret) {
      console.error('[Leads Callback] Invalid or missing provision key')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, n8nWorkflowId, googleSheetUrl, status } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
    }

    console.log(`[Leads Callback] subscriptionId=${subscriptionId} wfId=${n8nWorkflowId} sheet=${googleSheetUrl} status=${status}`)

    // Update subscription — only if still in 'provisioning' state (idempotent)
    const { count } = await prisma.leadsSubscription.updateMany({
      where: { id: subscriptionId, status: 'provisioning' },
      data: {
        status: status || 'active',
        n8nWorkflowId: n8nWorkflowId || null,
        googleSheetUrl: googleSheetUrl || null,
        provisionedAt: new Date(),
      },
    })

    if (count === 0) {
      console.log(`[Leads Callback] Subscription ${subscriptionId} not in 'provisioning' state — skipping`)
      return NextResponse.json({ received: true, updated: false })
    }

    console.log(`[Leads Callback] Subscription ${subscriptionId} → active`)
    return NextResponse.json({ received: true, updated: true })
  } catch (err) {
    console.error('[Leads Callback] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
