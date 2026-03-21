import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET

/**
 * Verify MercadoPago webhook signature (HMAC-SHA256).
 * Header x-signature: "ts=...,v1=..."
 * Data template: "id:{data.id};request-id:{x-request-id};ts:{ts};"
 */
function verifyMPSignature(req: NextRequest, body: Record<string, unknown>): boolean {
  if (!MP_WEBHOOK_SECRET) {
    console.error('[MP Webhook] MP_WEBHOOK_SECRET not configured — rejecting all webhooks for security')
    return false
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  if (!xSignature || !xRequestId) {
    console.warn('[MP Webhook] Missing x-signature or x-request-id headers')
    return false
  }

  // Parse ts and v1 from "ts=123456,v1=abcdef..."
  const parts = Object.fromEntries(
    xSignature.split(',').map(p => {
      const [k, ...v] = p.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  // Build the manifest string per MP docs
  const dataId = (body.data as Record<string, unknown>)?.id ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex')

  return hmac === v1
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 webhooks per minute per IP (MP sends retries)
    const ip = getClientIp(req)
    const rl = checkRateLimit(`mp-webhook:${ip}`, { maxRequests: 30, windowSeconds: 60 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const body = await req.json()
    console.log('[MP Webhook] Received:', JSON.stringify(body))

    // Verify webhook signature
    if (!verifyMPSignature(req, body)) {
      console.error('[MP Webhook] Invalid signature — rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

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
          // Idempotency: skip if already provisioned/active
          const currentSub = await prisma.monitoringSubscription.findUnique({
            where: { id: subscriptionId },
          })
          if (currentSub && ['active', 'provisioning'].includes(currentSub.status)) {
            console.log(`[MP Webhook] Monitoring ${subscriptionId} already ${currentSub.status} — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage now that payment is confirmed
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
            console.log(`[MP Webhook] Coupon ${currentSub.couponId} usage incremented`)
          }

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

          // Trigger deprovisioning — remove tenant from n8n scrapers
          await triggerDeprovisioning(subscriptionId)
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

/** Trigger n8n deprovisioning — remove tenant from scraper workflows */
async function triggerDeprovisioning(subscriptionId: string) {
  const apiKey = process.env.SCRAPER_API_KEY
  if (!apiKey) {
    console.warn('[MP Webhook] SCRAPER_API_KEY not configured — manual deprovisioning required')
    return
  }

  try {
    const sub = await prisma.monitoringSubscription.findUnique({
      where: { id: subscriptionId },
    })
    if (!sub?.n8nTenantId) {
      console.log(`[MP Webhook] Subscription ${subscriptionId} has no tenantId — skip deprovision`)
      return
    }

    const tenantsRemoveUrl = `https://n8n.abogadoenquilmes.com/webhook/alj-tenants-remove?apiKey=${apiKey}`
    const res = await fetch(tenantsRemoveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: sub.n8nTenantId }),
    })

    console.log(`[MP Webhook] Deprovision tenant ${sub.n8nTenantId}: ${res.status}`)
  } catch (err) {
    console.error('[MP Webhook] Failed to trigger deprovisioning:', err)
  }
}

// MP verifica el endpoint con GET al registrarlo
export async function GET() {
  return NextResponse.json({ status: 'MP webhook activo' })
}
