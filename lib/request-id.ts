/**
 * Request correlation ids.
 *
 * Runs in `middleware.ts`, which Next.js executes on the EDGE runtime — so this
 * module must not import `node:crypto`, `next/headers`, Prisma, or anything
 * else Node-only. It uses `globalThis.crypto`, which both the Edge runtime and
 * Node 18+ provide.
 *
 * TWO HEADERS, AND WHY
 * --------------------
 * `x-request-id` is the public contract: we accept it inbound and always return
 * it outbound, so a customer who says "no me anda" can be handed a value that
 * appears verbatim in the logs.
 *
 * `x-correlation-id` is internal — middleware overwrites it unconditionally on
 * the way in and route handlers read it. It exists because we MUST NOT rewrite
 * an inbound `x-request-id`: MercadoPago signs its webhooks over a manifest
 * that includes the `x-request-id` header it sent us
 * (`app/api/mp/webhook/route.ts`, `verifyMPSignature`). Changing that header
 * before the handler reads it would fail every signature check, return 403 to
 * every notification, and leave paying customers unprovisioned — the exact
 * failure `instrumentation.ts` refuses to boot over. Two headers cost nothing
 * and make that class of bug impossible.
 *
 * Because middleware always overwrites `x-correlation-id`, a client cannot
 * spoof it.
 */

/** Public, inbound-and-outbound. Never rewritten on an inbound request. */
export const REQUEST_ID_HEADER = 'x-request-id'

/** Internal, set by middleware only. What route handlers read. */
export const CORRELATION_ID_HEADER = 'x-correlation-id'

/**
 * Shape an inbound id must have to be trusted enough to reuse.
 *
 * Bounded length and a conservative charset because this value is echoed into a
 * response header and into every log line for the request: a newline would let
 * a caller forge log entries or split the response header.
 */
const VALID_REQUEST_ID = /^[A-Za-z0-9._:+/=@-]{8,200}$/

/** True when an inbound id is safe to adopt as this request's correlation id. */
export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === 'string' && VALID_REQUEST_ID.test(value)
}

/**
 * A fresh id. `crypto.randomUUID` on every runtime we deploy to; the fallback
 * exists only so this module can never throw in an exotic one (an id that is
 * merely unlikely to collide still correlates a single request's log lines).
 */
export function generateRequestId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export interface ResolvedRequestId {
  id: string
  /** True when the caller supplied a usable id and we adopted it. */
  inherited: boolean
}

/** Adopts a valid inbound id, otherwise mints one. */
export function resolveRequestId(inbound: string | null | undefined): ResolvedRequestId {
  if (isValidRequestId(inbound)) return { id: inbound, inherited: true }
  return { id: generateRequestId(), inherited: false }
}

/**
 * Copies request headers with the correlation id stamped on.
 *
 * `x-request-id` is written ONLY when the caller sent none at all — not merely
 * when the one they sent failed validation. The rule is "we never rewrite a
 * header the caller sent", which is the only version of this that is safe
 * against MercadoPago's signature manifest (see the note at the top of this
 * file) without depending on MP's id happening to match our regex.
 *
 * A caller who sends an unusable `x-request-id` keeps it on the request and
 * gets our generated id back on the response and in the logs.
 */
export function withCorrelationHeaders(
  source: Headers,
  resolved: ResolvedRequestId
): Headers {
  const headers = new Headers(source)
  headers.set(CORRELATION_ID_HEADER, resolved.id)
  if (source.get(REQUEST_ID_HEADER) === null) headers.set(REQUEST_ID_HEADER, resolved.id)
  return headers
}
