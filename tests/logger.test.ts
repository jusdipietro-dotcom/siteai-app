import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  REDACTED,
  createLogger,
  isSecretKey,
  logger,
  redactValue,
  scrubString,
  setErrorSink,
  type LogEntry,
} from '@/lib/logger'

/**
 * The logger's redaction is the part with teeth.
 *
 * This codebase has a history of secrets reaching places they should not (the
 * build host prints every secret in plaintext). Logs are the other easy leak:
 * they get pasted into tickets, shipped to third parties, and read by whoever
 * has shell. So "the logger never emits a secret value" is a behaviour with a
 * test, not a convention with a comment.
 *
 * Every assertion below is written against OUTPUT — what actually lands on the
 * stream — not just the helper, because a redactor that works but is bypassed
 * by the emit path protects nothing.
 */

/** Captures the JSON lines the logger writes, in production mode. */
function captureProduction() {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('LOG_LEVEL', 'debug')
  const lines: string[] = []
  const sink = (line: unknown) => {
    lines.push(String(line))
  }
  vi.spyOn(console, 'log').mockImplementation(sink)
  vi.spyOn(console, 'warn').mockImplementation(sink)
  vi.spyOn(console, 'error').mockImplementation(sink)
  return {
    lines,
    parse: (index = 0) => JSON.parse(lines[index]) as LogEntry,
    /** Everything written, as one blob — for "this string appears nowhere" checks. */
    raw: () => lines.join('\n'),
  }
}

beforeEach(() => {
  setErrorSink(null)
})

afterEach(() => {
  setErrorSink(null)
  vi.restoreAllMocks()
})

describe('isSecretKey', () => {
  it('matches the key names the brief names, in every casing and separator style', () => {
    for (const key of [
      'token',
      'accessToken',
      'MP_ACCESS_TOKEN',
      'refresh_token',
      'secret',
      'MP_WEBHOOK_SECRET',
      'clientSecret',
      'password',
      'newPassword',
      'apiKey',
      'API_KEY',
      'api-key',
      'x-api-key',
      'authorization',
      'Authorization',
      'cookie',
      'Set-Cookie',
      'DATABASE_URL',
      'databaseUrl',
    ]) {
      expect(isSecretKey(key), `${key} must be treated as secret`).toBe(true)
    }
  })

  it('also covers the secret-ish keys this app actually carries', () => {
    for (const key of [
      'CREDENTIALS_ENCRYPTION_KEY',
      'credentials',
      'privateKey',
      'x-signature',
      'sessionId',
      'passphrase',
    ]) {
      expect(isSecretKey(key), `${key} must be treated as secret`).toBe(true)
    }
  })

  /**
   * Over-redaction is a real cost, not a safe default: an operator reading a
   * MercadoPago incident needs to see `status: 'authorized'` and which project
   * id moved to grace. A key list that swallows those makes the logs useless
   * and pushes people back to console.log.
   */
  it('does not swallow the fields an operator needs during an incident', () => {
    for (const key of [
      'status',
      'authorized',
      'preapprovalId',
      'projectId',
      'userId',
      'subscriptionId',
      'plan',
      'billingStatus',
      'attempt',
      'httpStatus',
      'email',
      'route',
      'requestId',
    ]) {
      expect(isSecretKey(key), `${key} must NOT be redacted`).toBe(false)
    }
  })
})

