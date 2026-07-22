import { describe, it, expect, vi } from 'vitest'
import {
  DELETION_WINDOW_MS,
  PURGE_PLAN,
  SUBSCRIPTION_PURGE_SPECS,
  accountDeletionState,
  allCancellationsSucceeded,
  buildAnonymisation,
  buildDeletionRequestData,
  confirmationMatches,
  findAccountsDueForPurge,
  getPurgeDueDate,
  isAccountAccessBlocked,
  isPurgeDue,
  projectNeedsCancellation,
  purgeAccount,
  subscriptionNeedsCancellation,
  tombstoneValue,
  uploadFilenameFromUrl,
  type CancellationOutcome,
} from '@/lib/account-deletion'

/**
 * Account deletion is the only destructive path in this codebase, and the two
 * ways it can go wrong are both silent:
 *
 *   - it deletes an account while MercadoPago keeps charging the person, or
 *   - it says "deleted" and leaves personal data behind.
 *
 * So these tests are mostly about the CONTENT of the statements issued, not
 * about return values: buildAnonymisation() is asserted field-by-field, and the
 * purge is run against a fake client that records every call.
 *
 * Every assertion injects `now`. Nothing here reads the wall clock or a DB.
 */

const NOW = new Date('2026-07-22T12:00:00.000Z')
const ms = (n: number) => new Date(NOW.getTime() + n)

describe('the 30-day window', () => {
  it('is exactly 30 days', () => {
    expect(DELETION_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000)
  })

  it('schedules the purge one window after the request', () => {
    expect(getPurgeDueDate(NOW).getTime()).toBe(NOW.getTime() + DELETION_WINDOW_MS)
  })

  it('stamps both the request and the deadline together', () => {
    const data = buildDeletionRequestData(NOW)
    expect(data.deletionRequestedAt).toEqual(NOW)
    expect(data.deletionScheduledFor).toEqual(getPurgeDueDate(NOW))
  })

  it('is not yet due the instant it is requested', () => {
    const data = buildDeletionRequestData(NOW)
    expect(isPurgeDue({ ...data, deletedAt: null }, NOW)).toBe(false)
  })

  it('becomes due exactly at the deadline, not a millisecond before', () => {
    const user = { deletionScheduledFor: getPurgeDueDate(NOW), deletedAt: null }
    expect(isPurgeDue(user, ms(DELETION_WINDOW_MS - 1))).toBe(false)
    expect(isPurgeDue(user, ms(DELETION_WINDOW_MS))).toBe(true)
    expect(isPurgeDue(user, ms(DELETION_WINDOW_MS + 1))).toBe(true)
  })

  it('is never due again once purged — the sweep must not re-run on a tombstone', () => {
    expect(
      isPurgeDue({ deletionScheduledFor: ms(-999999), deletedAt: ms(-1000) }, NOW)
    ).toBe(false)
  })

  it('is never due for an account that never asked', () => {
    expect(isPurgeDue({ deletionScheduledFor: null, deletedAt: null }, NOW)).toBe(false)
    expect(isPurgeDue({}, NOW)).toBe(false)
  })
})

describe('accountDeletionState', () => {
  it('is active when nothing is stamped', () => {
    expect(accountDeletionState({})).toBe('active')
    expect(
      accountDeletionState({ deletionRequestedAt: null, deletedAt: null })
    ).toBe('active')
  })

  it('is pending_deletion once requested', () => {
    expect(accountDeletionState({ deletionRequestedAt: NOW })).toBe('pending_deletion')
  })

  it('reports purged even though the request stamp is also set', () => {
    expect(accountDeletionState({ deletionRequestedAt: ms(-1), deletedAt: NOW })).toBe('purged')
  })
})

/**
 * The access gate. This is what makes "the account is unusable from that
 * moment" true, so it must block on the REQUEST stamp — not on the deadline.
 */
describe('isAccountAccessBlocked', () => {
  it('lets a normal account through', () => {
    expect(isAccountAccessBlocked({})).toBe(false)
  })

  it('blocks the instant deletion is requested, NOT 30 days later', () => {
    expect(isAccountAccessBlocked(buildDeletionRequestData(NOW))).toBe(true)
  })

  it('keeps blocking a purged tombstone', () => {
    expect(isAccountAccessBlocked({ deletedAt: NOW })).toBe(true)
  })

  it('blocks on a stamp alone, with no deadline set at all', () => {
    // Fails closed: a half-written row must not be treated as a live account.
    expect(isAccountAccessBlocked({ deletionRequestedAt: NOW })).toBe(true)
  })
})

