import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendPaymentConfirmationEmail, sendSubscriptionCancelledEmail, sendAdminProvisioningAlert } from '@/lib/email'
import { getGraceEndDate, GRACE_PERIOD_MS } from '@/lib/project-billing'

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

  const hmacBuf = Buffer.from(hmac, 'hex')
  const v1Buf = Buffer.from(v1, 'hex')
  if (hmacBuf.length !== v1Buf.length) return false
  return timingSafeEqual(hmacBuf, v1Buf)
}

/**
 * Answer for a MercadoPago resource we could not read.
 *
 * MP retries a notification only while we keep answering non-2xx, so the status
 * we return here decides whether a lost event is recovered or lost for good.
 *
 * 404 is the single exception: it means the resource does not exist under our
 * credentials — another account's notification, or one already deleted. No
 * number of retries will make it readable, so we acknowledge it and move on.
 * That keeps "this notification is not for us" from retrying forever, while
 * everything else ("we could not reach MP": 401, 429, 5xx, timeouts) retries.
 */
function mpReadFailure(kind: string, id: unknown, httpStatus: number) {
  if (httpStatus === 404) {
    console.warn(`[MP Webhook] ${kind} ${id} not found (404) — not ours, acknowledging`)
    return NextResponse.json({ received: true })
  }
  console.error(
    `[MP Webhook] Could not fetch ${kind} ${id}: MP returned ${httpStatus} — answering 502 so MP retries`
  )
  return NextResponse.json(
    { error: 'Upstream MercadoPago read failed', kind, status: httpStatus },
    { status: 502 }
  )
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

      // A failed read must NOT be answered 200. On a 401/429/5xx the parsed body
      // is an error object: external_reference comes back undefined, no product
      // branch matches, and the handler used to fall all the way through to
      // `{ received: true }`. MP treats that as delivered and never retries, so a
      // cancellation lost to a transient MP outage left the site published and
      // unbilled forever. Answering 5xx puts the notification back in MP's retry
      // queue. See mpReadFailure() for why 404 is the one status we do not retry.
      if (!res.ok) {
        return mpReadFailure('preapproval', body.data.id, res.status)
      }

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
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.monitoringSubscription.updateMany({
            where: { id: subscriptionId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count } = await prisma.monitoringSubscription.updateMany({
            where: { id: subscriptionId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (count === 0) {
            console.log(`[MP Webhook] Monitoring ${subscriptionId} already suspended/cancelled — skipping`)
          } else {
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
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.reviewsSubscription.updateMany({
            where: { id: reviewsSubId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count: rCount } = await prisma.reviewsSubscription.updateMany({
            where: { id: reviewsSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (rCount === 0) {
            console.log(`[MP Webhook] Reviews ${reviewsSubId} already suspended/cancelled — skipping`)
          } else {
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
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          // Mark as 'provisioning' first; n8n callback will mark 'active' when ready.
          const { count } = await prisma.linkedInSubscription.updateMany({
            where: { id: linkedinSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
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

          console.log(`[MP Webhook] LinkedIn ${linkedinSubId} → provisioning (plan: ${linkedinPlan})`)

          // Trigger n8n provisioning workflow (will callback /api/linkedin/provision-callback)
          await triggerLinkedInProvisioning(linkedinSubId).catch((e) =>
            console.error('[MP Webhook] LinkedIn n8n trigger error:', e)
          )

          // Send payment confirmation email + admin alert (kept as fallback)
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

              await sendAdminProvisioningAlert({
                product: 'LinkedIn Optimizer',
                plan: linkedinPlan,
                subscriptionId: linkedinSubId,
                userEmail: subForEmail.user.email,
                notificationEmail: subForEmail.notificationEmail,
                payerEmail: subForEmail.payerEmail,
                extraInfo: {
                  'LinkedIn name': subForEmail.linkedinName ?? 'no especificado',
                  Industria: subForEmail.industry ?? '',
                  Audiencia: subForEmail.audience ?? '',
                },
              }).catch((e) => console.error('[MP Webhook] LinkedIn admin alert failed:', e))
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send linkedin payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && linkedinSubId) {
          const { count: lCount } = await prisma.linkedInSubscription.updateMany({
            where: { id: linkedinSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (lCount === 0) {
            console.log(`[MP Webhook] LinkedIn ${linkedinSubId} already suspended/cancelled — skipping`)
          } else {
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
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.tradingSubscription.updateMany({
            where: { id: tradingSubId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count: tCount } = await prisma.tradingSubscription.updateMany({
            where: { id: tradingSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (tCount === 0) {
            console.log(`[MP Webhook] Trading ${tradingSubId} already suspended/cancelled — skipping`)
          } else {
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
            where: { id: leadsSubId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count: ldCount } = await prisma.leadsSubscription.updateMany({
            where: { id: leadsSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (ldCount === 0) {
            console.log(`[MP Webhook] Leads ${leadsSubId} already suspended/cancelled — skipping`)
          } else {
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
            where: { id: emSubId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count: emCount } = await prisma.emailMarketingSubscription.updateMany({
            where: { id: emSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'awaiting_contacts', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (emCount === 0) {
            console.log(`[MP Webhook] Email Marketing ${emSubId} already suspended/cancelled — skipping`)
          } else {
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
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.prospeccionSubscription.updateMany({
            where: { id: prospSubId, status: { in: ['pending_payment', 'trial'] } },
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
          const { count: pCount } = await prisma.prospeccionSubscription.updateMany({
            where: { id: prospSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (pCount === 0) {
            console.log(`[MP Webhook] Prospeccion ${prospSubId} already suspended/cancelled — skipping`)
          } else {
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
        }

        return NextResponse.json({ received: true })
      }

      // ─── Turnos subscription: "turnos:subscriptionId:plan" ───
      if (parts[0] === 'turnos') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid turnos external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const turnosSubId = parts[1]
        const turnosPlan = parts[2]

        if (status === 'authorized' && turnosSubId) {
          const { count } = await prisma.turnosSubscription.updateMany({
            where: { id: turnosSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Turnos ${turnosSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          const currentTurnosSub = await prisma.turnosSubscription.findUnique({ where: { id: turnosSubId } })
          if (currentTurnosSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentTurnosSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Turnos ${turnosSubId} → provisioning (plan: ${turnosPlan})`)

          // Trigger n8n provisioning workflow (will callback /api/turnos/provision-callback)
          await triggerTurnosProvisioning(turnosSubId).catch((e) =>
            console.error('[MP Webhook] Turnos n8n trigger error:', e)
          )

          try {
            const subForEmail = await prisma.turnosSubscription.findUnique({
              where: { id: turnosSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'turnos',
                plan: turnosPlan,
              })

              // Turnos requires manual workflow cloning per tenant → alert admin
              await sendAdminProvisioningAlert({
                product: 'Turnos Online',
                plan: turnosPlan,
                subscriptionId: turnosSubId,
                userEmail: subForEmail.user.email,
                notificationEmail: subForEmail.notificationEmail,
                payerEmail: subForEmail.payerEmail,
                extraInfo: {
                  'Slug': subForEmail.slug ?? 'no asignado',
                  'Workflow n8n ID': subForEmail.n8nWorkflowId ?? 'pendiente clonar',
                },
              }).catch((e) => console.error('[MP Webhook] Turnos admin alert failed:', e))
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send turnos payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && turnosSubId) {
          const { count: tCount } = await prisma.turnosSubscription.updateMany({
            where: { id: turnosSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (tCount > 0) {
            console.log(`[MP Webhook] Turnos ${turnosSubId} suspended (${status})`)

            // Deactivate n8n workflow
            const turnosSub = await prisma.turnosSubscription.findUnique({ where: { id: turnosSubId } })
            if (turnosSub?.n8nWorkflowId) {
              try {
                const n8nUrl = process.env.N8N_API_URL
                const n8nKey = process.env.N8N_API_KEY
                if (n8nUrl && n8nKey) {
                  await fetch(`${n8nUrl}/api/v1/workflows/${turnosSub.n8nWorkflowId}/deactivate`, {
                    method: 'POST',
                    headers: { 'X-N8N-API-KEY': n8nKey },
                  })
                }
              } catch (e) { console.error('[MP Webhook] Turnos n8n deactivation error:', e) }
            }

            try {
              const subForEmail = await prisma.turnosSubscription.findUnique({
                where: { id: turnosSubId },
                include: { user: { select: { email: true } } },
              })
              if (subForEmail?.user.email) {
                await sendSubscriptionCancelledEmail(subForEmail.user.email, { type: 'turnos', plan: turnosPlan })
              }
            } catch (emailErr) {
              console.error('[MP Webhook] Failed to send turnos cancellation email:', emailErr)
            }
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Causas subscription: "causas:subscriptionId:plan" ───
      if (parts[0] === 'causas') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid causas external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const causasSubId = parts[1]
        const causasPlan = parts[2]

        if (status === 'authorized' && causasSubId) {
          const { count } = await prisma.causasSubscription.updateMany({
            where: { id: causasSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Causas ${causasSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage
          const currentCausasSub = await prisma.causasSubscription.findUnique({
            where: { id: causasSubId },
          })
          if (currentCausasSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentCausasSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Causas ${causasSubId} → provisioning (plan: ${causasPlan})`)

          // Trigger auto-provisioning (register tenant in scraper service)
          await triggerCausasProvisioning(causasSubId)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.causasSubscription.findUnique({
              where: { id: causasSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'causas',
                plan: causasPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send causas payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && causasSubId) {
          const { count: cCount } = await prisma.causasSubscription.updateMany({
            where: { id: causasSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (cCount === 0) {
            console.log(`[MP Webhook] Causas ${causasSubId} already suspended/cancelled — skipping`)
          } else {
            console.log(`[MP Webhook] Causas ${causasSubId} suspended (${status})`)

            // Deactivate scraper tenant
            await triggerCausasDeprovisioning(causasSubId)

            try {
              const subForEmail = await prisma.causasSubscription.findUnique({
                where: { id: causasSubId },
                include: { user: { select: { email: true } } },
              })
              if (subForEmail?.user.email) {
                await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                  type: 'causas',
                  plan: causasPlan,
                })
              }
            } catch (emailErr) {
              console.error('[MP Webhook] Failed to send causas cancellation email:', emailErr)
            }
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Facturacion subscription: "facturacion:subscriptionId:plan" ───
      if (parts[0] === 'facturacion') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid facturacion external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const factSubId = parts[1]
        const factPlan = parts[2]

        if (status === 'authorized' && factSubId) {
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.facturacionSubscription.updateMany({
            where: { id: factSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Facturacion ${factSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage
          const currentSub = await prisma.facturacionSubscription.findUnique({
            where: { id: factSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Facturacion ${factSubId} → provisioning (plan: ${factPlan})`)

          // Trigger auto-provisioning (create tenant in Flask backend)
          await triggerFacturacionProvisioning(factSubId)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.facturacionSubscription.findUnique({
              where: { id: factSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'facturacion',
                plan: factPlan,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send facturacion payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && factSubId) {
          const { count: fCount } = await prisma.facturacionSubscription.updateMany({
            where: { id: factSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (fCount === 0) {
            console.log(`[MP Webhook] Facturacion ${factSubId} already suspended/cancelled — skipping`)
          } else {
            console.log(`[MP Webhook] Facturacion ${factSubId} suspended (${status})`)

            // Deactivate Flask tenant
            await triggerFacturacionDeprovisioning(factSubId)

            try {
              const subForEmail = await prisma.facturacionSubscription.findUnique({
                where: { id: factSubId },
                include: { user: { select: { email: true } } },
              })
              if (subForEmail?.user.email) {
                await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                  type: 'facturacion',
                  plan: factPlan,
                })
              }
            } catch (emailErr) {
              console.error('[MP Webhook] Failed to send facturacion cancellation email:', emailErr)
            }
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── LexPost subscription: "lexpost:subscriptionId:plan" ───
      if (parts[0] === 'lexpost') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid lexpost external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const lexpostSubId = parts[1]
        const lexpostPlan = parts[2]

        if (status === 'authorized' && lexpostSubId) {
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.lexPostSubscription.updateMany({
            where: { id: lexpostSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] LexPost ${lexpostSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage (safe: only reaches here once due to atomic update above)
          const currentSub = await prisma.lexPostSubscription.findUnique({
            where: { id: lexpostSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] LexPost ${lexpostSubId} → provisioning (plan: ${lexpostPlan})`)

          // Trigger n8n provisioning workflow (will callback /api/lexpost/provision-callback).
          // No-ops with a warning when N8N_LEXPOST_PROVISIONING_WEBHOOK is unset, which is
          // why the admin alert below is sent unconditionally as the manual fallback.
          await triggerLexpostProvisioning(lexpostSubId).catch((e) =>
            console.error('[MP Webhook] LexPost n8n trigger error:', e)
          )

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.lexPostSubscription.findUnique({
              where: { id: lexpostSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'lexpost',
                plan: lexpostPlan,
              })

              // Provisioning may still need a human (no n8n workflow configured) → alert admin
              await sendAdminProvisioningAlert({
                product: 'LexPost',
                plan: lexpostPlan,
                subscriptionId: lexpostSubId,
                userEmail: subForEmail.user.email,
                notificationEmail: subForEmail.notificationEmail,
                payerEmail: subForEmail.payerEmail,
                extraInfo: {
                  'IG username': subForEmail.igUsername ?? 'no especificado',
                  'IG accounts': subForEmail.igAccountCount,
                  'Publicaciones limit': subForEmail.publicationsLimit,
                },
              }).catch((e) => console.error('[MP Webhook] LexPost admin alert failed:', e))
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send lexpost payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && lexpostSubId) {
          const { count: lpCount } = await prisma.lexPostSubscription.updateMany({
            where: { id: lexpostSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (lpCount === 0) {
            console.log(`[MP Webhook] LexPost ${lexpostSubId} already suspended/cancelled — skipping`)
          } else {
            console.log(`[MP Webhook] LexPost ${lexpostSubId} suspended (${status})`)

            try {
              const subForEmail = await prisma.lexPostSubscription.findUnique({
                where: { id: lexpostSubId },
                include: { user: { select: { email: true } } },
              })
              if (subForEmail?.user.email) {
                await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                  type: 'lexpost',
                  plan: lexpostPlan,
                })
              }
            } catch (emailErr) {
              console.error('[MP Webhook] Failed to send lexpost cancellation email:', emailErr)
            }
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Suite Juridica subscription: "suite:subscriptionId:plan" ───
      if (parts[0] === 'suite') {
        if (parts.length < 3 || !parts[1] || !parts[2]) {
          console.warn('[MP Webhook] Invalid suite external_reference:', external_reference)
          return NextResponse.json({ received: true })
        }
        const suiteSubId = parts[1]
        const suitePlan = parts[2]

        if (status === 'authorized' && suiteSubId) {
          // Atomic idempotency: only update if still pending_payment or trial (trial-to-paid)
          const { count } = await prisma.suiteJuridicaSubscription.updateMany({
            where: { id: suiteSubId, status: { in: ['pending_payment', 'trial'] } },
            data: { status: 'provisioning', preapprovalId },
          })

          if (count === 0) {
            console.log(`[MP Webhook] Suite ${suiteSubId} already processed — skipping`)
            return NextResponse.json({ received: true })
          }

          // Increment coupon usage
          const currentSub = await prisma.suiteJuridicaSubscription.findUnique({
            where: { id: suiteSubId },
          })
          if (currentSub?.couponId) {
            await prisma.coupon.update({
              where: { id: currentSub.couponId },
              data: { usedCount: { increment: 1 } },
            })
          }

          console.log(`[MP Webhook] Suite ${suiteSubId} → provisioning (plan: ${suitePlan})`)

          // Provision: create 4 individual subscriptions in cascade
          await provisionSuiteJuridica(suiteSubId, suitePlan)

          // Send payment confirmation email
          try {
            const subForEmail = await prisma.suiteJuridicaSubscription.findUnique({
              where: { id: suiteSubId },
              include: { user: { select: { email: true } } },
            })
            if (subForEmail?.user.email) {
              await sendPaymentConfirmationEmail(subForEmail.user.email, {
                type: 'suite-juridica',
                plan: `Suite Juridica ${suitePlan}`,
              })
            }
          } catch (emailErr) {
            console.error('[MP Webhook] Failed to send suite payment email:', emailErr)
          }
        }

        if ((status === 'cancelled' || status === 'paused') && suiteSubId) {
          const { count: sCount } = await prisma.suiteJuridicaSubscription.updateMany({
            where: { id: suiteSubId, status: { in: ['active', 'provisioning', 'pending_payment', 'pending_config', 'trial'] } },
            data: { status: 'suspended' },
          })
          if (sCount === 0) {
            console.log(`[MP Webhook] Suite ${suiteSubId} already suspended/cancelled — skipping`)
          } else {
            console.log(`[MP Webhook] Suite ${suiteSubId} suspended (${status})`)

            // Suspend all 4 individual subscriptions
            const sub = await prisma.suiteJuridicaSubscription.findUnique({ where: { id: suiteSubId } })
            if (sub) {
              const suspendSub = async (table: string, id: string | null) => {
                if (!id) return
                try {
                  await prisma.$executeRawUnsafe(
                    `UPDATE "${table}" SET status = 'suspended' WHERE id = $1 AND status IN ('active', 'provisioning', 'pending_config', 'pending_payment')`,
                    id
                  )
                } catch (e) {
                  console.error(`[Suite Suspend] Error suspending ${table} ${id}:`, e)
                }
              }
              await Promise.all([
                suspendSub('MonitoringSubscription', sub.monitoringSubId),
                suspendSub('FacturacionSubscription', sub.facturacionSubId),
                suspendSub('CausasSubscription', sub.causasSubId),
                suspendSub('TurnosSubscription', sub.turnosSubId),
              ])
            }

            try {
              const subForEmail = await prisma.suiteJuridicaSubscription.findUnique({
                where: { id: suiteSubId },
                include: { user: { select: { email: true } } },
              })
              if (subForEmail?.user.email) {
                await sendSubscriptionCancelledEmail(subForEmail.user.email, {
                  type: 'monitoring', // closest match for suite email
                  plan: `Suite Juridica ${suitePlan}`,
                })
              }
            } catch (emailErr) {
              console.error('[MP Webhook] Failed to send suite cancellation email:', emailErr)
            }
          }
        }

        return NextResponse.json({ received: true })
      }

      // ─── Website project subscription: "projectId:plan" ───
      const [projectId, plan] = parts

      if (status === 'authorized' && projectId) {
        // Authorization also clears any billing hold: a subscription that MP
        // reports as authorized is paying, whatever we recorded earlier.
        await prisma.project.updateMany({
          where: { id: projectId },
          data: {
            hasPaid: true,
            plan: plan ?? 'essential',
            preapprovalId,
            billingStatus: 'active',
            graceUntil: null,
            suspendedAt: null,
            suspendedReason: null,
          },
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
        // Suspend immediately — no grace. Grace exists to absorb a card that
        // failed by accident; cancelling is deliberate, so there is nothing to
        // recover from.
        //
        // `hasPaid` deliberately stays true. It records that this project ever
        // completed a payment, which is what lets the dashboard say "your
        // subscription was cancelled" instead of the flatly wrong "you never
        // paid". The publish gate is closed by billingStatus, not by lying
        // about payment history.
        const { count } = await prisma.project.updateMany({
          where: { id: projectId, billingStatus: { not: 'suspended' } },
          data: {
            billingStatus: 'suspended',
            suspendedAt: new Date(),
            suspendedReason: 'cancelled',
            graceUntil: null,
          },
        })
        if (count === 0) {
          console.log(`[MP Webhook] Project ${projectId} already suspended — skipping (${status})`)
        } else {
          console.log(`[MP Webhook] Project ${projectId} suspended (${status})`)
        }
      }
    }

    // ─── Recurring charge results (site generator) ───
    //
    // 'preapproval' only reports the SUBSCRIPTION's state. The month-to-month
    // charges arrive as 'payment' / 'subscription_authorized_payment', and
    // were previously dropped on the floor — so a subscription whose card
    // started failing stayed 'active' forever and the site was never suspended.
    //
    // Scope is the Project model on purpose. Resolution is by preapprovalId
    // (and external_reference as a fallback); a payment belonging to any of the
    // other products simply matches no Project and falls through untouched.
    if (
      (body.type === 'payment' || body.type === 'subscription_authorized_payment') &&
      body.data?.id
    ) {
      const isRecurring = body.type === 'subscription_authorized_payment'
      const detailUrl = isRecurring
        ? `https://api.mercadopago.com/authorized_payments/${body.data.id}`
        : `https://api.mercadopago.com/v1/payments/${body.data.id}`

      // Re-fetch from the API instead of trusting the notification body, the
      // same as the preapproval branch: the notification is only a nudge.
      const payRes = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
      })
      // Same rule as the preapproval branch: a charge we could not read is not a
      // charge we can say anything about. Acknowledging it dropped failed
      // payments silently, so a card that started failing during an MP blip
      // never moved the project into grace.
      if (!payRes.ok) {
        return mpReadFailure(body.type, body.data.id, payRes.status)
      }
      const detail = await payRes.json()

      // An authorized_payment wraps the actual charge; the charge's own status
      // is the one that says whether money moved.
      const payStatus: string | undefined = isRecurring
        ? (detail.payment?.status ?? detail.status)
        : detail.status
      const preapprovalRef: string | undefined = isRecurring
        ? detail.preapproval_id
        : (detail.metadata?.preapproval_id ?? undefined)
      const externalRef: string = detail.external_reference ?? ''

      console.log(
        `[MP Webhook] ${body.type}=${body.data.id} | status=${payStatus} | preapproval=${preapprovalRef} | ref=${externalRef}`
      )

      const project = preapprovalRef
        ? await prisma.project.findFirst({ where: { preapprovalId: preapprovalRef } })
        : externalRef
          ? await prisma.project.findUnique({ where: { id: externalRef.split(':')[0] } })
          : null

      if (!project) {
        console.log('[MP Webhook] No project matches this payment — ignoring')
        return NextResponse.json({ received: true })
      }

      const FAILED = ['rejected', 'cancelled', 'charged_back']

      if (payStatus === 'approved') {
        // Recovery. Restores billing state only — no content is touched, so a
        // site that comes back is the same site it was before.
        const { count } = await prisma.project.updateMany({
          where: { id: project.id, billingStatus: { in: ['grace', 'suspended'] } },
          data: {
            billingStatus: 'active',
            graceUntil: null,
            suspendedAt: null,
            suspendedReason: null,
          },
        })
        if (count > 0) {
          console.log(`[MP Webhook] Project ${project.id} recovered — payment approved`)
        }
      } else if (payStatus && FAILED.includes(payStatus)) {
        // Enter grace: the site STAYS LIVE until graceUntil. Guarding on
        // 'active' is what makes MP's retries idempotent — a second failed
        // charge must not slide the deadline forward and grant a fresh 7 days.
        const { count } = await prisma.project.updateMany({
          where: { id: project.id, billingStatus: 'active' },
          data: { billingStatus: 'grace', graceUntil: getGraceEndDate() },
        })
        if (count === 0) {
          console.log(
            `[MP Webhook] Project ${project.id} already in grace/suspended — deadline unchanged`
          )
        } else {
          console.log(
            `[MP Webhook] Project ${project.id} → grace (payment ${payStatus}), ${GRACE_PERIOD_MS / 86400000}d to recover`
          )
        }
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

  const provApiKey = process.env.SCRAPER_API_KEY
  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provApiKey && { 'x-api-key': provApiKey }),
        },
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

    const tenantsRemoveUrl = `https://n8n.abogadoenquilmes.com/webhook/alj-tenants-remove`
    const res = await fetch(tenantsRemoveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
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

/** Trigger facturacion provisioning — create tenant in Flask backend */
/** Register causas tenant in scraper service */
async function triggerCausasProvisioning(subscriptionId: string) {
  const scraperUrl = process.env.CAUSAS_SCRAPER_URL
  const scraperKey = process.env.CAUSAS_SCRAPER_API_KEY

  if (!scraperUrl || !scraperKey) {
    console.warn('[MP Webhook] CAUSAS_SCRAPER_URL or CAUSAS_SCRAPER_API_KEY not configured — manual provisioning required')
    // Still mark as active so user can access the dashboard
    await prisma.causasSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'active', provisionedAt: new Date() },
    })
    return
  }

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const provisionResp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://automaticialab.com'}/api/causas/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-secret': scraperKey,
        },
        body: JSON.stringify({ subscriptionId }),
      })

      if (provisionResp.ok) {
        console.log(`[MP Webhook] Causas ${subscriptionId} provisioned successfully`)
        return
      }

      console.warn(`[MP Webhook] Causas provision attempt ${attempt}/${maxRetries} failed: ${provisionResp.status}`)
    } catch (err) {
      console.error(`[MP Webhook] Causas provision attempt ${attempt}/${maxRetries} error:`, err)
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  // If all retries fail, still mark as active
  console.error(`[MP Webhook] Causas ${subscriptionId} provisioning FAILED after ${maxRetries} attempts — marking active anyway`)
  await prisma.causasSubscription.update({
    where: { id: subscriptionId },
    data: { status: 'active', provisionedAt: new Date() },
  })
}

/** Deactivate causas tenant in scraper service */
async function triggerCausasDeprovisioning(subscriptionId: string) {
  const scraperUrl = process.env.CAUSAS_SCRAPER_URL
  const scraperKey = process.env.CAUSAS_SCRAPER_API_KEY

  if (!scraperUrl || !scraperKey) return

  const sub = await prisma.causasSubscription.findUnique({
    where: { id: subscriptionId },
  })
  if (!sub?.scraperTenantId) return

  try {
    await fetch(`${scraperUrl}/api/tenant/${sub.scraperTenantId}/deactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${scraperKey}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(`[MP Webhook] Causas deprovisioning triggered for ${subscriptionId}`)
  } catch (err) {
    console.error(`[MP Webhook] Causas deprovisioning failed for ${subscriptionId}:`, err)
  }
}

async function triggerFacturacionProvisioning(subscriptionId: string) {
  const flaskUrl = process.env.FLASK_BACKEND_URL
  const provisionSecret = process.env.FLASK_PROVISION_SECRET

  if (!flaskUrl || !provisionSecret) {
    console.warn('[MP Webhook] FLASK_BACKEND_URL or FLASK_PROVISION_SECRET not configured — manual provisioning required')
    return
  }

  const sub = await prisma.facturacionSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${flaskUrl}/auth/portal-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Secret': provisionSecret,
        },
        body: JSON.stringify({
          cuit: sub.cuit,
          razonSocial: sub.razonSocial,
          puntoVenta: sub.puntoVenta,
          condicionIva: sub.condicionIva,
          email: sub.user.email,
          nombre: sub.user.name || sub.razonSocial,
          plan: sub.plan,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        await prisma.facturacionSubscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            flaskTenantId: data.tenantId,
            flaskUserEmail: data.userEmail || sub.user.email,
            provisionedAt: new Date(),
          },
        })
        console.log(`[MP Webhook] Facturacion ${subscriptionId} provisioned (Flask tenant: ${data.tenantId})`)
        return
      }

      console.warn(`[MP Webhook] Facturacion provision attempt ${attempt}/${maxRetries} failed: ${res.status}`)
    } catch (err) {
      console.error(`[MP Webhook] Facturacion provision attempt ${attempt}/${maxRetries} error:`, err)
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  console.error(`[MP Webhook] Facturacion ${subscriptionId} provisioning FAILED after ${maxRetries} attempts`)

  // Fallback: mark as active so user isn't stuck — Flask provisioning can be retried later
  await prisma.facturacionSubscription.update({
    where: { id: subscriptionId },
    data: { status: 'active', provisionedAt: new Date() },
  }).catch(() => {})
}

/** Deactivate facturacion tenant in Flask backend */
async function triggerFacturacionDeprovisioning(subscriptionId: string) {
  const flaskUrl = process.env.FLASK_BACKEND_URL
  const provisionSecret = process.env.FLASK_PROVISION_SECRET

  if (!flaskUrl || !provisionSecret) return

  const sub = await prisma.facturacionSubscription.findUnique({
    where: { id: subscriptionId },
  })
  if (!sub?.flaskTenantId) return

  try {
    await fetch(`${flaskUrl}/auth/portal-deprovision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Portal-Secret': provisionSecret,
      },
      body: JSON.stringify({ tenantId: sub.flaskTenantId }),
    })
    console.log(`[MP Webhook] Facturacion deprovisioning triggered for ${subscriptionId}`)
  } catch (err) {
    console.error(`[MP Webhook] Facturacion deprovisioning failed for ${subscriptionId}:`, err)
  }
}

/** Provision Suite Juridica: create 4 individual subscriptions in cascade */
async function provisionSuiteJuridica(suiteSubId: string, suitePlan: string) {
  try {
    const { SUITE_JURIDICA_PLANS } = await import('@/lib/suite-juridica-plans')
    const planConfig = SUITE_JURIDICA_PLANS[suitePlan as keyof typeof SUITE_JURIDICA_PLANS]
    if (!planConfig) {
      console.error(`[Suite Provision] Unknown plan: ${suitePlan}`)
      return
    }

    const suite = await prisma.suiteJuridicaSubscription.findUnique({
      where: { id: suiteSubId },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!suite) return

    const userId = suite.user.id
    const email = suite.user.email
    const limits = planConfig.limits

    // Create 4 individual subscriptions — "pending_config" means user must
    // fill credentials/config before they are provisioned. Billing is via suite.
    // Wrapped in a transaction so all creates and the suite update are atomic.
    await prisma.$transaction(async (tx) => {
      const [monitoring, facturacion, causas, turnos] = await Promise.all([
        tx.monitoringSubscription.create({
          data: {
            userId,
            plan: limits.monitoringPlan,
            status: 'pending_config',
            portal: 'AMBOS',
            cuil: '',
            credentialUser: '',
            credentialPass: '',
            credentialIv: '',
            credentialTag: '',
            notificationEmail: email,
            payerEmail: email,
          },
        }),
        tx.facturacionSubscription.create({
          data: {
            userId,
            plan: limits.facturacionPlan,
            status: 'pending_config',
            cuit: '',
            razonSocial: '',
            puntoVenta: 0,
            notificationEmail: email,
            payerEmail: email,
          },
        }),
        tx.causasSubscription.create({
          data: {
            userId,
            plan: limits.causasPlan,
            status: 'pending_config',
            mevUser: '',
            mevPass: '',
            mevIv: '',
            mevTag: '',
            dptoTipo: '',
            dptoId: '',
            scrapeFrequency: limits.causasPlan === 'estudio' ? '2h' : limits.causasPlan === 'profesional' ? '6h' : '24h',
            notificationEmail: email,
            payerEmail: email,
          },
        }),
        tx.turnosSubscription.create({
          data: {
            userId,
            plan: limits.turnosPlan,
            status: 'pending_config',
            slug: `suite-${suiteSubId.slice(0, 8)}`,
            businessName: '',
            notificationEmail: email,
            payerEmail: email,
          },
        }),
      ])

      // Update suite with references to individual subs
      await tx.suiteJuridicaSubscription.update({
        where: { id: suiteSubId },
        data: {
          status: 'active',
          monitoringSubId: monitoring.id,
          facturacionSubId: facturacion.id,
          causasSubId: causas.id,
          turnosSubId: turnos.id,
          provisionedAt: new Date(),
        },
      })
    })

    console.log(`[Suite Provision] Suite ${suiteSubId} provisioned with 4 subs (${limits.monitoringPlan}/${limits.facturacionPlan}/${limits.causasPlan}/${limits.turnosPlan})`)
  } catch (err) {
    console.error(`[Suite Provision] Error provisioning suite ${suiteSubId}:`, err)
    // Mark as active anyway — individual subs can be configured later
    await prisma.suiteJuridicaSubscription.update({
      where: { id: suiteSubId },
      data: { status: 'active', provisionedAt: new Date() },
    }).catch(() => {})
  }
}

/**
 * Trigger n8n provisioning webhook for Turnos.
 * Posts subscription details so n8n can clone the base workflow per tenant.
 */
async function triggerTurnosProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_TURNOS_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_TURNOS_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }
  try {
    const sub = await prisma.turnosSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!sub) {
      console.error(`[MP Webhook] Turnos subscription ${subscriptionId} not found`)
      return
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        plan: sub.plan,
        slug: sub.slug,
        userEmail: sub.user.email,
        userName: sub.user.name,
        notificationEmail: sub.notificationEmail,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://automaticialab.com'}/api/turnos/provision-callback`,
        callbackSecret: process.env.TURNOS_PROVISION_SECRET ?? '',
      }),
    })
    console.log(`[MP Webhook] Turnos provisioning triggered for ${subscriptionId} → ${res.status}`)
  } catch (err) {
    console.error(`[MP Webhook] Turnos provisioning failed for ${subscriptionId}:`, err)
  }
}

/** Trigger n8n provisioning webhook for LinkedIn. */
async function triggerLinkedInProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_LINKEDIN_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_LINKEDIN_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }
  try {
    const sub = await prisma.linkedInSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!sub) {
      console.error(`[MP Webhook] LinkedIn subscription ${subscriptionId} not found`)
      return
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        plan: sub.plan,
        userEmail: sub.user.email,
        userName: sub.user.name,
        linkedinName: sub.linkedinName,
        industry: sub.industry,
        audience: sub.audience,
        notificationEmail: sub.notificationEmail,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://automaticialab.com'}/api/linkedin/provision-callback`,
        callbackSecret: process.env.LINKEDIN_PROVISION_SECRET ?? '',
      }),
    })
    console.log(`[MP Webhook] LinkedIn provisioning triggered for ${subscriptionId} → ${res.status}`)
  } catch (err) {
    console.error(`[MP Webhook] LinkedIn provisioning failed for ${subscriptionId}:`, err)
  }
}

/** Trigger n8n provisioning webhook for LexPost. */
async function triggerLexpostProvisioning(subscriptionId: string) {
  const webhookUrl = process.env.N8N_LEXPOST_PROVISIONING_WEBHOOK
  if (!webhookUrl) {
    console.warn('[MP Webhook] N8N_LEXPOST_PROVISIONING_WEBHOOK not configured — manual provisioning required')
    return
  }
  try {
    const sub = await prisma.lexPostSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!sub) {
      console.error(`[MP Webhook] LexPost subscription ${subscriptionId} not found`)
      return
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        plan: sub.plan,
        userEmail: sub.user.email,
        userName: sub.user.name,
        igUsername: sub.igUsername,
        igAccountCount: sub.igAccountCount,
        publicationsLimit: sub.publicationsLimit,
        notificationEmail: sub.notificationEmail,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://automaticialab.com'}/api/lexpost/provision-callback`,
        callbackSecret: process.env.LEXPOST_PROVISION_SECRET ?? '',
      }),
    })
    console.log(`[MP Webhook] LexPost provisioning triggered for ${subscriptionId} → ${res.status}`)
  } catch (err) {
    console.error(`[MP Webhook] LexPost provisioning failed for ${subscriptionId}:`, err)
  }
}

// MP verifica el endpoint con GET al registrarlo
export async function GET() {
  return NextResponse.json({ status: 'MP webhook activo' })
}
