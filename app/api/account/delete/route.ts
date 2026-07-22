import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requestLogger } from '@/lib/request-log'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { cancelPreapproval } from '@/lib/mp-preapproval'
import {
  SUBSCRIPTION_PURGE_SPECS,
  allCancellationsSucceeded,
  buildDeletionRequestData,
  confirmationMatches,
  projectNeedsCancellation,
  subscriptionNeedsCancellation,
  type CancellationOutcome,
  type LivePreapproval,
} from '@/lib/account-deletion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const log = requestLogger({ route: 'api/account/delete' })

/**
 * Phase 1 of account deletion: the immediate, irreversible request.
 *
 * ORDER IS THE ENTIRE DESIGN. Billing is stopped BEFORE anything is marked, and
 * the marking only happens if every single cancellation was confirmed:
 *
 *   1. prove ownership (session) and deliberateness (typed email);
 *   2. find every live MercadoPago preapproval this account holds — the
 *      generator's Project.preapprovalId AND all 12 subscription products;
 *   3. cancel them, writing each local status back as MercadoPago confirms it,
 *      so our database can never claim a subscription is active that MP has
 *      already stopped;
 *   4. IF ANY CANCELLATION FAILED: stop here. Return 502 with an itemised
 *      report and leave the account fully usable. A half-deleted account whose
 *      card is still being charged is the one outcome with no defence;
 *   5. only then: take every published site offline, revoke password-reset
 *      tokens, and stamp the 30-day deletion window on the User row.
 *
 * The account is unusable the instant step 5 lands: lib/auth.ts refuses to
 * hydrate a session for a user carrying `deletionRequestedAt`, and every route
 * in this codebase gates on `session.user.id`.
 *
 * NOT REVERSIBLE BY THE USER, on purpose. See the note on the response's
 * `reversible` field below.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userId = session.user.id

  // Destructive and irreversible, so it gets a tighter budget than the
  // 5-per-10-minutes used by the signup/subscribe routes. A legitimate user
  // needs this once, ever.
  const rl = checkRateLimit(`account-delete:${getClientIp(req)}`, {
    maxRequests: 3,
    windowSeconds: 900,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá unos minutos.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const confirmEmail = (body as { confirmEmail?: unknown } | null)?.confirmEmail

  // Ownership: everything below is scoped to `userId` from the session, never
  // to an id supplied by the caller. There is no way to address another
  // account through this route.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deletionRequestedAt: true, deletionScheduledFor: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
  }

  // Idempotent: a second request for an account already scheduled is a no-op
  // success, not a second round of MercadoPago calls.
  if (user.deletionRequestedAt) {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      scheduledFor: user.deletionScheduledFor,
    })
  }

  // Step 2 of the two-step confirmation. The UI asks the user to type their own
  // address; this is what makes an accidental or replayed POST impossible.
  if (!confirmationMatches(confirmEmail, user.email)) {
    return NextResponse.json(
      { error: 'Escribí el email de tu cuenta para confirmar la eliminación.' },
      { status: 400 }
    )
  }

  const live = await collectLivePreapprovals(userId)
  log.info('account deletion requested', { userId, livePreapprovals: live.length })

  const outcomes = await cancelAll(live, userId)

  if (!allCancellationsSucceeded(outcomes)) {
    const failed = outcomes.filter((o) => !o.ok)
    log.error('account deletion ABORTED — billing could not be stopped', {
      userId,
      failedCount: failed.length,
      products: failed.map((f) => f.product),
    })
    return NextResponse.json(
      {
        error:
          'No pudimos cancelar todas tus suscripciones en MercadoPago, así que NO eliminamos la cuenta. ' +
          'Tu cuenta sigue funcionando. Reintentá en unos minutos o escribinos.',
        billingStopped: false,
        cancelled: outcomes.filter((o) => o.ok).map(publicOutcome),
        failed: failed.map(publicOutcome),
      },
      { status: 502 }
    )
  }

  const now = new Date()

  // Billing is confirmed stopped. Everything from here is local and must not be
  // able to leave the account half-marked, so it goes in one transaction.
  await prisma.$transaction(async (tx) => {
    // Take the published sites offline IMMEDIATELY — not in 30 days. A deleted
    // account must stop serving from the moment it is deleted. The publish gate
    // (lib/published-site.ts) excludes `suspended`, so both addressing modes go
    // 404 on the next read with no cache to bust and no scheduler to wait for.
    //
    // `suspendedReason: 'cancelled'` rather than a new value: the reason column
    // is a documented two-value union consumed by siteDownReason(), and account
    // deletion IS a deliberate user action. The account-level fact lives on the
    // User row, which is where anything that needs to tell them apart looks.
    await tx.project.updateMany({
      where: { userId, NOT: { billingStatus: 'suspended', suspendedReason: 'cancelled' } },
      data: {
        billingStatus: 'suspended',
        suspendedReason: 'cancelled',
        suspendedAt: now,
        graceUntil: null,
      },
    })

    // Cancel EVERY subscription locally, not only the ones that had a live
    // preapproval to cancel. A trial, a 100%-coupon subscription or one whose
    // `authorized` webhook never landed has no MercadoPago side at all, but it
    // still has provisioned workers polling on the customer's behalf. Leaving
    // those at `active` on a closed account is how a deleted customer's court
    // cases keep getting scraped.
    for (const spec of SUBSCRIPTION_PURGE_SPECS) {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      await (tx as any)[spec.delegate].updateMany({
        where: { userId, NOT: { status: 'cancelled' } },
        data: { status: 'cancelled' },
      })
    }

    // Revoke every outstanding password-reset token. Without this, a reset link
    // mailed minutes before the request stays valid for its full lifetime and
    // is a way back into an account we just closed.
    await tx.passwordResetToken.deleteMany({ where: { userId } })

    await tx.user.update({
      where: { id: userId },
      data: buildDeletionRequestData(now),
    })
  })

  const data = buildDeletionRequestData(now)
  log.info('account marked for deletion', {
    userId,
    scheduledFor: data.deletionScheduledFor.toISOString(),
    cancelledPreapprovals: outcomes.length,
  })

  return NextResponse.json({
    ok: true,
    billingStopped: true,
    cancelledPreapprovals: outcomes.length,
    cancelled: outcomes.map(publicOutcome),
    scheduledFor: data.deletionScheduledFor,
    /**
     * Deliberately false, and stated in the response rather than left implied.
     *
     * A self-service undo cannot work here: step 3 cancelled the MercadoPago
     * preapprovals, and a cancelled preapproval cannot be un-cancelled — MP has
     * no such operation. "Restoring" would therefore hand back a paid account
     * with no subscription behind it, which is both a free-service hole (delete,
     * undo, repeat) and a lie to the user about their billing.
     *
     * The honest undo is a human one: for 30 days the data is all still here,
     * so support CAN restore an account, and the user then re-subscribes. That
     * is what the UI tells them.
     */
    reversible: false,
  })
}