describe('redactValue — keys', () => {
  it('replaces a secret value instead of masking part of it', () => {
    const out = redactValue({ apiKey: 'sk-live-abcdef123456' }) as Record<string, unknown>
    expect(out.apiKey).toBe(REDACTED)
    expect(JSON.stringify(out)).not.toContain('abcdef123456')
  })

  it('redacts inside nested objects', () => {
    const out = redactValue({
      request: { headers: { authorization: 'Bearer abc.def.ghi', accept: 'application/json' } },
    }) as Record<string, Record<string, Record<string, unknown>>>
    expect(out.request.headers.authorization).toBe(REDACTED)
    expect(out.request.headers.accept).toBe('application/json')
  })

  it('redacts inside arrays of objects', () => {
    const out = redactValue([{ password: 'hunter2' }, { name: 'ok' }]) as Array<
      Record<string, unknown>
    >
    expect(out[0].password).toBe(REDACTED)
    expect(out[1].name).toBe('ok')
  })

  it('redacts inside a Map', () => {
    const out = redactValue(
      new Map<string, string>([
        ['MP_ACCESS_TOKEN', 'APP_USR-secret'],
        ['plan', 'professional'],
      ])
    ) as Record<string, unknown>
    expect(out.MP_ACCESS_TOKEN).toBe(REDACTED)
    expect(out.plan).toBe('professional')
  })

  it('redacts inside a Headers object', () => {
    const headers = new Headers({
      authorization: 'Bearer super-secret-value',
      'x-signature': 'ts=1,v1=deadbeef',
      'content-type': 'application/json',
    })
    const out = redactValue(headers) as Record<string, unknown>
    expect(out.authorization).toBe(REDACTED)
    expect(out['x-signature']).toBe(REDACTED)
    expect(out['content-type']).toBe('application/json')
  })

  it('survives circular references instead of hanging or throwing', () => {
    const node: Record<string, unknown> = { name: 'a', token: 'nope' }
    node.self = node
    const out = redactValue(node) as Record<string, unknown>
    expect(out.token).toBe(REDACTED)
    expect(out.self).toBe('[Circular]')
  })

  it('stops at a depth limit rather than walking an unbounded structure', () => {
    let deep: Record<string, unknown> = { secret: 'x' }
    for (let i = 0; i < 20; i++) deep = { nested: deep }
    expect(JSON.stringify(redactValue(deep))).toContain('[Truncated]')
    expect(JSON.stringify(redactValue(deep))).not.toContain('"x"')
  })
})

describe('scrubString — secrets that arrive as bare values', () => {
  it('masks a MercadoPago production access token anywhere in a string', () => {
    const raw =
      'MP responded 401 for token APP_USR-8265789412345678-071122-abc123def456-1234567890'
    const out = scrubString(raw)
    expect(out).not.toContain('8265789412345678')
    expect(out).toContain(REDACTED)
  })

  it('masks a MercadoPago test token', () => {
    expect(scrubString('using TEST-123456789-071122-deadbeef')).not.toContain('deadbeef')
  })

  it('masks credentials in a connection string but keeps the host, which is the diagnostic half', () => {
    const out = scrubString(
      'Error: P1001 cannot reach postgresql://appuser:s3cr3tp4ss@db.internal:5432/bsg'
    )
    expect(out).not.toContain('s3cr3tp4ss')
    expect(out).toContain('db.internal:5432')
  })

  it('masks a Bearer credential pasted into a message', () => {
    const out = scrubString('sent Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig')
    expect(out).not.toContain('eyJhbGciOiJIUzI1NiJ9')
    expect(out).toContain(`Bearer ${REDACTED}`)
  })

  it('leaves ordinary text untouched', () => {
    const raw = 'Project cmx123 recovered — payment approved'
    expect(scrubString(raw)).toBe(raw)
  })
})

