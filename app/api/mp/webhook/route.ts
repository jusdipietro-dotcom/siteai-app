import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendPaymentConfirmationEmail, sendSubscriptionCancelledEmail } from '@/lib/email'

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

      // ─── Monitoring subscription: "monitoring:subscriptionId:plan[:replacesSubId]" ───
      if (parts[0] === 'monitoring') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid monitoring external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const subscriptionId = parts[1]
        const plan = parts[2]
        const replacesSubId = parts[3] || null // Optional: old subscription being replaced

        if (status === 'authorized' && subscriptionId) {
          // Atomic idempotency: only update if still pending_payment
          const { count } = await prisma.monitoringSubscription.updateMany({
            where: { id: subscriptionId, status: 'pending_payment' },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Monitoring ${subscriptionId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (safe: only reaches here once due to atomic update above)
          const currentSub = await prisma.monitoringSubscription.findUnique({
            where: { id: subscriptionId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
            console.log(`[MP Webhook] Coupon ${currentSub.couponId} usage incremented`)
          }

          // If this is a plan change, cancel the old subscription first
          if (replacesSubId) {
            await cancelOldSubscription(replacesSubId)
            console.log(`[MP Webhook] Old subscription ${replacesSubId} cancelled (replaced by ${subscriptionId})`)
          }

          console.log(`[MP Webhook] Monitoring ${subscriptionId} → provisioning (plan: ${plan})`)

          // Trigger auto-provisioning via n8n webhook (with retry)
          await triggerProvisioning(subscriptionId)

          // Send payment confirmation email
          try {
            const userForEmail = await prisma.monitoringSubscription.findUnique({
              where: { id: subscriptionId },
              include: { user: { select: { email: true } } },
            })
            if (userForEmail?.user.email) {
              await sendPaymentConfirmationEmail(userForEmail.user.email, {
                type: 'monitoring',
                plan,
              })
              console.log(`[MP Webhook] Payment confirmation email sent to ${userForEmail.user.email}`)
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && subscriptionId) {
          await prisma.monitoringSubscription.update({
            where: { id: subscriptionId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Monitoring ${subscriptionId} suspended (${status})`)

          // Trigger deprovisioning — remove tenant from n8n scrapers
          await triggerDeprovisioning(subscriptionId)

          // Send cancellation email
          try {
            const subForEmail = await prisma.monitoringSubscription.findUnique({
              where: { id: subscriptionId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'monitoring',
                plan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Reviews subscription: "reviews:subscriptionId:plan" ───
      if (parts[0] === 'reviews') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid reviews external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const reviewsSubId = parts[1]
        const reviewsPlan = parts[2]

        if (status === 'authorized' && reviewsSubId) {
          // Atomic idempotency: only update if still pending_payment
          const { count } = await prisma.reviewsSubscription.updateMany({
            where: { id: reviewsSubId, status: 'pending_payment' },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Reviews ${reviewsSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (safe: only reaches here once due to atomic update above)
          const currentSub = await prisma.reviewsSubscription.findUnique({
            where: { id: reviewsSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Reviews ${reviewsSubId} → provisioning (plan: ${reviewsPlan})`)

          // Trigger auto-provisioning via n8n webhook
          await triggerReviewsProvisioning(reviewsSubId)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.reviewsSubscription.findUnique({
              where: { id: reviewsSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'reviews',
                plan: reviewsPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send reviews payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && reviewsSubId) {
          await prisma.reviewsSubscription.update({
            where: { id: reviewsSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Reviews ${reviewsSubId} suspended (${status})`)

          // Trigger deprovisioning
          await triggerReviewsDeprovisioning(reviewsSubId)

          try {
            const subForEmail = await prisma.reviewsSubscription.findUnique({
              where: { id: reviewsSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'reviews',
                plan: reviewsPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send reviews cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── LinkedIn subscription: "linkedin:subscriptionId:plan" ───
      if (parts[0] === 'linkedin') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid linkedin external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const linkedinSubId = parts[1]
        const linkedinPlan = parts[2]

        if (status === 'authorized' && linkedinSubId) {
          // Atomic idempotency: only update if still pending_payment
          const { count } = await prisma.linkedInSubscription.updateMany({
            where: { id: linkedinSubId, status: 'pending_payment' },
            data: { status: 'active', preapprovalId, provisionedAt: new Date() },
          })

          if (count === 0) {
            console.log(`[MP Webhook] LinkedIn ${linkedinSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (safe: only reaches here once)
          const currentSub = await prisma.linkedInSubscription.findUnique({
            where: { id: linkedinSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] LinkedIn ${linkedinSubId} → active (plan: ${linkedinPlan})`)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.linkedInSubscription.findUnique({
              where: { id: linkedinSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'linkedin',
                plan: linkedinPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send linkedin payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && linkedinSubId) {
          await prisma.linkedInSubscription.update({
            where: { id: linkedinSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] LinkedIn ${linkedinSubId} suspended (${status})`)

          try {
            const subForEmail = await prisma.linkedInSubscription.findUnique({
              where: { id: linkedinSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'linkedin',
                plan: linkedinPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send linkedin cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Trading subscription: "trading:subscriptionId:plan" ───
      if (parts[0] === 'trading') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid trading external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const tradingSubId = parts[1]
        const tradingPlan = parts[2]

        if (status === 'authorized' && tradingSubId) {
          // Atomic idempotency: only update if still pending_payment
          const { count } = await prisma.tradingSubscription.updateMany({
            where: { id: tradingSubId, status: 'pending_payment' },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Trading ${tradingSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (safe: only reaches here once)
          const currentSub = await prisma.tradingSubscription.findUnique({
            where: { id: tradingSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Trading ${tradingSubId} → provisioning (plan: ${tradingPlan})`)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.tradingSubscription.findUnique({
              where: { id: tradingSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'trading',
                plan: tradingPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send trading payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && tradingSubId) {
          await prisma.tradingSubscription.update({
            where: { id: tradingSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Trading ${tradingSubId} suspended (${status})`)

          try {
            const subForEmail = await prisma.tradingSubscription.findUnique({
              where: { id: tradingSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'trading',
                plan: tradingPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send trading cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Leads subscription: "leads:subscriptionId:plan" ───
      if (parts[0] === 'leads') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid leads external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const leadsSubId = parts[1]
        const leadsPlan = parts[2]

        if (status === 'authorized' && leadsSubId) {
          const { count } = await prisma.leadsSubscription.updateMany({
            where: { id: leadsSubId, status: 'pending_payment' },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Leads ${leadsSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          const currentSub = await prisma.leadsSubscription.findUnique({
            where: { id: leadsSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Leads ${leadsSubId} → provisioning (plan: ${leadsPlan})`)

          // Trigger leads provisioning via n8n
          await triggerLeadsProvisioning(leadsSubId)

          try {
            const subForEmail = await prisma.leadsSubscription.findUnique({
              where: { id: leadsSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'leads',
                plan: leadsPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send leads payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && leadsSubId) {
          await prisma.leadsSubscription.update({
            where: { id: leadsSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Leads ${leadsSubId} suspended (${status})`)

          try {
            const subForEmail = await prisma.leadsSubscription.findUnique({
              where: { id: leadsSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'leads',
                plan: leadsPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send leads cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Email Marketing subscription: "emailmarketing:subscriptionId:plan" ───
      if (parts[0] === 'emailmarketing') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid emailmarketing external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const emSubId = parts[1]
        const emPlan = parts[2]

        // Validate plan exists
        const validPlans = ['basico', 'profesional', 'premium']
        if (!validPlans.includes(emPlan)) {
          console.warn(`[MP Webhook] Invalid email marketing plan in external_reference: ${emPlan}`)
          return NextResponse.json({ received: true })
        }

        if (status === 'authorized' && emSubId) {
          // Atomic update: payment confirmed → awaiting_contacts (user must upload CSV)
          const { count } = await prisma.emailMarketingSubscription.updateMany({
            where: { id: emSubId, status: 'pending_payment' },
            data: { status: 'awaiting_contacts', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Email Marketing ${emSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (only if atomic update succeeded — prevents double-increment)
          const currentSub = await prisma.emailMarketingSubscription.findUnique({
            where: { id: emSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          // Use the plan from the DB (source of truth), not from external_reference
          const activatedPlan = currentSub?.plan ?? emPlan
          console.log(`[MP Webhook] Email Marketing ${emSubId} → awaiting_contacts (plan: ${activatedPlan})`)

          // NOTE: provisioning is NOT triggered here — it happens after user uploads contacts

          try {
            const subForEmail = await prisma.emailMarketingSubscription.findUnique({
              where: { id: emSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'email-marketing',
                plan: activatedPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send email marketing payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && emSubId) {
          await prisma.emailMarketingSubscription.update({
            where: { id: emSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Email Marketing ${emSubId} suspended (${status})`)

          // Trigger deprovisioning (disable n8n workflow)
          await triggerEmailMarketingDeprovisioning(emSubId)

          try {
            const subForEmail = await prisma.emailMarketingSubscription.findUnique({
              where: { id: emSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'email-marketing',
                plan: emPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send email marketing cancellation email:', emailErr)
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Prospeccion subscription: "prospeccion:subscriptionId:plan" ───
      if (parts[0] === 'prospeccion') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid prospeccion external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const prospSubId = parts[1]
        const prospPlan = parts[2]

        // Validate plan exists
        const validProspPlans = ['starter', 'profesional', 'enterprise']
        if (!validProspPlans.includes(prospPlan)) {
          console.warn(`[MP Webhook] Invalid prospeccion plan in external_reference: ${prospPlan}`)
          return NextResponse.json({ received: true })
        }

        if (status === 'authorized' && prospSubId) {
          // Atomic idempotency: only update if still pending_payment
          const { count } = await prisma.prospeccionSubscription.updateMany({
            where: { id: prospSubId, status: 'pending_payment' },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Prospeccion ${prospSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (only if atomic update succeeded — prevents double-increment)
          const currentSub = await prisma.prospeccionSubscription.findUnique({
            where: { id: prospSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          const activatedPlan = currentSub?.plan ?? prospPlan
          console.log(`[MP Webhook] Prospeccion ${prospSubId} → provisioning (plan: ${activatedPlan})`)

          // Trigger prospeccion provisioning via n8n
          await triggerProspeccionProvisioning(prospSubId)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.prospeccionSubscription.findUnique({
              where: { id: prospSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'prospeccion',
                plan: activatedPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send prospeccion payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && prospSubId) {
          await prisma.prospeccionSubscription.update({
            where: { id: prospSubId },
            data: { status: 'suspended' },
          })
          console.log(`[MP Webhook] Prospeccion ${prospSubId} suspended (${status})`)

          // Trigger deprovisioning (disable n8n workflows)
          await triggerProspeccionDeprovisioning(prospSubId)

          try {
            const subForEmail = await prisma.prospeccionSubscription.findUnique({
              where: { id: prospSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                type: 'prospeccion',
                plan: prospPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send prospeccion cancellation email:', emailErr)
          }
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

        // Send payment confirmation email
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { user: { select: { email: true } } },
          })
          if (project?.user.email) {
            await sendPaymentConfirmationEmail(project.user.email, {
              type: 'project',
              plan: plan ?? 'essential',
            })
          }
        } catch (emailErr) {
          console.error('[MP Webhook] Failed to send project payment email:', emailErr)
        }
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

/** Trigger n8n provisioning webhook with retry (3 attempts, exponential backoff) */
async function triggerProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  const sub = await prisma.monitoringSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const payload = JSON.stringify({
    subscriptionId: sub.id,
    userId: sub.userId,
    userEmail: sub.user.email,
    userName: sub.user.name,
    plan: sub.plan,
    portal: sub.portal,
    cuil: sub.cuil,
    notificationEmail: sub.notificationEmail,
    payerEmail: sub.payerEmail,
  })

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        console.log(`[MP Webhook] Provisioning OK (attempt ${attempt}): ${res.status}`)
        return
      }

      console.warn(`[MP Webhook] Provisioning attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status}`)
    } catch (err) {
      console.error(`[MP Webhook] Provisioning attempt ${attempt}/${MAX_RETRIES} error:`, err)
    }

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 2000 // 2s, 4s
      await new Promise(r => setTimeout(r, delay))
    }
  }

  console.error(`[MP Webhook] Provisioning FAILED after ${MAX_RETRIES} attempts for ${subscriptionId} — manual provisioning required`)
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

/** Cancel old subscription when a plan change is confirmed */
async function cancelOldSubscription(oldSubId: string) {
  const ACCESS = process.env.MP_ACCESS_TOKEN
  const apiKey = process.env.SCRAPER_API_KEY

  try {
    const oldSub = await prisma.monitoringSubscription.findUnique({ where: { id: oldSubId } })
    if (!oldSub || oldSub.status === 'cancelled') return

    // Cancel MP preapproval
    if (oldSub.preapprovalId && ACCESS) {
      try {
        await fetch(`https://api.mercadopago.com/preapproval/${oldSub.preapprovalId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${ACCESS}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
      } catch (err) {
        console.error(`[MP Webhook] Failed to cancel old MP preapproval ${oldSub.preapprovalId}:`, err)
      }
    }

    // Remove tenant from n8n scrapers
    if (oldSub.n8nTenantId && apiKey) {
      try {
        await fetch(`https://n8n.abogadoenquilmes.com/webhook/alj-tenants-remove?apiKey=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: oldSub.n8nTenantId }),
        })
      } catch (err) {
        console.error(`[MP Webhook] Failed to remove old tenant ${oldSub.n8nTenantId}:`, err)
      }
    }

    // Mark as cancelled
    await prisma.monitoringSubscription.update({
      where: { id: oldSubId },
      data: { status: 'cancelled' },
    })
  } catch (err) {
    console.error(`[MP Webhook] Error cancelling old subscription ${oldSubId}:`, err)
  }
}

/** Trigger n8n reviews provisioning webhook with retry */
async function triggerReviewsProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_REVIEWS_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_REVIEWS_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  const sub = await prisma.reviewsSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const payload = JSON.stringify({
    subscriptionId: sub.id,
    userId: sub.userId,
    userEmail: sub.user.email,
    userName: sub.user.name,
    plan: sub.plan,
    businessName: sub.businessName,
    businessType: sub.businessType,
    searchUrl: sub.searchUrl,
    googleEmail: sub.googleEmail,
    responseTone: sub.responseTone,
    notificationEmail: sub.notificationEmail,
  })

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        console.log(`[MP Webhook] Reviews provisioning OK (attempt ${attempt}): ${res.status}`)
        return
      }

      console.warn(`[MP Webhook] Reviews provisioning attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status}`)
    } catch (err) {
      console.error(`[MP Webhook] Reviews provisioning attempt ${attempt}/${MAX_RETRIES} error:`, err)
    }

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 2000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  console.error(`[MP Webhook] Reviews provisioning FAILED after ${MAX_RETRIES} attempts for ${subscriptionId}`)
}

/** Trigger n8n reviews deprovisioning */
async function triggerReviewsDeprovisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_REVIEWS_PROVISIONING_WEBHOOK
  if (!webhookUrl) return

  try {
    const sub = await prisma.reviewsSubscription.findUnique({
      where: { id: subscriptionId },
    })
    if (!sub?.n8nTenantId) return

    const deprovisionUrl = process.env.N8N_REVIEWS_DEPROVISION_WEBHOOK
      || webhookUrl.replace('reviews-provision', 'reviews-deprovision')
    const res = await fetch(deprovisionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, tenantId: sub.n8nTenantId }),
    })

    console.log(`[MP Webhook] Reviews deprovision tenant ${sub.n8nTenantId}: ${res.status}`)
  } catch (err) {
    console.error('[MP Webhook] Failed to trigger reviews deprovisioning:', err)
  }
}

/** Trigger n8n leads provisioning webhook with retry */
async function triggerLeadsProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_LEADS_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_LEADS_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  const sub = await prisma.leadsSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const payload = JSON.stringify({
    subscriptionId: sub.id,
    userId: sub.userId,
    userEmail: sub.user.email,
    userName: sub.user.name,
    plan: sub.plan,
    googleSheetUrl: sub.googleSheetUrl,
    nichesList: (() => { try { return JSON.parse(sub.nichesList) } catch { return [] } })(),
    citiesList: (() => { try { return JSON.parse(sub.citiesList) } catch { return [] } })(),
    captureFrequency: sub.captureFrequency,
    notificationEmail: sub.notificationEmail,
  })

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        console.log(`[MP Webhook] Leads provisioning OK (attempt ${attempt}): ${res.status}`)
        return
      }

      const body = await res.text().catch(() => '')
      console.warn(`[MP Webhook] Leads provisioning attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status} — ${body.slice(0, 300)}`)
    } catch (err) {
      console.error(`[MP Webhook] Leads provisioning attempt ${attempt}/${MAX_RETRIES} error:`, err)
    }

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 2000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  // Mark subscription as failed so admin can investigate
  console.error(`[MP Webhook] Leads provisioning FAILED after ${MAX_RETRIES} attempts for ${subscriptionId}`)
  try {
    await prisma.leadsSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'provision_failed' },
    })
  } catch (dbErr) {
    console.error(`[MP Webhook] Failed to mark subscription as provision_failed:`, dbErr)
  }
}

/** Trigger n8n email marketing provisioning webhook with retry */
async function triggerEmailMarketingProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  const sub = await prisma.emailMarketingSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const payload = JSON.stringify({
    subscriptionId: sub.id,
    userId: sub.userId,
    userEmail: sub.user.email,
    userName: sub.user.name,
    plan: sub.plan,
    businessName: sub.businessName,
    contactCount: sub.contactCount,
    senderName: sub.senderName,
    senderEmail: sub.senderEmail,
    notificationEmail: sub.notificationEmail,
  })

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        console.log(`[MP Webhook] Email Marketing provisioning OK (attempt ${attempt}): ${res.status}`)
        return
      }

      const body = await res.text().catch(() => '')
      console.warn(`[MP Webhook] Email Marketing provisioning attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status} — ${body.slice(0, 300)}`)
    } catch (err) {
      console.error(`[MP Webhook] Email Marketing provisioning attempt ${attempt}/${MAX_RETRIES} error:`, err)
    }

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 2000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  console.error(`[MP Webhook] Email Marketing provisioning FAILED after ${MAX_RETRIES} attempts for ${subscriptionId}`)
}

/** Deprovisioning: disable n8n workflow when subscription is cancelled/paused */
async function triggerEmailMarketingDeprovisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK not configured — manual deprovisioning required')
    return
  }

  const sub = await prisma.emailMarketingSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deprovision',
        subscriptionId: sub.id,
        userId: sub.userId,
        n8nWorkflowId: sub.n8nWorkflowId,
        businessName: sub.businessName,
      }),
    })
    console.log(`[MP Webhook] Email Marketing deprovisioning triggered for ${subscriptionId}`)
  } catch (err) {
    console.error(`[MP Webhook] Email Marketing deprovisioning failed for ${subscriptionId}:`, err)
  }
}

/** Trigger n8n prospeccion provisioning webhook with retry */
async function triggerProspeccionProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_PROSPECCION_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_PROSPECCION_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }

  const sub = await prisma.prospeccionSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const payload = JSON.stringify({
    subscriptionId: sub.id,
    userId: sub.userId,
    userEmail: sub.user.email,
    userName: sub.user.name,
    plan: sub.plan,
    businessName: sub.businessName,
    senderName: sub.senderName,
    senderEmail: sub.senderEmail,
    website: sub.website,
    nichesList: (() => { try { return JSON.parse(sub.nichesList) } catch { return [] } })(),
    citiesList: (() => { try { return JSON.parse(sub.citiesList) } catch { return [] } })(),
    serviciosDesc: sub.serviciosDesc,
    colorPrimario: sub.colorPrimario,
    notificationEmail: sub.notificationEmail,
  })

  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })

      if (res.ok) {
        console.log(`[MP Webhook] Prospeccion provisioning OK (attempt ${attempt}): ${res.status}`)
        return
      }

      const body = await res.text().catch(() => '')
      console.warn(`[MP Webhook] Prospeccion provisioning attempt ${attempt}/${MAX_RETRIES} failed: HTTP ${res.status} — ${body.slice(0, 300)}`)
    } catch (err) {
      console.error(`[MP Webhook] Prospeccion provisioning attempt ${attempt}/${MAX_RETRIES} error:`, err)
    }

    if (attempt < MAX_RETRIES) {
      const delay = attempt * 2000
      await new Promise(r => setTimeout(r, delay))
    }
  }

  // Mark subscription as failed so admin can investigate
  console.error(`[MP Webhook] Prospeccion provisioning FAILED after ${MAX_RETRIES} attempts for ${subscriptionId}`)
  try {
    await prisma.prospeccionSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'provision_failed' },
    })
  } catch (dbErr) {
    console.error(`[MP Webhook] Failed to mark prospeccion subscription as provision_failed:`, dbErr)
  }
}

/** Deprovisioning: disable n8n workflows when prospeccion subscription is cancelled/paused */
async function triggerProspeccionDeprovisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_PROSPECCION_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_PROSPECCION_PROVISIONING_WEBHOOK not configured — manual deprovisioning required')
    return
  }

  const sub = await prisma.prospeccionSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deprovision',
        subscriptionId: sub.id,
        userId: sub.userId,
        n8nLeadWorkflowId: sub.n8nLeadWorkflowId,
        n8nIcebreakerWorkflowId: sub.n8nIcebreakerWorkflowId,
        businessName: sub.businessName,
      }),
    })
    console.log(`[MP Webhook] Prospeccion deprovisioning triggered for ${subscriptionId}`)
  } catch (err) {
    console.error(`[MP Webhook] Prospeccion deprovisioning failed for ${subscriptionId}:`, err)
  }
}

// MP verifica el endpoint con GET al registrarlo
export async function GET() {
  return NextResponse.json({ status: 'MP webhook activo' })
}