describe('confirmationMatches', () => {
  it('accepts the exact account email', () => {
    expect(confirmationMatches('ana@example.com', 'ana@example.com')).toBe(true)
  })

  it('tolerates case and surrounding whitespace — the user is retyping, not authenticating', () => {
    expect(confirmationMatches('  ANA@Example.com ', 'ana@example.com')).toBe(true)
  })

  it('rejects a different address', () => {
    expect(confirmationMatches('otro@example.com', 'ana@example.com')).toBe(false)
  })

  it('rejects a near miss', () => {
    expect(confirmationMatches('ana@example.co', 'ana@example.com')).toBe(false)
  })

  /** Fails closed on every degenerate input — this is the accident guard. */
  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
    ['an object', {}],
    ['a boolean true', true],
  ])('rejects %s as confirmation', (_label, typed) => {
    expect(confirmationMatches(typed, 'ana@example.com')).toBe(false)
  })

  it('rejects everything when the account has no email', () => {
    expect(confirmationMatches('', '')).toBe(false)
    expect(confirmationMatches('anything', null)).toBe(false)
    expect(confirmationMatches('anything', undefined)).toBe(false)
  })
})

/* ────────────────────────────────────────────────────────────────────────────
 * Billing must stop first
 * ──────────────────────────────────────────────────────────────────────────── */

describe('subscriptionNeedsCancellation', () => {
  it('needs cancelling when active with a preapproval', () => {
    expect(subscriptionNeedsCancellation({ status: 'active', preapprovalId: 'pre-1' })).toBe(true)
  })

  it('has nothing to cancel without a preapproval id', () => {
    expect(subscriptionNeedsCancellation({ status: 'active', preapprovalId: null })).toBe(false)
    expect(subscriptionNeedsCancellation({ status: 'trial' })).toBe(false)
  })

  it('skips a subscription already cancelled or suspended', () => {
    expect(subscriptionNeedsCancellation({ status: 'cancelled', preapprovalId: 'p' })).toBe(false)
    expect(subscriptionNeedsCancellation({ status: 'suspended', preapprovalId: 'p' })).toBe(false)
  })

  /**
   * The one that actually keeps charging people: the `authorized` webhook can
   * land after the row was written, so a preapproval id can exist while the
   * status still says pending_payment.
   */
  it('DOES cancel a pending_payment row that already has a preapproval id', () => {
    expect(
      subscriptionNeedsCancellation({ status: 'pending_payment', preapprovalId: 'pre-9' })
    ).toBe(true)
  })

  it('cancels a trial and a trial_expired row that carry a preapproval', () => {
    expect(subscriptionNeedsCancellation({ status: 'trial', preapprovalId: 'p' })).toBe(true)
    expect(subscriptionNeedsCancellation({ status: 'trial_expired', preapprovalId: 'p' })).toBe(true)
  })
})

describe('projectNeedsCancellation', () => {
  it('cancels an active paid site', () => {
    expect(projectNeedsCancellation({ preapprovalId: 'p', billingStatus: 'active' })).toBe(true)
  })

  it('has nothing to cancel on a free or gifted site', () => {
    expect(projectNeedsCancellation({ preapprovalId: null, billingStatus: 'active' })).toBe(false)
  })

  it('skips a site already deliberately cancelled', () => {
    expect(
      projectNeedsCancellation({
        preapprovalId: 'p',
        billingStatus: 'suspended',
        suspendedReason: 'cancelled',
      })
    ).toBe(false)
  })

  /**
   * A site suspended for payment_failed may STILL have a live preapproval
   * retrying at MercadoPago. Skipping it is how a departed customer keeps
   * getting charged for a site that is already offline.
   */
  it('DOES cancel a site suspended for payment_failed', () => {
    expect(
      projectNeedsCancellation({
        preapprovalId: 'p',
        billingStatus: 'suspended',
        suspendedReason: 'payment_failed',
      })
    ).toBe(true)
  })

  it('DOES cancel a site in grace', () => {
    expect(projectNeedsCancellation({ preapprovalId: 'p', billingStatus: 'grace' })).toBe(true)
  })
})

