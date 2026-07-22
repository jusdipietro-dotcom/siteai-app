/**
 * Structured logger — zero dependencies, by design.
 *
 * WHY NO pino/winston
 * -------------------
 * The runtime image is already heavy (Next standalone + Prisma engines + sharp
 * + @img). Everything those libraries give us that this app can actually use is
 * ~200 lines: levels, JSON output, child loggers, redaction. What they give us
 * that we cannot use is the interesting part — pino's speed comes from a worker
 * thread and its `pino-pretty`/transport story, and transports fight with
 * Next.js bundling of route handlers (pino ships `thread-stream`, which pulls
 * `worker_threads` and a runtime `require` of a transport file that the
 * standalone tracer does not follow). Adding a dependency that has to be
 * special-cased in `serverComponentsExternalPackages` to log a line is a bad
 * trade. `console.*` already goes to stdout/stderr, which is what the container
 * captures; all we needed was to make what we write to it *structured*.
 *
 * OUTPUT
 * ------
 * - production: one JSON object per line — greppable with `jq`, parseable by
 *   any log shipper the owner adds later.
 * - anywhere else: a short human line, because a developer reading `next dev`
 *   output does not want to read JSON.
 *
 * REDACTION IS THE POINT
 * ----------------------
 * This codebase has leaked secrets into logs before (EasyPanel prints every
 * build secret in plaintext). So redaction here is not a nicety bolted on the
 * side — every value that reaches an output stream goes through `redact()`
 * first, including the message string and including anything nested inside an
 * Error. There is no "raw" escape hatch on purpose: a logger you can bypass is
 * a logger that will be bypassed at 3am.
 *
 * ERROR-TRACKER SEAM
 * ------------------
 * See `setErrorSink()` at the bottom of this file. That single function is the
 * one place a Sentry/Bugsnag/OpenTelemetry exporter attaches, and it receives
 * entries that are ALREADY redacted. No call site changes when one is added.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Numeric severity, used only for threshold comparison. */
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

/** Arbitrary structured fields attached to a log line. */
export interface LogContext {
  [key: string]: unknown
}

/** A fully-built, already-redacted log line. This is what an error sink sees. */
export interface LogEntry extends LogContext {
  ts: string
  level: LogLevel
  msg: string
  requestId?: string
}

export interface Logger {
  debug(msg: string, context?: LogContext): void
  info(msg: string, context?: LogContext): void
  warn(msg: string, context?: LogContext): void
  error(msg: string, context?: LogContext): void
  /** Returns a logger that carries `context` on every line it writes. */
  child(context: LogContext): Logger
}

export const REDACTED = '[REDACTED]'

/** Fields the log envelope owns; a context key that collides gets prefixed. */
const RESERVED_KEYS = new Set(['ts', 'level', 'msg'])

/**
 * Substrings that make a KEY secret-bearing. Matched against the key with case
 * and separators removed, so `API_KEY`, `api-key`, `apiKey` and `x-api-key` all
 * collapse to something containing `apikey`.
 *
 * Deliberately NOT in this list: bare `auth`. It would redact `authorized`,
 * which is the MercadoPago preapproval status an operator most needs to see.
 * `authorization` is listed explicitly instead.
 */
const SECRET_KEY_FRAGMENTS = [
  'token',
  'secret',
  'password',
  'passwd',
  'passphrase',
  'apikey',
  'authorization',
  'cookie',
  'credential',
  'privatekey',
  'signature',
  'databaseurl',
  'connectionstring',
  'encryptionkey',
  'accesskey',
  'sessionid',
]

/**
 * Value-level scrubbers, for secrets that arrive as a bare string under an
 * innocent key — the common case being a driver error whose message embeds the
 * datasource URL, or an upstream API echoing the credential we sent it.
 *
 * Key-based redaction cannot catch those: nobody logs
 * `{ databaseUrl: '...' }`, they log `err.message`.
 */
