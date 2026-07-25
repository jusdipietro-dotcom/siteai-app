import { describe, it, expect, vi } from 'vitest'

/**
 * projectSerializer imports lib/published-site, which imports lib/prisma and
 * instantiates a PrismaClient at module load. The serializer itself never
 * touches the database, so the client is stubbed out: no DB, no generated
 * client required to run this suite.
 */
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

const {
  InvalidStatusError,
  InvalidSubdomainError,
  sanitizeLifecycleStatus,
  serializeProject,
  serializeProjectFromClient,
} = await import('@/lib/projectSerializer')

/**
 * The client-writable allowlist — the paywall. `serializeProjectFromClient`
 * receives a raw, attacker-controlled request body and decides what may reach
 * Prisma. Anything that leaks through here is a free published site or an
 * escalated plan.
 */

/** Fields that only trusted server code may ever write. */
const FORBIDDEN_FIELDS = [
  'hasPaid',
  'plan',
  'preapprovalId',
  'views',
  'publishedUrl',
  'status',
  'billingStatus',
  'graceUntil',
  'suspendedReason',
  'suspendedAt',
  'userId',
  'id',
  'createdAt',
  'updatedAt',
]

describe('serializeProjectFromClient — billing fields are stripped', () => {
  it('strips every forbidden field from a hostile body', () => {
    const hostile = {
      name: 'Mi negocio',
      hasPaid: true,
      plan: 'professional',
      preapprovalId: 'forged-preapproval-id',
      views: 999999,
      publishedUrl: 'https://attacker.tld',
      status: 'published',
      billingStatus: 'active',
      graceUntil: '2099-01-01T00:00:00.000Z',
      suspendedReason: null,
      userId: 'someone-elses-user-id',
      id: 'someone-elses-project-id',
    }

    const result = serializeProjectFromClient(hostile) as Record<string, unknown>

    for (const field of FORBIDDEN_FIELDS) {
      expect(result).not.toHaveProperty(field)
    }
    // The legitimate field still gets through.
    expect(result.name).toBe('Mi negocio')
  })

  it.each(['hasPaid', 'plan', 'preapprovalId', 'views', 'publishedUrl'])(
    'strips %s even when it is the ONLY field in the body',
    (field) => {
      const result = serializeProjectFromClient({ [field]: 'x' }) as Record<string, unknown>
      expect(result).not.toHaveProperty(field)
      expect(Object.keys(result)).toEqual([])
    }
  )

  it('never emits status — publishing is not an ordinary field write', () => {
    // The historical bug: PUT /api/projects/{id} {"status":"published"} put a
    // site live for free.
    for (const status of ['published', 'draft', 'ready', 'generating', 'error']) {
      const result = serializeProjectFromClient({ status }) as Record<string, unknown>
      expect(result).not.toHaveProperty('status')
    }
  })

  it('lets the legitimate content fields through', () => {
    const result = serializeProjectFromClient({
      name: 'Panaderia',
      slug: 'panaderia',
      template: 'modern',
      thumbnail: 'thumb.png',
      coverImageId: 'cover-1',
      businessData: { description: 'Pan' },
      sections: [{ id: 's1' }],
      mediaIds: ['m1'],
    }) as Record<string, unknown>

    expect(result.name).toBe('Panaderia')
    // slug is NOT client-writable — stripped so a client cannot PUT their slug to
    // another project's value and hijack that public URL. Generated server-side.
    expect(result.slug).toBeUndefined()
    expect(result.template).toBe('modern')
    expect(result.thumbnail).toBe('thumb.png')
    expect(result.coverImageId).toBe('cover-1')
    // JSON columns are stringified for storage.
    expect(result.businessData).toBe(JSON.stringify({ description: 'Pan' }))
    expect(result.sections).toBe(JSON.stringify([{ id: 's1' }]))
    expect(result.mediaIds).toBe(JSON.stringify(['m1']))
  })

  it('omits fields the body did not mention, so a partial update stays partial', () => {
    const result = serializeProjectFromClient({ name: 'Solo el nombre' })
    expect(Object.keys(result)).toEqual(['name'])
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'not an object'],
    ['a number', 42],
    ['a boolean', true],
  ])('returns an empty object for %s input', (_label, body) => {
    expect(serializeProjectFromClient(body)).toEqual({})
  })
})

