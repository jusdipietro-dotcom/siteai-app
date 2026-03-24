import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/prospeccion/provision-callback
 * Called by n8n provisioning workflow after cloning and activating the prospeccion workflows.
 * Updates subscription status to 'active' with n8nLeadWorkflowId, n8nIcebreakerWorkflowId, and googleSheetUrl.
 *
 * Body: { subscriptionId, n8nLeadWorkflowId, n8nIcebreakerWorkflowId, googleSheetUrl, status }
 * Auth: X-Provision-Key header must match PROSPECCION_PROVISION_SECRET env var
 */
export async function POST(req: NextRequest) {
  try {
    // Verify provision secret
    const provisionKey = req.headers.get('x-provision-key')
    const secret = process.env.PROSPECCION_PROVISION_SECRET
    if (!secret || provisionKey !== secret) {
      console.error('[Prospeccion Callback] Invalid or missing provision key')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, n8nLeadWorkflowId, n8nIcebreakerWorkflowId, googleSheetUrl, status } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
    }

    console.log(`[Prospeccion Callback] subscriptionId=${subscriptionId} leadWfId=${n8nLeadWorkflowId} icebreakerWfId=${n8nIcebreakerWorkflowId} sheet=${googleSheetUrl} status=${status}`)

    // Update subscription — only if still in 'provisioning' state (idempotent)
    const { count } = await prisma.prospeccionSubscription.updateMany({
      where: { id: subscriptionId, status: 'provisioning' },
      data: {
        status: status || 'active',
        n8nLeadWorkflowId: n8nLeadWorkflowId || null,
        n8nIcebreakerWorkflowId: n8nIcebreakerWorkflowId || null,
        googleSheetId: googleSheetUrl || null,
        provisionedAt: new Date(),
      },
    })

    if (count === 0) {
      console.log(`[Prospeccion Callback] Subscription ${subscriptionId} not in 'provisioning' state — skipping`)
      return NextResponse.json({ received: true, updated: false })
    }

    console.log(`[Prospeccion Callback] Subscription ${subscriptionId} → active`)
    return NextResponse.json({ received: true, updated: true })
  } catch (err) {
    console.error('[Prospeccion Callback] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
