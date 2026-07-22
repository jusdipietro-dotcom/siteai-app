import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The publish gate is a private function, so it is exercised through the two
 * public loaders — which is also the boundary that matters: both addressing
 * modes must apply the SAME gate. A parallel gate is how one mode ends up
 * serving a site the other refuses.
 *
 * Prisma is stubbed: the assertion is on the `where` clause handed to it, so no
 * database is involved.
 */
const findFirst = vi.fn()
vi.mock('@/lib/prisma', () => ({ prisma: { project: { findFirst: (...a: unknown[]) => findFirst(...a) } } }))

const { findPublishedProjectBySlug, findPublishedProjectBySubdomain, parseJSON } =
  await import('@/lib/published-site')

const NOW = new Date('2026-07-22T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  findFirst.mockReset()
  findFirst.mockResolvedValue(null)
})

afterEach(() => {
  vi.useRealTimers()
})

const whereOf = () => findFirst.mock.calls[0][0].where as Record<string, unknown>

describe('publish gate — shared by both addressing modes', () => {
  it.each([
    ['slug', () => findPublishedProjectBySlug('mi-slug')],
    ['subdomain', () => findPublishedProjectBySubdomain('panaderia')],
  ])('requires status=published when resolving by %s', async (_label, call) => {
    await call()
    expect(whereOf().status).toBe('published')
  })

  it.each([
    ['slug', () => findPublishedProjectBySlug('mi-slug')],
    ['subdomain', () => findPublishedProjectBySubdomain('panaderia')],
  ])('requires hasPaid=true when resolving by %s — not implied by status', async (_l, call) => {
    await call()
    expect(whereOf().hasPaid).toBe(true)
  })

  it.each([
    ['slug', () => findPublishedProjectBySlug('mi-slug')],
    ['subdomain', () => findPublishedProjectBySubdomain('panaderia')],
  ])('admits only active or STILL-OPEN grace when resolving by %s', async (_l, call) => {
    await call()
    expect(whereOf().OR).toEqual([
      { billingStatus: 'active' },
      { billingStatus: 'grace', graceUntil: { gt: NOW } },
    ])
  })

  it('applies an IDENTICAL gate in both modes', async () => {
    await findPublishedProjectBySlug('mi-slug')
    const bySlug = { ...whereOf() } as Record<string, unknown>
    delete bySlug.slug

    findFirst.mockClear()
    await findPublishedProjectBySubdomain('panaderia')
    const bySub = { ...whereOf() } as Record<string, unknown>
    delete bySub.subdomain

    expect(bySlug).toEqual(bySub)
  })

  it('uses `gt` so a grace deadline exactly at now is already closed', async () => {
    await findPublishedProjectBySlug('mi-slug')
    const or = whereOf().OR as Array<Record<string, unknown>>
    expect(or[1].graceUntil).toEqual({ gt: NOW })
  })

  it('never admits a suspended project', async () => {
    await findPublishedProjectBySlug('mi-slug')
    const or = whereOf().OR as Array<Record<string, unknown>>
    expect(or.map((c) => c.billingStatus)).not.toContain('suspended')
  })
})

describe('findPublishedProjectBySlug', () => {
  it('scopes the query to the requested slug', async () => {
    await findPublishedProjectBySlug('mi-slug')
    expect(whereOf().slug).toBe('mi-slug')
  })

  it('returns null for an empty slug without querying', async () => {
    await expect(findPublishedProjectBySlug('')).resolves.toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
  })

  it('returns whatever the gated query returns', async () => {
    const row = { id: 'p-1' }
    findFirst.mockResolvedValue(row)
    await expect(findPublishedProjectBySlug('mi-slug')).resolves.toBe(row)
  })
})

describe('findPublishedProjectBySubdomain', () => {
  it('normalises before querying — stored subdomains are lowercase', async () => {
    await findPublishedProjectBySubdomain('  Panaderia  ')
    expect(whereOf().subdomain).toBe('panaderia')
  })

  it('returns null for an empty subdomain without querying', async () => {
    await expect(findPublishedProjectBySubdomain('')).resolves.toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
  })

  /**
   * A reserved or malformed label can never match a stored value, so it must
   * never reach the database.
   */
  it.each(['www', 'api', 'mcp', 'n8n', 'easypanel', 'ab', '-foo', 'foo--bar', 'a.b'])(
    'refuses to query for the invalid/reserved label %j',
    async (label) => {
      await expect(findPublishedProjectBySubdomain(label)).resolves.toBeNull()
      expect(findFirst).not.toHaveBeenCalled()
    }
  )
})

/**
 * parseJSON guards the project list: a single corrupt row must degrade to a
 * fallback instead of 500-ing the whole dashboard.
 */
describe('parseJSON', () => {
  it('parses valid JSON', () => {
    expect(parseJSON('{"a":1}', {})).toEqual({ a: 1 })
    expect(parseJSON('[1,2]', [])).toEqual([1, 2])
  })

  it('falls back on corrupt JSON instead of throwing', () => {
    const fallback = { safe: true }
    expect(() => parseJSON('{not json', fallback)).not.toThrow()
    expect(parseJSON('{not json', fallback)).toBe(fallback)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['an object', {}],
  ])('falls back for %s input', (_label, value) => {
    const fallback = { safe: true }
    expect(parseJSON(value, fallback)).toBe(fallback)
  })

  it('logs the context on corruption so it is visible rather than silent', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    parseJSON('{broken', {}, 'project p-1.businessData')
    expect(spy).toHaveBeenCalled()
    expect(String(spy.mock.calls[0][0])).toContain('project p-1.businessData')
    spy.mockRestore()
  })
})