describe('serializeProjectFromClient — prototype-pollution payloads', () => {
  /**
   * Built with JSON.parse on purpose: an object LITERAL `{__proto__: x}` sets
   * the prototype instead of creating an own property, so a literal would not
   * reproduce what an HTTP body actually delivers.
   */
  it('cannot smuggle anything through __proto__', () => {
    const body = JSON.parse('{"__proto__":{"hasPaid":true,"plan":"professional"}}')
    const result = serializeProjectFromClient(body) as Record<string, unknown>

    expect(result).not.toHaveProperty('hasPaid')
    expect(result).not.toHaveProperty('plan')
    expect(Object.keys(result)).toEqual([])
  })

  it('does not pollute Object.prototype', () => {
    const body = JSON.parse('{"__proto__":{"hasPaid":true}}')
    serializeProjectFromClient(body)

    expect(({} as Record<string, unknown>).hasPaid).toBeUndefined()
    expect((Object.prototype as Record<string, unknown>).hasPaid).toBeUndefined()
  })

  it('cannot smuggle anything through constructor', () => {
    const body = JSON.parse('{"constructor":{"prototype":{"hasPaid":true}}}')
    const result = serializeProjectFromClient(body) as Record<string, unknown>

    expect(result).not.toHaveProperty('constructor')
    expect(result).not.toHaveProperty('hasPaid')
    expect(({} as Record<string, unknown>).hasPaid).toBeUndefined()
  })

  /**
   * A JSON body can never carry a custom prototype: JSON.parse turns
   * "__proto__" into an ordinary OWN property and leaves the object's
   * prototype as Object.prototype. This is the property that makes the
   * serializer safe in practice, so it is pinned explicitly — if a future
   * refactor ever parsed bodies with something more permissive (a YAML/query
   * parser, or a hand-rolled merge), the prototype-chain read below would stop
   * being theoretical.
   */
  it('a JSON-parsed body cannot carry a custom prototype', () => {
    const body = JSON.parse('{"__proto__":{"name":"pwned"},"constructor":{"name":"pwned"}}')
    expect(Object.getPrototypeOf(body)).toBe(Object.prototype)
    expect(body.name).toBeUndefined()

    const result = serializeProjectFromClient(body) as Record<string, unknown>
    expect(result.name).toBeUndefined()
  })

  /**
   * KNOWN GAP — characterisation test, NOT an endorsement.
   *
   * serializeProjectFromClient reads `source[field]`, which resolves through
   * the prototype chain instead of own properties. An object with a crafted
   * prototype therefore contributes fields the caller never sent.
   *
   * Not reachable from the HTTP surface today: both callers
   * (app/api/projects/route.ts, app/api/projects/[id]/route.ts) pass the result
   * of `await request.json()`, and the test above pins why that is safe.
   *
   * This test asserts CURRENT behaviour so the gap is visible and tracked.
   * If the serializer is hardened to own-property reads (Object.hasOwn), this
   * test SHOULD go red — flip it to `toBeUndefined()` at that point.
   */
  it('KNOWN GAP: reads allowed fields through the prototype chain', () => {
    const result = serializeProjectFromClient(
      Object.create({ name: 'from-prototype', slug: 'from-prototype' })
    ) as Record<string, unknown>

    expect(result.name).toBe('from-prototype')
    // slug is no longer an allowed field, so it is not read even via the prototype.
    expect(result.slug).toBeUndefined()
  })

  /**
   * The gap does NOT extend to the forbidden fields: those are not in the
   * allowlist, so no prototype can introduce them. This is the load-bearing
   * half and it must stay green unconditionally.
   */
  it('a crafted prototype still cannot introduce a forbidden field', () => {
    const result = serializeProjectFromClient(
      Object.create({ hasPaid: true, plan: 'professional', status: 'published' })
    ) as Record<string, unknown>

    expect(result).not.toHaveProperty('hasPaid')
    expect(result).not.toHaveProperty('plan')
    expect(result).not.toHaveProperty('status')
  })

  it('survives a null-prototype body', () => {
    const body = Object.assign(Object.create(null), { name: 'ok', hasPaid: true })
    const result = serializeProjectFromClient(body) as Record<string, unknown>
    expect(result.name).toBe('ok')
    expect(result).not.toHaveProperty('hasPaid')
  })
})