describe('emitted output', () => {
  it('writes one JSON object per line in production', () => {
    const cap = captureProduction()
    createLogger().info('hello', { projectId: 'cmx1' })
    expect(cap.lines).toHaveLength(1)
    const entry = cap.parse()
    expect(entry.level).toBe('info')
    expect(entry.msg).toBe('hello')
    expect(entry.projectId).toBe('cmx1')
    expect(typeof entry.ts).toBe('string')
  })

  it('writes a readable, non-JSON line outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LOG_LEVEL', 'debug')
    const written: string[] = []
    vi.spyOn(console, 'log').mockImplementation((l: unknown) => {
      written.push(String(l))
    })
    createLogger({ requestId: 'abcdef12-3456' }).info('readable please', { a: 1 })
    expect(written).toHaveLength(1)
    expect(() => JSON.parse(written[0])).toThrow()
    expect(written[0]).toContain('INFO')
    expect(written[0]).toContain('readable please')
    expect(written[0]).toContain('[abcdef12]')
  })

  it('redacts the CONTEXT on the way out, not just via the helper', () => {
    const cap = captureProduction()
    createLogger().error('provisioning failed', {
      subscriptionId: 'sub_1',
      headers: { authorization: 'Bearer leak-me' },
      MP_ACCESS_TOKEN: 'APP_USR-1111111111111111-070101-aaaa-1',
    })
    expect(cap.raw()).not.toContain('leak-me')
    expect(cap.raw()).not.toContain('1111111111111111')
    const entry = cap.parse()
    expect(entry.subscriptionId).toBe('sub_1')
    expect(entry.MP_ACCESS_TOKEN).toBe(REDACTED)
  })

  it('redacts the MESSAGE too — the easiest place to leak is a template string', () => {
    const cap = captureProduction()
    createLogger().error(
      'MP rejected token APP_USR-9999999999999999-070101-bbbb-2 for preapproval 1'
    )
    expect(cap.raw()).not.toContain('9999999999999999')
    expect(cap.parse().msg).toContain(REDACTED)
  })

  it('redacts a secret hidden inside a logged Error, including its stack', () => {
    const cap = captureProduction()
    const err = new Error('connect failed: postgresql://u:topsecretpw@db:5432/app')
    createLogger().error('db down', { err })
    expect(cap.raw()).not.toContain('topsecretpw')
    const entry = cap.parse()
    const serialized = entry.err as { name: string; message: string; stack?: string }
    expect(serialized.name).toBe('Error')
    expect(serialized.message).toContain(REDACTED)
    expect(typeof serialized.stack).toBe('string')
  })

  it('redacts secret-ish own properties hung off an Error (Prisma/undici style)', () => {
    const cap = captureProduction()
    const err = Object.assign(new Error('P1001'), {
      code: 'P1001',
      clientVersion: '5.22.0',
      meta: { database_url: 'postgresql://u:p@h/db', apiKey: 'k-123456' },
    })
    createLogger().error('prisma failed', { err })
    const entry = cap.parse()
    const serialized = entry.err as { code: string; meta: Record<string, unknown> }
    expect(serialized.code).toBe('P1001')
    expect(serialized.meta.database_url).toBe(REDACTED)
    expect(serialized.meta.apiKey).toBe(REDACTED)
    expect(cap.raw()).not.toContain('k-123456')
  })

  it('carries the requestId bound by a child logger onto every line', () => {
    const cap = captureProduction()
    const log = createLogger({ requestId: 'req-abc-123' }).child({ route: 'api/health' })
    log.info('one')
    log.warn('two')
    expect(cap.parse(0).requestId).toBe('req-abc-123')
    expect(cap.parse(1).requestId).toBe('req-abc-123')
    expect(cap.parse(1).route).toBe('api/health')
  })

  it('keeps a context key named like an envelope field from clobbering the envelope', () => {
    const cap = captureProduction()
    createLogger().info('real message', { msg: 'impostor', level: 'debug' })
    const entry = cap.parse()
    expect(entry.msg).toBe('real message')
    expect(entry.level).toBe('info')
    expect(entry.ctx_msg).toBe('impostor')
  })

  it('honours LOG_LEVEL, including silencing everything', () => {
    const cap = captureProduction()
    vi.stubEnv('LOG_LEVEL', 'warn')
    const log = createLogger()
    log.debug('no')
    log.info('no')
    log.warn('yes')
    log.error('yes')
    expect(cap.lines).toHaveLength(2)

    vi.stubEnv('LOG_LEVEL', 'silent')
    log.error('not even this')
    expect(cap.lines).toHaveLength(2)
  })

  it('defaults to info in production and debug in development', () => {
    const cap = captureProduction()
    // The default is only observable with LOG_LEVEL unset.
    vi.stubEnv('LOG_LEVEL', undefined)

    createLogger().debug('dropped in prod')
    expect(cap.lines).toHaveLength(0)

    vi.stubEnv('NODE_ENV', 'development')
    createLogger().debug('kept in dev')
    expect(cap.lines).toHaveLength(1)
  })

  it('exposes a module-level logger for code with no request', () => {
    const cap = captureProduction()
    logger.info('startup')
    expect(cap.parse().msg).toBe('startup')
  })
})

describe('error sink — the seam an error tracker attaches to', () => {
  it('receives error entries and nothing below error level', () => {
    captureProduction()
    const seen: LogEntry[] = []
    setErrorSink((entry) => seen.push(entry))

    const log = createLogger({ requestId: 'r1' })
    log.info('ignored')
    log.warn('also ignored')
    log.error('captured', { projectId: 'p1' })

    expect(seen).toHaveLength(1)
    expect(seen[0].msg).toBe('captured')
    expect(seen[0].requestId).toBe('r1')
    expect(seen[0].projectId).toBe('p1')
  })

  it('hands the sink ALREADY-REDACTED entries, so a tracker cannot re-leak', () => {
    captureProduction()
    const seen: LogEntry[] = []
    setErrorSink((entry) => seen.push(entry))

    createLogger().error('boom', { authorization: 'Bearer leak-to-sentry' })

    expect(JSON.stringify(seen[0])).not.toContain('leak-to-sentry')
    expect(seen[0].authorization).toBe(REDACTED)
  })

  it('never lets a broken sink turn a logged error into a thrown one', () => {
    const cap = captureProduction()
    setErrorSink(() => {
      throw new Error('tracker is down')
    })
    expect(() => createLogger().error('still logged')).not.toThrow()
    expect(cap.parse().msg).toBe('still logged')
  })
})
