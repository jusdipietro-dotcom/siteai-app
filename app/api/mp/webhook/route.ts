import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const N8N_API_URL = process.env.N8N_API_URL
const N8N_API_KEY = process.env.N8N_API_KEY

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
      const parts = (external_reference ?? '').split(':')

      console.log(`[MP Webhook] preapproval=${preapprovalId} | status=${status} | ref=${external_reference}`)

      // ─── Monitoring subscription: "monitoring:subscriptionId:plan" ───
      if (parts[0] === 'monitoring') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid monitoring external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const subscriptionId = parts[1]
        const plan = parts[2]

        if (status === 'authorized' && subscriptionId) {
          await prisma.monitoringSubscription.update({
            where: { id: subscriptionId },
            data: { status: 'provisioning', preapprovalId },
          })
          console.log(`[MP Webhook] Monitoring ${subscriptionId} → provisioning (plan: ${plan})`)

          // Trigger auto-provisioning via n8n webhook
          await triggerProvisioning(subscriptionId)
        }

        if ((status === 'cancelled' || status === 'paused') && subscriptionId) {
          await prisma.monitoringSubscription.update({
            where: { id: subscriptionId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Monitoring ${subscriptionId} suspended (${status})`)
        }

        return NextResponse.json({ received: true })
      }

      // ─── Website project subscription: "projectId:plan" ───
      const [projectId, plan] = parts

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

/** Trigger n8n provisioning webhook for a monitoring subscription */
async function triggerProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  try {
    const sub = await prisma.monitoringSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!sub) return

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: sub.id,
        userId: sub.userId,
        userEmail: sub.user.email,
        userName: sub.user.name,
        plan: sub.plan,
        portal: sub.portal,
        cuil: sub.cuil,
        notificationEmail: sub.notificationEmail,
        payerEmail: sub.payerEmail,
      }),
    })

    console.log(`[MP Webhook] Provisioning webhook response: ${res.status}`)
  } catch (err) {
    console.error('[MP Webhook] Failed to trigger provisioning:', err)
    // Don't throw — the subscription is already marked as provisioning
    // Manual provisioning can be done within 48hs
  }
}

// MP verifica el endpoint con GET al registrarlo
export async function GET() {
  return NextResponse.json({ status: 'MP webhook activo' })
}