describe('serializeProjectFromClient — subdomain is normalised and validated server-side', () => {
  it('normalises before storing — client normalisation is never trusted', () => {
    const result = serializeProjectFromClient({ subdomain: '  MiSitio  ' }) as Record<
      string,
      unknown
    >
    expect(result.subdomain).toBe('misitio')
  })

  it('rejects a reserved subdomain loudly, in its normalised form', () => {
    for (const reserved of ['www', 'WWW', 'Api', 'mcp', 'N8N', 'easypanel']) {
      expect(() => serializeProjectFromClient({ subdomain: reserved })).toThrow(
        InvalidSubdomainError
      )
    }
  })

  it('rejects a malformed subdomain loudly rather than dropping it', () => {
    for (const bad of ['ab', '-foo', 'foo-', 'foo--bar', 'foo.bar', 'a'.repeat(64)]) {
      expect(() => serializeProjectFromClient({ subdomain: bad })).toThrow(
        InvalidSubdomainError
      )
    }
  })

  it('carries the validator reason so the route can return a useful 400', () => {
    try {
      serializeProjectFromClient({ subdomain: 'www' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidSubdomainError)
      expect((err as Error).message.length).toBeGreaterThan(0)
    }
  })

  it('treats explicit null and empty string as "release the subdomain"', () => {
    expect((serializeProjectFromClient({ subdomain: null }) as Record<string, unknown>).subdomain).toBeNull()
    expect((serializeProjectFromClient({ subdomain: '' }) as Record<string, unknown>).subdomain).toBeNull()
    expect((serializeProjectFromClient({ subdomain: '   ' }) as Record<string, unknown>).subdomain).toBeNull()
  })

  it('rejects a non-string subdomain', () => {
    for (const bad of [42, {}, [], true]) {
      expect(() => serializeProjectFromClient({ subdomain: bad })).toThrow(
        InvalidSubdomainError
      )
    }
  })

  it('omits subdomain entirely when the body does not mention it', () => {
    const result = serializeProjectFromClient({ name: 'x' })
    expect(result).not.toHaveProperty('subdomain')
  })
})

describe('sanitizeLifecycleStatus', () => {
  it('returns undefined when the payload carries no status', () => {
    expect(sanitizeLifecycleStatus(undefined)).toBeUndefined()
  })

  it.each(['draft', 'generating', 'ready', 'error'])('allows %s', (status) => {
    expect(sanitizeLifecycleStatus(status)).toBe(status)
  })

  /**
   * Must THROW, not return undefined. A silently dropped status would let a
   * caller mistake a stripped field for a successful publish.
   */
  it('THROWS on published rather than silently dropping it', () => {
    expect(() => sanitizeLifecycleStatus('published')).toThrow(InvalidStatusError)
  })

  it('points the caller at the paid publish endpoint', () => {
    try {
      sanitizeLifecycleStatus('published')
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as Error).message).toMatch(/publish/i)
    }
  })

  it.each([
    ['an unknown status', 'superadmin'],
    ['a near-miss', 'Published'],
    ['a number', 1],
    ['null', null],
    ['an object', {}],
    ['an array', []],
    ['an empty string', ''],
  ])('throws on %s', (_label, value) => {
    expect(() => sanitizeLifecycleStatus(value)).toThrow(InvalidStatusError)
  })

  it('is case-sensitive — "PUBLISHED" is not a backdoor to a valid status', () => {
    expect(() => sanitizeLifecycleStatus('PUBLISHED')).toThrow(InvalidStatusError)
  })
})

describe('serializeProject — trusted server path', () => {
  /**
   * The contract difference that makes the allowlist meaningful: trusted code
   * CAN write billing fields. If this ever started stripping them, the
   * MercadoPago webhook would silently stop recording payments.
   */
  it('accepts the billing fields the client path refuses', () => {
    const result = serializeProject({
      hasPaid: true,
      plan: 'professional',
      status: 'published',
      views: 10,
      publishedUrl: 'https://x.tld',
    } as Parameters<typeof serializeProject>[0]) as Record<string, unknown>

    expect(result.hasPaid).toBe(true)
    expect(result.plan).toBe('professional')
    expect(result.status).toBe('published')
    expect(result.views).toBe(10)
    expect(result.publishedUrl).toBe('https://x.tld')
  })

  it('omits keys that were not provided, so a partial write stays partial', () => {
    expect(Object.keys(serializeProject({ name: 'x' }))).toEqual(['name'])
  })

  it('preserves falsy-but-meaningful values', () => {
    const result = serializeProject({ hasPaid: false, views: 0 } as Parameters<
      typeof serializeProject
    >[0]) as Record<string, unknown>
    expect(result.hasPaid).toBe(false)
    expect(result.views).toBe(0)
  })
})
