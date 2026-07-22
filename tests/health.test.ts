import { describe, it, expect, vi } from 'vitest'
import { checkHealth, normalizeCommit, HEALTH_DB_TIMEOUT_MS } from '@/lib/health'

/**
 * The health check's whole value is that it is honest when things are broken.
 * A green check over a dead database is worse than no check, so the unhealthy
 * path gets more tests than the healthy one.
 */

const ok = () => Promise.resolve([{ '?column?': 1 }])
const dead = () => Promise.reject(new Error('P1001: cannot reach postgresql://u:pw@db:5432/app'))

describe('checkHealth — healthy', () => {
  it('reports ok with 200 when the db answers', async () => {
    const { report, httpStatus } = await checkHealth({ pingDb: ok, uptimeSeconds: 42.7 })
    expect(httpStatus).toBe(200)
    expect(report.status).toBe('ok')
    expect(report.db).toBe('ok')
  })

  it('reports uptime as whole seconds', async () => {
    const { report } = await checkHealth({ pingDb: ok, uptimeSeconds: 42.7 })
    expect(report.uptime).toBe(42)
  })

  it('never reports a negative uptime', async () => {
    const { report } = await checkHealth({ pingDb: ok, uptimeSeconds: -1 })
    expect(report.uptime).toBe(0)
  })

  it('carries the deployed commit when the container was given one', async () => {
    const { report } = await checkHealth({
      pingDb: ok,
      uptimeSeconds: 1,
      commit: 'e57c45b1a2c3d4e5f60718293a4b5c6d7e8f9012',
    })
    expect(report.commit).toBe('e57c45b1a2c3')
  })

  it('omits the commit entirely when GIT_SHA is unset', async () => {
    const { report } = await checkHealth({ pingDb: ok, uptimeSeconds: 1, commit: undefined })
    expect(report).not.toHaveProperty('commit')
  })
})

describe('checkHealth — unhealthy', () => {
  it('returns 503 when the db is unreachable, so a monitor can alert on status alone', async () => {
    const { report, httpStatus } = await checkHealth({ pingDb: dead, uptimeSeconds: 10 })
    expect(httpStatus).toBe(503)
    expect(report.status).toBe('error')
    expect(report.db).toBe('fail')
  })

  it('still reports uptime and commit while degraded — the process IS up', async () => {
    const { report } = await checkHealth({
      pingDb: dead,
      uptimeSeconds: 99,
      commit: 'abcdef1234567',
    })
    expect(report.uptime).toBe(99)
    expect(report.commit).toBe('abcdef123456')
  })

  it('returns 503 when the db hangs past the timeout instead of hanging the monitor', async () => {
    vi.useFakeTimers()
    try {
      const pending = checkHealth({
        pingDb: () => new Promise(() => {}),
        uptimeSeconds: 5,
        timeoutMs: 50,
      })
      await vi.advanceTimersByTimeAsync(60)
      const { report, httpStatus } = await pending
      expect(httpStatus).toBe(503)
      expect(report.db).toBe('fail')
    } finally {
      vi.useRealTimers()
    }
  })

  it('hands the failure to the caller for logging', async () => {
    const seen: unknown[] = []
    await checkHealth({ pingDb: dead, uptimeSeconds: 1, onDbError: (e) => seen.push(e) })
    expect(seen).toHaveLength(1)
    expect((seen[0] as Error).message).toContain('P1001')
  })

  it('does not call onDbError on the happy path', async () => {
    const onDbError = vi.fn()
    await checkHealth({ pingDb: ok, uptimeSeconds: 1, onDbError })
    expect(onDbError).not.toHaveBeenCalled()
  })

  /**
   * The endpoint is unauthenticated. Whatever this report contains is a public
   * read of production, so the driver error — which carries the datasource
   * credentials — must not be anywhere in it.
   */
  it('leaks nothing from the failure into the report body', async () => {
    const { report } = await checkHealth({ pingDb: dead, uptimeSeconds: 1 })
    const serialized = JSON.stringify(report)
    expect(serialized).not.toContain('postgresql')
    expect(serialized).not.toContain('pw')
    expect(serialized).not.toContain('P1001')
    expect(Object.keys(report).sort()).toEqual(['db', 'status', 'uptime'])
  })

  it('has a default timeout short enough for a polled endpoint', () => {
    expect(HEALTH_DB_TIMEOUT_MS).toBeLessThanOrEqual(5000)
  })
})

describe('normalizeCommit — the one env value the public endpoint echoes', () => {
  it('accepts a git sha and shortens it', () => {
    expect(normalizeCommit('e57c45b')).toBe('e57c45b')
    expect(normalizeCommit('E57C45B1A2C3D4E5F60718293A4B5C6D7E8F9012')).toBe('e57c45b1a2c3')
  })

  it('tolerates surrounding whitespace from a shell-injected build arg', () => {
    expect(normalizeCommit('  e57c45b\n')).toBe('e57c45b')
  })

  /**
   * If GIT_SHA is mis-set at deploy time — pointed at the wrong variable, or a
   * whole connection string — echoing it unchecked would publish it. Anything
   * that is not a sha is dropped rather than printed.
   */
  it('drops anything that is not a sha instead of publishing it', () => {
    expect(normalizeCommit('postgresql://u:pw@db:5432/app')).toBeUndefined()
    expect(normalizeCommit('v1.2.3')).toBeUndefined()
    expect(normalizeCommit('abc')).toBeUndefined()
    expect(normalizeCommit('zzzzzzz')).toBeUndefined()
    expect(normalizeCommit('')).toBeUndefined()
    expect(normalizeCommit(undefined)).toBeUndefined()
    expect(normalizeCommit(null)).toBeUndefined()
  })
})