describe('allCancellationsSucceeded — the gate the deletion hangs on', () => {
  const ok = (product: string): CancellationOutcome => ({
    product,
    rowId: 'r',
    preapprovalId: 'p',
    ok: true,
  })
  const bad = (product: string): CancellationOutcome => ({
    product,
    rowId: 'r',
    preapprovalId: 'p',
    ok: false,
    reason: 'boom',
  })

  it('passes when everything cancelled', () => {
    expect(allCancellationsSucceeded([ok('a'), ok('b'), ok('c')])).toBe(true)
  })

  it('passes vacuously for an account with no billing at all', () => {
    expect(allCancellationsSucceeded([])).toBe(true)
  })

  it('FAILS on a single failure among many successes', () => {
    expect(allCancellationsSucceeded([ok('a'), ok('b'), bad('c'), ok('d')])).toBe(false)
  })

  it('FAILS when the only failure is the last one', () => {
    expect(allCancellationsSucceeded([ok('a'), bad('z')])).toBe(false)
  })
})

/* ────────────────────────────────────────────────────────────────────────────
 * The purge plan
 * ──────────────────────────────────────────────────────────────────────────── */

describe('PURGE_PLAN covers the whole cascade graph', () => {
  const delegates = PURGE_PLAN.map((s) => s.delegate)

  /**
   * Every model reachable from User in prisma/schema.prisma. If a relation is
   * added and not handled here, that is either an FK error at delete time or
   * personal data the policy says was deleted and was not.
   */
  it.each([
    'passwordResetToken',
    'media',
    'siteLead',
    'causasCase',
    'monitoringSubscription',
    'reviewsSubscription',
    'linkedInSubscription',
    'tradingSubscription',
    'leadsSubscription',
    'emailMarketingSubscription',
    'prospeccionSubscription',
    'facturacionSubscription',
    'causasSubscription',
    'turnosSubscription',
    'suiteJuridicaSubscription',
    'lexPostSubscription',
    'project',
    'inquiry',
    'user',
  ])('handles %s', (delegate) => {
    expect(delegates).toContain(delegate)
  })

  it('names all 12 subscription products', () => {
    expect(SUBSCRIPTION_PURGE_SPECS).toHaveLength(12)
  })

  it('lists every delegate exactly once', () => {
    expect(new Set(delegates).size).toBe(delegates.length)
  })

  /**
   * The retention half of the promise. Anything that carries money must NOT be
   * deleted outright, or the financial trail an accountant needs goes with it.
   */
  it.each(['project', 'user', ...SUBSCRIPTION_PURGE_SPECS.map((s) => s.delegate)])(
    'anonymises rather than deletes %s — it carries billing',
    (delegate) => {
      const spec = PURGE_PLAN.find((s) => s.delegate === delegate)!
      expect(spec.action).toBe('anonymise')
    }
  )

  it.each(['passwordResetToken', 'media', 'siteLead', 'causasCase'])(
    'deletes %s outright — no financial meaning',
    (delegate) => {
      expect(PURGE_PLAN.find((s) => s.delegate === delegate)!.action).toBe('delete')
    }
  )

  it('documents what every retained model keeps, for the accountant', () => {
    for (const spec of PURGE_PLAN) {
      if (spec.action === 'anonymise') {
        expect(spec.retains, `${spec.label} must document its retention`).toBeTruthy()
      }
    }
  })

  /**
   * Order is load-bearing exactly once: Inquiry is matched on the account
   * email, which the User spec then erases.
   */
  it('anonymises Inquiry BEFORE the User email is erased', () => {
    expect(delegates.indexOf('inquiry')).toBeLessThan(delegates.indexOf('user'))
  })

  it('destroys every stored credential blob', () => {
    const monitoring = PURGE_PLAN.find((s) => s.delegate === 'monitoringSubscription')!
    expect(monitoring.blank).toEqual(
      expect.arrayContaining([
        'credentialUser',
        'credentialPass',
        'credentialIv',
        'credentialTag',
      ])
    )
    const causas = PURGE_PLAN.find((s) => s.delegate === 'causasSubscription')!
    expect(causas.blank).toEqual(
      expect.arrayContaining(['mevUser', 'mevPass', 'mevIv', 'mevTag'])
    )
  })

  it('clears the payer email on all 12 subscription products', () => {
    for (const spec of SUBSCRIPTION_PURGE_SPECS) {
      const cleared = [...(spec.blank ?? []), ...(spec.nulls ?? [])]
      expect(cleared, `${spec.label} must clear payerEmail`).toContain('payerEmail')
    }
  })

  it('frees every UNIQUE addressable column so the next customer can claim it', () => {
    expect(PURGE_PLAN.find((s) => s.delegate === 'user')!.uniquePlaceholders).toContain('email')
    expect(
      PURGE_PLAN.find((s) => s.delegate === 'turnosSubscription')!.uniquePlaceholders
    ).toContain('slug')
    // Project.subdomain is nullable and UNIQUE — nulling it frees it, because
    // PostgreSQL unique indexes permit many NULLs.
    expect(PURGE_PLAN.find((s) => s.delegate === 'project')!.nulls).toContain('subdomain')
  })

  it('keeps the billing columns OFF every clear list', () => {
    const billingColumns = ['preapprovalId', 'plan', 'couponId', 'discountApplied', 'createdAt']
    for (const spec of PURGE_PLAN) {
      if (spec.action !== 'anonymise') continue
      const cleared = [
        ...(spec.blank ?? []),
        ...(spec.nulls ?? []),
        ...(spec.uniquePlaceholders ?? []),
      ]
      for (const column of billingColumns) {
        expect(cleared, `${spec.label} must retain ${column}`).not.toContain(column)
      }
    }
  })

  it('keeps hasPaid and the suspension trail on Project', () => {
    const project = PURGE_PLAN.find((s) => s.delegate === 'project')!
    const cleared = [...(project.blank ?? []), ...(project.nulls ?? [])]
    for (const column of ['hasPaid', 'billingStatus', 'suspendedAt', 'grantedBy', 'couponRedeemedAt']) {
      expect(cleared).not.toContain(column)
    }
  })

  it('erases the site content that holds the business identity', () => {
    const project = PURGE_PLAN.find((s) => s.delegate === 'project')!
    expect(project.blank).toEqual(expect.arrayContaining(['name', 'businessData', 'sections']))
  })
})

