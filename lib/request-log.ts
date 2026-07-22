/**
 * Request-scoped logging for App Router server code.
 *
 * HOW THE ID REACHES A HANDLER WITHOUT BEING THREADED THROUGH EVERY FUNCTION
 * -------------------------------------------------------------------------
 * `middleware.ts` stamps the correlation id onto the REQUEST headers with
 * `NextResponse.next({ request: { headers } })`. Next.js forwards those to the
 * route handler, and `headers()` from `next/headers` reads them out of the
 * per-request AsyncLocalStorage that Next installs around the whole handler
 * invocation. AsyncLocalStorage is what makes this work at any call depth: a
 * helper called from a helper called from `POST()` sees the same store, so
 * `requestLogger()` works inside `triggerProvisioning()` without anyone passing
 * it an argument.
 *
 * The cost is that `headers()` marks the route dynamic. Every route that logs
 * here is an API route handling a mutation or a per-user read — already dynamic.
 * It is NOT called from any statically rendered page.
 *
 * This module is server-only: `next/headers` throws if it is bundled into a
 * client component. `lib/logger.ts` deliberately has no Next.js import so it
 * stays usable from anywhere, including scripts and the Edge runtime.
 */

import { headers } from 'next/headers'
import { createLogger, type LogContext, type Logger } from './logger'
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from './request-id'

/**
 * The current request's correlation id, or `undefined` outside a request.
 *
 * Falls back to `x-request-id` for the case where middleware did not run —
 * during `next build`'s route collection, and for anything invoked outside the
 * HTTP path. Never throws: a logger that explodes when there is no request is
 * a logger nobody can call from shared code.
 */
export function currentRequestId(): string | undefined {
  try {
    const h = headers()
    return h.get(CORRELATION_ID_HEADER) ?? h.get(REQUEST_ID_HEADER) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * A logger bound to the current request id plus whatever context you give it.
 *
 * Call it once at the top of a handler and reuse the result, or call it inside
 * a helper that has no handle on the handler's logger — both are cheap (an
 * AsyncLocalStorage read).
 */
export function requestLogger(context: LogContext = {}): Logger {
  return createLogger({ requestId: currentRequestId(), ...context })
}