/** Strips anything internal before an outcome is shown to the user. */
function publicOutcome(o: CancellationOutcome) {
  return { product: o.product, ok: o.ok, ...(o.reason ? { reason: o.reason } : {}) }
}

/**
 * Every MercadoPago preapproval this account can still be charged through.
 *
 * Thirteen sources, not one: the generator bills through `Project.preapprovalId`
 * and each of the 12 subscription products carries its own. Missing any single
 * one is a customer who keeps paying for an account that no longer exists, so
 * the list of products is derived from SUBSCRIPTION_PURGE_SPECS — the same
 * constant the purge iterates — rather than retyped here where it could drift.
 */
async function collectLivePreapprovals(userId: string): Promise<LivePreapproval[]> {
  const live: LivePreapproval[] = []

  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true, preapprovalId: true, billingStatus: true, suspendedReason: true },
  })
  for (const p of projects) {
    if (projectNeedsCancellation(p)) {
      live.push({
        product: 'Project',
        delegate: 'project',
        rowId: p.id,
        preapprovalId: p.preapprovalId!,
      })
    }
  }

  for (const spec of SUBSCRIPTION_PURGE_SPECS) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const delegate = (prisma as any)[spec.delegate]
    const rows: Array<{ id: string; status: string | null; preapprovalId: string | null }> =
      await delegate.findMany({
        where: { userId },
        select: { id: true, status: true, preapprovalId: true },
      })
    for (const row of rows) {
      if (subscriptionNeedsCancellation(row)) {
        live.push({
          product: spec.label,
          delegate: spec.delegate,
          rowId: row.id,
          preapprovalId: row.preapprovalId!,
        })
      }
    }
  }

  return live
}

/**
 * Cancels every live preapproval, writing each local status back as it goes.
 *
 * Sequential rather than parallel: this is at most a handful of calls, and a
 * burst of concurrent PUTs against a payments API is how you get rate-limited
 * into exactly the partial failure this function exists to avoid.
 *
 * On success the local row is marked cancelled IMMEDIATELY, before the next
 * call. That is what keeps MercadoPago and this database from disagreeing when
 * a later cancellation fails and the whole deletion is abandoned: the
 * subscriptions we did stop are recorded as stopped, so a retry skips them and
 * nothing shows as active that MP has already cancelled.
 */
async function cancelAll(
  live: readonly LivePreapproval[],
  userId: string
): Promise<CancellationOutcome[]> {
  const outcomes: CancellationOutcome[] = []

  for (const item of live) {
    const result = await cancelPreapproval(item.preapprovalId)
    outcomes.push({
      product: item.product,
      rowId: item.rowId,
      preapprovalId: item.preapprovalId,
      ok: result.ok,
      ...(result.reason ? { reason: result.reason } : {}),
    })

    if (!result.ok) {
      log.error('MercadoPago cancellation failed', {
        userId,
        product: item.product,
        outcome: result.outcome,
        reason: result.reason,
      })
      continue
    }

    try {
      await writeCancelledStatus(item, userId)
    } catch (err) {
      // The money is stopped, which is what matters; a failed local write is
      // recoverable and must not be reported as "still being charged".
      log.error('local status write failed after successful MP cancellation', {
        userId,
        product: item.product,
        rowId: item.rowId,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return outcomes
}

/** Mirrors a confirmed MercadoPago cancellation into the local row. */
async function writeCancelledStatus(item: LivePreapproval, userId: string): Promise<void> {
  if (item.delegate === 'project') {
    await prisma.project.updateMany({
      where: { id: item.rowId, userId },
      data: {
        billingStatus: 'suspended',
        suspendedReason: 'cancelled',
        suspendedAt: new Date(),
        graceUntil: null,
      },
    })
    return
  }
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  await (prisma as any)[item.delegate].updateMany({
    where: { id: item.rowId, userId },
    data: { status: 'cancelled' },
  })
}