describe('buildAnonymisation', () => {
  it('blanks required columns and nulls optional ones', () => {
    const data = buildAnonymisation(
      { delegate: 'x', label: 'X', action: 'anonymise', blank: ['a'], nulls: ['b'] },
      'row-1'
    )
    expect(data).toEqual({ a: '', b: null })
  })

  it('gives a UNIQUE column a per-row placeholder, never a shared constant', () => {
    const spec = { delegate: 'user', label: 'User', action: 'anonymise' as const, uniquePlaceholders: ['email'] }
    const a = buildAnonymisation(spec, 'user-a')
    const b = buildAnonymisation(spec, 'user-b')
    expect(a.email).not.toBe(b.email)
  })

  it('produces a tombstone email in a domain that can never resolve', () => {
    // RFC 2606 reserves .invalid, so a tombstone can never be mailed by accident.
    expect(tombstoneValue('email', 'abc')).toBe('deleted-abc@deleted.invalid')
    expect(String(tombstoneValue('email', 'abc'))).toMatch(/\.invalid$/)
  })

  it('uses a plain placeholder for non-email unique columns', () => {
    expect(tombstoneValue('slug', 'xyz')).toBe('deleted-xyz')
  })

  it('is empty for a spec that clears nothing', () => {
    expect(buildAnonymisation({ delegate: 'x', label: 'X', action: 'anonymise' }, 'r')).toEqual({})
  })

  it('writes the real User anonymisation with no personal column left out', () => {
    const spec = PURGE_PLAN.find((s) => s.delegate === 'user')!
    expect(buildAnonymisation(spec, 'u1')).toEqual({
      name: null,
      password: null,
      image: null,
      freeAccountNote: null,
      email: 'deleted-u1@deleted.invalid',
    })
  })
})

describe('uploadFilenameFromUrl', () => {
  it('extracts the filename an upload is served from', () => {
    expect(uploadFilenameFromUrl('/api/uploads/abc123.png')).toBe('abc123.png')
  })

  /** A poisoned url column must never be able to unlink outside the folder. */
  it.each([
    ['path traversal', '/api/uploads/../../.env'],
    ['nested path', '/api/uploads/sub/dir.png'],
    ['a different route', '/api/other/abc.png'],
    ['an absolute external url', 'https://evil.test/api/uploads/abc.png'],
    ['a bare filename', 'abc.png'],
    ['empty', ''],
  ])('refuses %s', (_label, url) => {
    expect(uploadFilenameFromUrl(url)).toBeNull()
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 7],
  ])('refuses %s', (_label, url) => {
    expect(uploadFilenameFromUrl(url)).toBeNull()
  })
})