const VALUE_SCRUBBERS: ReadonlyArray<readonly [RegExp, string]> = [
  // MercadoPago production access token: APP_USR-<digits>-<date>-<hex>-<digits>
  [/APP_USR-[A-Za-z0-9_-]{6,}/g, `APP_USR-${REDACTED}`],
  // MercadoPago test access token / test public key.
  [/\bTEST-[0-9]{6,}-[A-Za-z0-9_-]{4,}/g, `TEST-${REDACTED}`],
  // Credentials inside any URL: postgresql://user:pass@host, amqp://, https://…
  // Host and port survive on purpose — "cannot reach db:5432" is the useful
  // half of a connection error, and it is not a secret.
  [/([a-z][a-z0-9+.\-]*:\/\/)([^\s/:@]+):([^\s/@]+)@/gi, `$1$2:${REDACTED}@`],
  // An Authorization header value pasted into a message.
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, `$1 ${REDACTED}`],
]

/** Guards against a cyclic or absurdly deep object turning a log line into a hang. */
const MAX_DEPTH = 6
/** Arrays longer than this are truncated with a marker rather than silently cut. */
const MAX_ARRAY_ITEMS = 100

/** Lowercases and strips separators so `X-Api-Key` and `apiKey` compare equal. */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** True when a key name implies its value must never be written to a log. */
export function isSecretKey(key: string): boolean {
  const normalized = normalizeKey(key)
  return SECRET_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))
}

/** Applies every value-level scrubber to a string. */
export function scrubString(value: string): string {
  let out = value
  for (const [pattern, replacement] of VALUE_SCRUBBERS) {
    // Each RegExp is a module-level literal with /g, so lastIndex must not leak
    // between calls. String.prototype.replace resets it, but be explicit.
    pattern.lastIndex = 0
    out = out.replace(pattern, replacement)
  }
  return out
}

/** Errors do not survive JSON.stringify; unwrap them into plain data. */
function serializeError(err: Error, depth: number, seen: WeakSet<object>): LogContext {
  const out: LogContext = {
    name: err.name,
    message: scrubString(err.message),
  }
  if (typeof err.stack === 'string') out.stack = scrubString(err.stack)
  // Prisma/undici/fetch errors carry the diagnostic payload on own properties
  // (`code`, `meta`, `cause`), and those are where the interesting detail lives.
  for (const key of Object.keys(err)) {
    if (key === 'name' || key === 'message' || key === 'stack') continue
    out[key] = isSecretKey(key)
      ? REDACTED
      : redactValue((err as unknown as LogContext)[key], depth + 1, seen)
  }
  if (err.cause !== undefined && !('cause' in out)) {
    out.cause = redactValue(err.cause, depth + 1, seen)
  }
  return out
}

/**
 * Recursively produces a JSON-safe copy of `value` with every secret removed.
 *
 * Exported so the redaction rules are testable directly rather than only
 * through captured console output.
 */
