/**
 * Health check logic, kept out of the route handler so it is testable without
 * a database, a server, or a request.
 *
 * WHAT "HEALTHY" MEANS HERE
 * -------------------------
 * Process alive AND database reachable. A 200 returned by a process whose
 * database is down is worse than no health check at all: the monitor stays
 * green while every customer request 500s, so the owner finds out from a
 * customer instead of from an alert. That is why the db probe is not optional
 * and why its failure downgrades the HTTP status, not just a JSON field — an
 * uptime monitor alerts on status code.
 *
 * WHAT IT MUST NOT DO
 * -------------------
 * The endpoint is unauthenticated, because an uptime monitor cannot log in.
 * That makes the response body an anonymous read of production, so it carries
 * status only: no env values, no dependency versions, no connection string, no
 * error message, no stack. The commit is the single exception and it is
 * validated to look like a git sha before it is echoed, so a mis-set `GIT_SHA`
 * cannot turn into an env-var disclosure.
 */

/** Ceiling on the db probe. Short on purpose — see `checkHealth`. */
export const HEALTH_DB_TIMEOUT_MS = 2000

export interface HealthReport {
  status: 'ok' | 'error'
  db: 'ok' | 'fail'
  /** Whole seconds since process start. */
  uptime: number
  /** Short git sha of the running build, when the container was given one. */
  commit?: string
}

export interface HealthResult {
  report: HealthReport
  httpStatus: 200 | 503
}

export interface HealthOptions {
  /** Must run the cheapest query the driver allows — `SELECT 1`, nothing more. */
  pingDb: () => Promise<unknown>
  /** Seconds since process start. */
  uptimeSeconds: number
  /** Raw `GIT_SHA`-style value; validated before it reaches the response. */
  commit?: string | undefined
  timeoutMs?: number
  /** Called with the probe failure so the caller can LOG it. Never surfaced. */
  onDbError?: (err: unknown) => void
}

/**
 * A git sha and nothing else.
 *
 * The endpoint is public, so echoing `process.env.GIT_SHA` unchecked would turn
 * a deploy misconfiguration (GIT_SHA accidentally set to something else) into a
 * public disclosure. Hex-only, 7–40 chars, then truncated to 12 — enough to
 * identify a deploy, short enough to be obviously not a secret.
 */
export function normalizeCommit(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!/^[0-9a-f]{7,40}$/i.test(trimmed)) return undefined
  return trimmed.toLowerCase().slice(0, 12)
}

/**
 * Rejects if `promise` has not settled within `ms`.
 *
 * The timer is always cleared: an uncleared one keeps the Node event loop alive
 * and, on a polled endpoint, would leak a handle every few minutes. The
 * underlying query is not cancelled — Prisma has no abort — but `SELECT 1` on
 * a connection that is already gone costs nothing, and the caller is not made
 * to wait for it.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`health db probe timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/**
 * Runs the checks and decides the HTTP status.
 *
 * Cheap by construction: one `SELECT 1` on an existing pooled connection and
 * an in-process uptime read. Nothing here counts rows, opens a connection pool,
 * reads a file, or calls another service — this endpoint is polled forever and
 * must never become a load source of its own.
 */
export async function checkHealth(options: HealthOptions): Promise<HealthResult> {
  const { pingDb, uptimeSeconds, commit, timeoutMs = HEALTH_DB_TIMEOUT_MS, onDbError } = options

  let dbOk = false
  try {
    await withTimeout(pingDb(), timeoutMs)
    dbOk = true
  } catch (err) {
    // Reported to the caller for logging only. The response never carries it:
    // a driver error message can contain the datasource URL.
    onDbError?.(err)
  }

  const report: HealthReport = {
    status: dbOk ? 'ok' : 'error',
    db: dbOk ? 'ok' : 'fail',
    uptime: Math.max(0, Math.floor(uptimeSeconds)),
  }
  const normalizedCommit = normalizeCommit(commit)
  if (normalizedCommit) report.commit = normalizedCommit

  return { report, httpStatus: dbOk ? 200 : 503 }
}