/* ────────────────────────────────────────────────────────────────────────────
 * Executing the purge against a recording fake
 * ──────────────────────────────────────────────────────────────────────────── */

/** A fake Prisma client that records every statement the purge issues. */
function fakeClient(overrides: Record<string, unknown[]> = {}) {
  const calls: Array<{ delegate: string; op: string; args: any }> = []
  const client: Record<string, any> = {}

  for (const spec of PURGE_PLAN) {
    const rows = overrides[spec.delegate] ?? []
    client[spec.delegate] = {
      findMany: vi.fn(async (args: any) => {
        calls.push({ delegate: spec.delegate, op: 'findMany', args })
        return rows
      }),
      updateMany: vi.fn(async (args: any) => {
        calls.push({ delegate: spec.delegate, op: 'updateMany', args })
        return { count: rows.length }
      }),
      update: vi.fn(async (args: any) => {
        calls.push({ delegate: spec.delegate, op: 'update', args })
        return {}
      }),
      deleteMany: vi.fn(async (args: any) => {
        calls.push({ delegate: spec.delegate, op: 'deleteMany', args })
        return { count: rows.length }
      }),
    }
  }
  return { client, calls }
}

describe('purgeAccount', () => {
  it('touches every model in the plan', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1', email: 'ana@example.com' }, NOW)

    for (const spec of PURGE_PLAN) {
      expect(
        calls.some((c) => c.delegate === spec.delegate),
        `${spec.label} was never touched`
      ).toBe(true)
    }
  })

  it('scopes every direct model by userId', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1', email: 'ana@example.com' }, NOW)

    const monitoring = calls.find((c) => c.delegate === 'monitoringSubscription')!
    expect(monitoring.args.where).toEqual({ userId: 'u1' })
  })

  /**
   * The two-level relations. Getting either wrong leaves third-party personal
   * data behind: SiteLead holds site visitors, CausasCase holds litigation.
   */
  it('reaches SiteLead through its parent Project', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1' }, NOW)
    const call = calls.find((c) => c.delegate === 'siteLead')!
    expect(call.op).toBe('deleteMany')
    expect(call.args.where).toEqual({ project: { userId: 'u1' } })
  })

  it('reaches CausasCase through its parent subscription', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1' }, NOW)
    const call = calls.find((c) => c.delegate === 'causasCase')!
    expect(call.op).toBe('deleteMany')
    expect(call.args.where).toEqual({ subscription: { userId: 'u1' } })
  })

  it('addresses the User row by its id', async () => {
    const { client, calls } = fakeClient({ user: [{ id: 'u1' }] })
    await purgeAccount(client, { id: 'u1' }, NOW)
    const find = calls.find((c) => c.delegate === 'user' && c.op === 'findMany')!
    expect(find.args.where).toEqual({ id: 'u1' })
  })

  it('matches Inquiry on the account email, case-insensitively', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1', email: 'Ana@Example.com' }, NOW)
    const call = calls.find((c) => c.delegate === 'inquiry')!
    expect(call.args.where).toEqual({
      email: { equals: 'Ana@Example.com', mode: 'insensitive' },
    })
  })

  it('never touches Inquiry when the account has no email — no blind match', async () => {
    const { client, calls } = fakeClient()
    await purgeAccount(client, { id: 'u1', email: null }, NOW)
    expect(calls.some((c) => c.delegate === 'inquiry')).toBe(false)
  })

  it('stamps deletedAt LAST, so a half-purge is retried rather than marked done', async () => {
    const { client, calls } = fakeClient({ user: [{ id: 'u1' }] })
    await purgeAccount(client, { id: 'u1' }, NOW)

    const stamp = calls.filter(
      (c) => c.delegate === 'user' && c.op === 'update' && c.args.data?.deletedAt
    )
    expect(stamp).toHaveLength(1)
    expect(stamp[0].args.data).toEqual({ deletedAt: NOW })
    expect(calls.indexOf(stamp[0])).toBe(calls.length - 1)
  })

  it('propagates a failure instead of stamping the tombstone', async () => {
    const { client } = fakeClient()
    client.project.findMany = vi.fn(async () => {
      throw new Error('constraint violation')
    })
    await expect(purgeAccount(client, { id: 'u1' }, NOW)).rejects.toThrow('constraint violation')
    // deletedAt was never written, so the account stays due for the next sweep.
    expect(client.user.update).not.toHaveBeenCalled()
  })

  it('reports per-model counts of what it actually touched', async () => {
    const { client } = fakeClient({ media: [{ id: 'm1' }, { id: 'm2' }] })
    const { counts } = await purgeAccount(client, { id: 'u1' }, NOW)
    expect(counts.Media).toBe(2)
  })

  it('uses a per-row update where the spec needs a unique placeholder', async () => {
    const { client, calls } = fakeClient({ project: [{ id: 'p1' }, { id: 'p2' }] })
    await purgeAccount(client, { id: 'u1' }, NOW)

    const updates = calls.filter((c) => c.delegate === 'project' && c.op === 'update')
    expect(updates).toHaveLength(2)
    expect(updates[0].args.data.slug).toBe('deleted-p1')
    expect(updates[1].args.data.slug).toBe('deleted-p2')
    // ...and never a blanket updateMany, which would collide the unique column.
    expect(calls.some((c) => c.delegate === 'project' && c.op === 'updateMany')).toBe(false)
  })

  it('frees the subdomain and erases the site content in the same statement', async () => {
    const { client, calls } = fakeClient({ project: [{ id: 'p1' }] })
    await purgeAccount(client, { id: 'u1' }, NOW)
    const { data } = calls.find((c) => c.delegate === 'project' && c.op === 'update')!.args
    expect(data.subdomain).toBeNull()
    expect(data.businessData).toBe('')
    expect(data.sections).toBe('')
    // The billing trail survives: nothing in the payload touches it.
    expect(data).not.toHaveProperty('preapprovalId')
    expect(data).not.toHaveProperty('hasPaid')
    expect(data).not.toHaveProperty('plan')
  })

  it('collects the upload filenames before the Media rows are deleted', async () => {
    const { client } = fakeClient({
      media: [
        { url: '/api/uploads/a.png', thumbnailUrl: '/api/uploads/a.png' },
        { url: '/api/uploads/b.jpg', thumbnailUrl: null },
      ],
    })
    const { uploadFilenames } = await purgeAccount(client, { id: 'u1' }, NOW)
    // Deduplicated: url and thumbnailUrl usually point at the same file.
    expect([...uploadFilenames].sort()).toEqual(['a.png', 'b.jpg'])
  })

  it('returns no filenames for an account that uploaded nothing', async () => {
    const { client } = fakeClient()
    const { uploadFilenames } = await purgeAccount(client, { id: 'u1' }, NOW)
    expect(uploadFilenames).toEqual([])
  })
})