export function redactValue(
  value: unknown,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (value === null || value === undefined) return value

  const type = typeof value
  if (type === 'string') return scrubString(value as string)
  if (type === 'number' || type === 'boolean') return value
  if (type === 'bigint') return `${(value as bigint).toString()}n`
  if (type === 'function') return '[Function]'
  if (type === 'symbol') return (value as symbol).toString()

  const obj = value as object
  if (seen.has(obj)) return '[Circular]'
  if (depth >= MAX_DEPTH) return '[Truncated]'
  seen.add(obj)

  if (value instanceof Error) return serializeError(value, depth, seen)
  if (value instanceof Date) return value.toISOString()
  if (value instanceof RegExp) return value.toString()
  if (value instanceof Map) {
    const out: LogContext = {}
    for (const [k, v] of value) {
      const key = String(k)
      out[key] = isSecretKey(key) ? REDACTED : redactValue(v, depth + 1, seen)
    }
    return out
  }
  if (value instanceof Set) {
    return redactValue(Array.from(value), depth, seen)
  }
  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactValue(item, depth + 1, seen))
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`)
    }
    return items
  }

  // Headers / URLSearchParams and anything else iterable as entries.
  if (typeof (value as { forEach?: unknown }).forEach === 'function' && 'get' in obj) {
    const out: LogContext = {}
    ;(value as unknown as { forEach: (cb: (v: string, k: string) => void) => void }).forEach(
      (v, k) => {
        out[k] = isSecretKey(k) ? REDACTED : redactValue(v, depth + 1, seen)
      }
    )
    return out
  }

  const out: LogContext = {}
  for (const [key, val] of Object.entries(value as LogContext)) {
    out[key] = isSecretKey(key) ? REDACTED : redactValue(val, depth + 1, seen)
  }
  return out
}

/** Redacts a context object and moves envelope-colliding keys out of the way. */
function redactContext(context: LogContext): LogContext {
  const out: LogContext = {}
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue
    const target = RESERVED_KEYS.has(key) ? `ctx_${key}` : key
    out[target] = isSecretKey(key) ? REDACTED : redactValue(value)
  }
  return out
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Threshold, read per call so a test (or a running container with LOG_LEVEL
 * changed and restarted) does not need a module reload to take effect.
 * `LOG_LEVEL=silent` mutes everything.
 */
function minLevel(): number {
  const configured = process.env.LOG_LEVEL?.trim().toLowerCase()
  if (configured === 'silent') return Number.POSITIVE_INFINITY
  if (configured && configured in LEVEL_ORDER) return LEVEL_ORDER[configured as LogLevel]
  return isProduction() ? LEVEL_ORDER.info : LEVEL_ORDER.debug
}

/** Short, aligned, human line for `next dev`. */
function formatPretty(entry: LogEntry): string {
  const { ts, level, msg, requestId, ...rest } = entry
  const time = ts.slice(11, 23)
  const tag = level.toUpperCase().padEnd(5)
  const rid = typeof requestId === 'string' ? ` [${requestId.slice(0, 8)}]` : ''
  const keys = Object.keys(rest)
  const extra = keys.length > 0 ? ` ${safeStringify(rest)}` : ''
  return `${time} ${tag}${rid} ${msg}${extra}`
}

/**
 * JSON.stringify that cannot throw. A logger that crashes the request it was
 * describing is worse than no logger, and BigInt/circular values still slip
 * through on paths `redactValue` did not reach (a custom toJSON, say).
 */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return '"[Unserializable]"'
  }
}

/**
 * Optional destination for error-level entries.
 *
 * ─── THIS IS THE ERROR-TRACKER SEAM ───────────────────────────────────────
 * Sentry, Bugsnag, an OTLP exporter, or a plain fetch to a webhook attaches
 * HERE and nowhere else. Everything a sink receives has already been through
 * `redact()`, so a tracker cannot re-introduce a leak that this module just
 * prevented. Wiring one up is a single call at startup — for example in
 * `instrumentation.ts`:
 *
 *     import { setErrorSink } from '@/lib/logger'
 *     setErrorSink((entry) => Sentry.captureMessage(entry.msg, { extra: entry }))
 *
 * No call site in the app changes. Deliberately not installed today: there is
 * no account and no DSN, and a half-configured tracker is a silent failure.
 * ──────────────────────────────────────────────────────────────────────────
 */
export type ErrorSink = (entry: LogEntry) => void

let errorSink: ErrorSink | null = null

/** Installs (or with `null`, removes) the error sink. See `ErrorSink`. */
export function setErrorSink(sink: ErrorSink | null): void {
  errorSink = sink
}

/** Writes to the stream the container actually captures for that severity. */
function writeLine(level: LogLevel, line: string): void {
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

function emit(level: LogLevel, bound: LogContext, msg: string, context?: LogContext): void {
  if (LEVEL_ORDER[level] < minLevel()) return

  const merged = context ? { ...bound, ...context } : bound
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg: scrubString(msg),
    ...redactContext(merged),
  }

  writeLine(level, isProduction() ? safeStringify(entry) : formatPretty(entry))

  if (level === 'error' && errorSink) {
    // A tracker that is down, rate-limited, or misconfigured must never turn a
    // logged error into a thrown one.
    try {
      errorSink(entry)
    } catch {
      /* intentionally ignored */
    }
  }
}

/**
 * Builds a logger carrying `bound` context on every line.
 *
 * `createLogger({ requestId })` is the request-scoped form; see
 * `lib/request-log.ts`, which resolves the id for you.
 */
export function createLogger(bound: LogContext = {}): Logger {
  return {
    debug: (msg, context) => emit('debug', bound, msg, context),
    info: (msg, context) => emit('info', bound, msg, context),
    warn: (msg, context) => emit('warn', bound, msg, context),
    error: (msg, context) => emit('error', bound, msg, context),
    child: (context) => createLogger({ ...bound, ...context }),
  }
}

/** Process-wide logger, for code with no request to attribute a line to. */
export const logger: Logger = createLogger()
