import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJSON } from '@/lib/published-site'
import { publishedSiteUrl } from '@/lib/site-domain'
import { sendSubscriptionCancelledEmail } from '@/lib/email'
import type { BusinessData } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cancels the MercadoPago preapproval for a generated site.
 *
 * MercadoPago's API can hang, and the user's cancellation must not hang with it.
 * The call is bounded by an AbortController timeout; a failure here never blocks
 * the local suspension below (the owner asked to stop — we take the site offline
 * regardless and surface `mpCancelled` so a failed MP call can be retried).
 *
 * Returns true only when MP acknowledged the cancellation.
 */
async function cancelMpPreapproval(preapprovalId: string): Promise<boolean> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    console.warn('[cancel] MP_ACCESS_TOKEN not set — cannot cancel preapproval', preapprovalId)
    return false
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[cancel] MP preapproval ${preapprovalId} cancel failed — status ${res.status}`)
    }
    return res.ok
  } catch (err) {
    console.error(`[cancel] MP preapproval ${preapprovalId} cancel errored:`, err)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Deliberate cancellation of a generated site's subscription.
 *
 * Product rule: cancelling is a deliberate act, so the site is suspended
 * IMMEDIATELY with `suspendedReason: 'cancelled'` and NO grace window — grace
 * exists to absorb an accidental payment failure, not a chosen exit. The publish
 * gate (lib/published-site.ts) excludes `suspended`, so the public URL goes 404
 * on the next read with no extra work here. Content is left intact so a later
 * re-subscription restores the site exactly as it was.
 *
 * Billing is stopped by cancelling the MercadoPago preapproval. Two cases have
 * nothing to cancel there and still take the site down:
 *   - a gifted site (`grantedBy` set): never had an MP subscription;
 *   - a site whose `authorized` webhook has not landed yet (`preapprovalId`
 *     still null — a known Fase-2 gap, since the id is only persisted by the
 *     webhook). We suspend locally and report that MP was not touched.
 *
 * Idempotent: cancelling an already-cancelled subscription is a 200 no-op.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      plan: true,
      preapprovalId: true,
      grantedBy: true,
      billingStatus: true,
      suspendedReason: true,
      businessData: true,
      user: { select: { email: true } },
    },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const gifted = !!project.grantedBy && !project.preapprovalId

  // Idempotency: an already-cancelled subscription is a no-op success. We do not
  // re-hit MP or re-send the email. (A site suspended for `payment_failed` is
  // NOT treated as cancelled — the owner may still cancel it to stop retries.)
  if (project.billingStatus === 'suspended' && project.suspendedReason === 'cancelled') {
    return NextResponse.json({ ok: true, alreadyCancelled: true, gifted })
  }

  // Stop the billing first. Best-effort and time-bounded; the suspension below
  // happens whether or not MP answers.
  let mpCancelled = false
  if (project.preapprovalId) {
    mpCancelled = await cancelMpPreapproval(project.preapprovalId)
  }

  // Suspend immediately, no grace. The guard keeps a concurrent double-submit
  // from writing twice, and `hasPaid` is left untouched so the dashboard can
  // still tell "cancelled" from "never paid".
  await prisma.project.updateMany({
    where: {
      id: project.id,
      userId: session.user.id,
      NOT: { billingStatus: 'suspended', suspendedReason: 'cancelled' },
    },
    data: {
      billingStatus: 'suspended',
      suspendedReason: 'cancelled',
      suspendedAt: new Date(),
      graceUntil: null,
    },
  })

  // Confirmation email — best-effort, never blocks the cancellation. Route it to
  // the site's public contact email, falling back to the account email (same
  // resolution as the site-leads notification).
  const bd = parseJSON<BusinessData>(project.businessData, {} as BusinessData)
  const ownerEmail = bd.contact?.email?.trim() || project.user?.email || null
  if (ownerEmail) {
    sendSubscriptionCancelledEmail(ownerEmail, {
      type: 'project',
      plan: project.plan ?? 'essential',
    }).catch((err) => {
      console.error(`[cancel] confirmation email failed for project ${project.id}:`, err)
    })
  }

  console.log(
    `[cancel] project ${project.id} cancelled by owner — mpCancelled=${mpCancelled} gifted=${gifted} url=${publishedSiteUrl(project)}`
  )

  return NextResponse.json({ ok: true, mpCancelled, gifted })
}
