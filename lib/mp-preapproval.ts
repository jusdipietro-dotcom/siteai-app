/**
 * Cancelling a MercadoPago preapproval, with a definite answer.
 *
 * WHY THIS EXISTS ALONGSIDE THE EXISTING HELPERS
 * ----------------------------------------------
 * `app/api/projects/[id]/cancel` and `app/api/mp/create-subscription` each have
 * a private `cancelMpPreapproval()` that is deliberately BEST-EFFORT: they take
 * the site down whether or not MercadoPago answers, because the owner asked to
 * stop and a hung payments API must not block that.
 *
 * Account deletion cannot use that contract. There, a failed cancellation that
 * we shrug off produces the one outcome nobody can defend: an account that no
 * longer exists and a card that keeps being charged. So this helper keeps the
 * same shape (bounded by an AbortController, never throws) but returns a
 * STRUCTURED, three-way answer the caller is forced to look at.
 *
 * THE "ALREADY CANCELLED" CASE IS THE SUBTLE ONE
 * ----------------------------------------------
 * MercadoPago answers 4xx when you cancel a preapproval that is already
 * cancelled. A payer can cancel from their own MercadoPago account at any time,
 * leaving our row saying `active` and MP saying `cancelled`. Treating that 4xx
 * as a failure would permanently trap such a user: their deletion request would
 * fail forever, on a subscription that already charges nobody. So on any
 * non-OK response we read the preapproval back, and a status of `cancelled`
 * counts as success — which is what the caller actually needs to know
 * ("is this thing still going to charge anyone?"), not "did our PUT win?".
 */

/** Same budget as the two existing private helpers. */
export const MP_CANCEL_TIMEOUT_MS = 8000

export interface MpCancelResult {
  readonly ok: boolean
  /**
   * How we got to `ok`. `already_cancelled` is reported separately from
   * `cancelled` so an operator reading the logs can tell "we stopped it" from
   * "it was already stopped", which are very different stories in a dispute.
   */
  readonly outcome: 'cancelled' | 'already_cancelled' | 'failed'
  /** Short, non-sensitive explanation. Safe to return to the client. */
  readonly reason?: string
}

/** Minimal `fetch` shape, so tests can inject one without touching the network. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

interface CancelOptions {
  readonly token?: string
  readonly fetchImpl?: FetchLike
  readonly timeoutMs?: number
}

async function readStatus(
  preapprovalId: string,
  token: string,
  fetchImpl: FetchLike,
  timeoutMs: number
): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { status?: unknown }
    return typeof body?.status === 'string' ? body.status : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Cancels one preapproval and reports, definitively, whether it can still
 * charge anybody.
 *
 * Never throws: a network error, a timeout and a 500 all come back as
 * `{ ok: false }`, because a caller deciding whether to destroy an account must
 * never have that decision made for it by an exception it forgot to catch.
 */
export async function cancelPreapproval(
  preapprovalId: string,
  options: CancelOptions = {}
): Promise<MpCancelResult> {
  const token = options.token ?? process.env.MP_ACCESS_TOKEN
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike)
  const timeoutMs = options.timeoutMs ?? MP_CANCEL_TIMEOUT_MS

  // No token means we CANNOT know whether billing was stopped. That is a
  // failure, not a skip: silently succeeding here is exactly how a deleted
  // account keeps being charged.
  if (!token) {
    return { ok: false, outcome: 'failed', reason: 'MP_ACCESS_TOKEN no configurado' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (res.ok) return { ok: true, outcome: 'cancelled' }

    // Non-OK: ask MercadoPago what the preapproval actually looks like now,
    // because "already cancelled" and "we failed" are indistinguishable from
    // the status code alone.
    const status = await readStatus(preapprovalId, token, fetchImpl, timeoutMs)
    if (status === 'cancelled') {
      return { ok: true, outcome: 'already_cancelled' }
    }
    return {
      ok: false,
      outcome: 'failed',
      reason: `MercadoPago respondió ${res.status}${status ? ` (estado actual: ${status})` : ''}`,
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      outcome: 'failed',
      reason: aborted ? 'timeout al contactar MercadoPago' : 'error de red al contactar MercadoPago',
    }
  } finally {
    clearTimeout(timer)
  }
}