describe('findAccountsDueForPurge', () => {
  const delegate = () => ({ findMany: vi.fn().mockResolvedValue([]) })

  it('asks for elapsed deadlines that are not already purged', async () => {
    const d = delegate()
    await findAccountsDueForPurge(d, NOW)
    expect(d.findMany.mock.calls[0][0].where).toEqual({
      deletionScheduledFor: { lte: NOW },
      deletedAt: null,
    })
  })

  it('uses `lte` so a deadline exactly at now is due — matching isPurgeDue', async () => {
    const d = delegate()
    await findAccountsDueForPurge(d, NOW)
    expect(d.findMany.mock.calls[0][0].where.deletionScheduledFor).toEqual({ lte: NOW })
    expect(isPurgeDue({ deletionScheduledFor: NOW, deletedAt: null }, NOW)).toBe(true)
  })

  it('selects only the id and email the purge needs', async () => {
    const d = delegate()
    await findAccountsDueForPurge(d, NOW)
    expect(d.findMany.mock.calls[0][0].select).toEqual({ id: true, email: true })
  })

  it('caps the batch so a backlog cannot time out the whole maintenance run', async () => {
    const d = delegate()
    await findAccountsDueForPurge(d, NOW)
    expect(d.findMany.mock.calls[0][0].take).toBe(50)

    const d2 = delegate()
    await findAccountsDueForPurge(d2, NOW, 5)
    expect(d2.findMany.mock.calls[0][0].take).toBe(5)
  })
})
