import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  effectiveBillingStatus,
  expireStaleGrace,
  GRACE_PERIOD_MS,
} from '@/lib/project-billing'

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  LEVEL 1 — MercadoPago webhook, OUR-SIDE billing lifecycle (website branch)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS SUITE PROVES
 *   Driving app/api/mp/webhook/route.ts end to end with VALIDLY-SIGNED
 *   notifications, it proves our own half of the billing machine:
 *     - our HMAC verifier accepts a payload our signer produced, rejects a
 *       tampered one, and fails CLOSED when the secret is unset;
 *     - the guarded `updateMany` state transitions per branch (authorize →
 *       active, recurring approved → stays/recovers active, recurring failed →
 *       grace, grace elapsed → suspended, cancel → suspended/cancelled);
 *     - the read-time grace→suspended derivation (effectiveBillingStatus);
 *     - idempotency under MP retries: re-delivering the SAME notification does
 *       not slide a grace deadline, re-suspend, re-recover, or re-run the plan
 *       reconciliation — the `count > 0` guards make each side effect fire once.
 *
 * WHAT THIS SUITE DOES **NOT** PROVE — READ THIS BEFORE TRUSTING IT
 *   It is CIRCULAR on exactly the thing most likely to be wrong. Every payload
 *   and every signature here is authored from OUR reading of MercadoPago's docs
 *   (see `assumedMp*` helpers below). The test that "proves" our verifier
 *   accepts our signer proves SELF-CONSISTENCY, not conformance to real MP:
 *     - it does NOT prove MP signs with the manifest string we assume
 *       (`id:<data.id>;request-id:<x-request-id>;ts:<ts>;`);
 *     - it does NOT prove MP's real preapproval / payment / authorized_payment
 *       JSON matches the field names and nesting in `assumedMp*`;
 *     - it does NOT prove that over MP's real monthly billing cycle a failed
 *       card actually emits `subscription_authorized_payment` with a status in
 *       our FAILED set — that is only observable against MP itself.
 *   Closing those requires Level 2 (agent + MP sandbox credentials replaying
 *   real notifications) and Level 3 (a human, one real charge cycle). This file
 *   closes the OUR-SIDE half only. It does NOT close the billing blocker.
 *
 * ISOLATION
 *   No network (global `fetch` is stubbed), no real DB (prisma is an in-memory
 *   fake), no real MercadoPago. The MP re-fetch is mocked to return the shape
 *   our CODE expects — quarantined behind the `assumedMp*` helpers so it is
 *   obvious the shape is OUR ASSUMPTION, not an MP-verified fact.
 * ════════════════════════════════════════════════════════════════════════════
 */

// The module reads MP_WEBHOOK_SECRET and MP_ACCESS_TOKEN into module-level
// consts AT IMPORT TIME, so they must exist before the dynamic import below.
// Assigned directly (not vi.stubEnv) so `unstubEnvs` cannot wipe them mid-suite.
const TEST_SECRET = 'level1-webhook-secret-do-not-ship'
process.env.MP_WEBHOOK_SECRET = TEST_SECRET
process.env.MP_ACCESS_TOKEN = 'level1-access-token'

const WEBHOOK_URL = 'https://app.test/api/mp/webhook'

// ─────────────────────────────────────────────────────────────────────────────
// Shared, hoisted mock state. Lives here (not in the route module) so it
// survives `vi.resetModules()` and is reachable from both the mock factories
// and the assertions.
// ─────────────────────────────────────────────────────────────────────────────
const H = vi.hoisted(() => {
  // Typed with (...args: any[]) so `.mock.calls[i]` is an indexable array —
  // several assertions read the details argument at index 1.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spy = () => vi.fn(async (..._args: any[]) => {})
  const email = {
    sendPaymentConfirmationEmail: spy(),
    sendSubscriptionCancelledEmail: spy(),
    sendAdminProvisioningAlert: spy(),
    sendSitePaymentFailedEmail: spy(),
    sendSiteSuspendedEmail: spy(),
    sendSiteRecoveredEmail: spy(),
    sendAdminSiteBillingAlert: spy(),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: { project: any; user: any } = { project: null, user: null }
  const counters = { userUpdate: 0, projectUpdateMany: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchRef: { impl: ((url: string, init?: any) => Promise<any>) | null } = { impl: null }
  return { email, state, counters, fetchRef }
})

/**
 * Minimal in-memory prisma stand-in — implements ONLY the query shapes the
 * website-project branch of the webhook actually issues, and fails loudly on
 * any `where` operator it does not model, so a code change that starts using a
 * new operator cannot silently pass. NOT vi.fn's: `restoreMocks: true` would
 * strip their implementations before each test. Call counts are tracked in
 * H.counters instead.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchWhere(row: any, where: any): boolean {
  if (!row) return false
  for (const [k, cond] of Object.entries(where)) {
    if (k === 'OR') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(cond as any[]).some((sub) => matchWhere(row, sub))) return false
      continue
    }
    const val = row[k]
    if (cond === null) {
      if (val !== null && val !== undefined) return false
      continue
    }
    if (typeof cond === 'object' && !(cond instanceof Date)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = cond as any
      if ('in' in c) {
        if (!c.in.includes(val)) return false
        continue
      }
      if ('not' in c) {
        if (val === c.not) return false
        continue
      }
      if ('lte' in c) {
        if (val == null) return false
        if (new Date(val).getTime() > new Date(c.lte).getTime()) return false
        continue
      }
      throw new Error(`in-memory prisma: unsupported where operator ${JSON.stringify(cond)}`)
    }
    if (val !== cond) return false
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyData(row: any, data: any): void {
  for (const [k, v] of Object.entries(data)) row[k] = v
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateMany: async ({ where, data }: any) => {
        H.counters.projectUpdateMany++
        const row = H.state.project
        if (row && matchWhere(row, where)) {
          applyData(row, data)
          return { count: 1 }
        }
        return { count: 0 }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findUnique: async ({ where, include }: any) => {
        const row = H.state.project
        if (!row || row.id !== where.id) return null
        if (include?.user) return { ...row, user: { email: H.state.user?.email ?? null } }
        return { ...row }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findFirst: async ({ where }: any) => {
        const row = H.state.project
        return row && matchWhere(row, where) ? { ...row } : null
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: async ({ where }: any) => {
        const row = H.state.project
        return row && matchWhere(row, where)
          ? [{ plan: row.plan, billingStatus: row.billingStatus, graceUntil: row.graceUntil }]
          : []
      },
    },
    user: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: async ({ where, data }: any) => {
        H.counters.userUpdate++
        if (H.state.user && H.state.user.id === where.id) applyData(H.state.user, data)
        return H.state.user
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findUnique: async ({ where }: any) =>
        H.state.user && H.state.user.id === where.id ? { email: H.state.user.email } : null,
    },
  },
}))

vi.mock('@/lib/email', () => H.email)

// Rate limit is stubbed to always-allow so the suite can never flake on MP's
// retry burst tripping the real per-IP counter. Not the subject under test.
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 99, resetAt: 0 }),
  getClientIp: () => 'test-ip',
}))

// Route reads global fetch for the MP re-fetch; delegate to the per-test impl.
vi.stubGlobal('fetch', (url: string, init?: unknown) => {
  if (!H.fetchRef.impl) throw new Error('fetch called but no MP impl installed for this test')
  return H.fetchRef.impl(url, init)
})

const { POST } = await import('@/app/api/mp/webhook/route')

// ─────────────────────────────────────────────────────────────────────────────
//  OUR-ASSUMED MercadoPago resource shapes
//
//  Everything below is what OUR CODE expects to read back from the MP API — NOT
//  a shape verified against a real MercadoPago response. This is the ONLY place
//  the assumed shapes live, so the circularity of Level 1 is contained and
//  obvious: if MP's real JSON differs (field names, nesting, status vocabulary),
//  THIS is where the wrong assumption hides. See the honesty block up top.
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mpOk(body: any) {
  return { ok: true, status: 200, json: async () => body }
}
function mpErr(status: number) {
  return { ok: false, status, json: async () => ({ error: 'mp error', status }) }
}

/** GET /preapproval/{id} — the subscription's own state. */
function assumedMpPreapproval(opts: { id: string; status: string; externalReference: string }) {
  return { id: opts.id, status: opts.status, external_reference: opts.externalReference }
}

/** GET /v1/payments/{id} — a single (recurring) charge. preapproval link lives in metadata. */
function assumedMpPayment(opts: { id: string; status: string; preapprovalId?: string; externalReference?: string }) {
  return {
    id: opts.id,
    status: opts.status,
    external_reference: opts.externalReference ?? '',
    metadata: opts.preapprovalId ? { preapproval_id: opts.preapprovalId } : {},
  }
}

/** GET /authorized_payments/{id} — wraps the charge; the inner payment.status is the money fact. */
function assumedMpAuthorizedPayment(opts: { id: string; status: string; preapprovalId?: string; externalReference?: string }) {
  return {
    id: opts.id,
    payment: { status: opts.status },
    preapproval_id: opts.preapprovalId,
    external_reference: opts.externalReference ?? '',
  }
}

/** Install a single fixed MP resource for the whole request (MP returns the same resource on retry). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function installMp(resource: any) {
  H.fetchRef.impl = async () => mpOk(resource)
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function installMpError(status: number) {
  H.fetchRef.impl = async () => mpErr(status)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Signing — the manifest format read straight out of verifyMPSignature():
//    manifest = `id:${data.id};request-id:${x-request-id};ts:${ts};`
//    header x-signature = `ts=${ts},v1=${HMAC_SHA256_hex(secret, manifest)}`
//  A payload signed here is, by construction, one our own verifier accepts — the
//  exact self-consistency Level 1 is honest about not transcending.
// ─────────────────────────────────────────────────────────────────────────────
function flipLastHex(hex: string): string {
  const last = hex[hex.length - 1]
  const repl = last === '0' ? '1' : '0'
  return hex.slice(0, -1) + repl
}

function signedRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  opts: { secret?: string; requestId?: string; ts?: string; tamper?: boolean } = {}
): NextRequest {
  const secret = opts.secret ?? TEST_SECRET
  const requestId = opts.requestId ?? 'req-abc-123'
  const ts = opts.ts ?? '1700000000'
  const dataId = body?.data?.id ?? ''
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  let v1 = createHmac('sha256', secret).update(manifest).digest('hex')
  if (opts.tamper) v1 = flipLastHex(v1) // same length → forces the real HMAC compare, not a length short-circuit
  return new NextRequest(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-signature': `ts=${ts},v1=${v1}`,
      'x-request-id': requestId,
    },
    body: JSON.stringify(body),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
//  Seed helpers
// ─────────────────────────────────────────────────────────────────────────────
const PROJECT_ID = 'proj_1'
const USER_ID = 'user_1'
const PREAPPROVAL_ID = 'pre_1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function seedProject(overrides: Record<string, any> = {}) {
  H.state.project = {
    id: PROJECT_ID,
    userId: USER_ID,
    name: 'Test Site',
    slug: 'test-site',
    subdomain: null,
    plan: 'free',
    hasPaid: false,
    billingStatus: 'active',
    graceUntil: null,
    suspendedAt: null,
    suspendedReason: null,
    preapprovalId: null,
    businessData: JSON.stringify({ name: 'Test Site', contact: { email: 'owner@test.dev' } }),
    status: 'published',
    ...overrides,
  }
  H.state.user = { id: USER_ID, email: 'account@test.dev', plan: 'free' }
}

/** Notification envelopes (the thin nudge MP POSTs; the real data is re-fetched). */
const preapprovalNotification = (id = PREAPPROVAL_ID) => ({ type: 'preapproval', data: { id } })
const paymentNotification = (id = 'pay_1') => ({ type: 'payment', data: { id } })
const recurringNotification = (id = 'authpay_1') => ({ type: 'subscription_authorized_payment', data: { id } })

const project = () => H.state.project
const user = () => H.state.user

beforeEach(() => {
  H.counters.userUpdate = 0
  H.counters.projectUpdateMany = 0
  H.fetchRef.impl = null
  seedProject()
  // email spies are auto-reset by restoreMocks:true before each test
})

// ═════════════════════════════════════════════════════════════════════════════
//  1. SIGNATURE — the gate everything else sits behind
// ═════════════════════════════════════════════════════════════════════════════
describe('signature verification (self-consistency of our signer ↔ our verifier)', () => {
  it('accepts a payload signed with the test secret and reaches the branch', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    const res = await POST(signedRequest(preapprovalNotification()))
    expect(res.status).toBe(200)
    // Proof it got PAST the gate and into the website branch, not just a bare 200.
    expect(project().billingStatus).toBe('active')
    expect(project().hasPaid).toBe(true)
  })

  it('rejects a tampered signature with 403 (real HMAC compare, equal length)', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    const res = await POST(signedRequest(preapprovalNotification(), { tamper: true }))
    expect(res.status).toBe(403)
    // Gate closed BEFORE any state change or MP read.
    expect(project().hasPaid).toBe(false)
    expect(H.counters.projectUpdateMany).toBe(0)
  })

  it('rejects when x-signature / x-request-id headers are missing (403)', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    const req = new NextRequest(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(preapprovalNotification()),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('FAILS CLOSED — rejects every webhook when MP_WEBHOOK_SECRET is unset', async () => {
    // The route captured the secret at import; to exercise the unset path we
    // re-import the module with the env var removed. Other tests keep using the
    // top-level `POST` (a different, still-configured module instance).
    vi.resetModules()
    const saved = process.env.MP_WEBHOOK_SECRET
    delete process.env.MP_WEBHOOK_SECRET
    try {
      const { POST: PostNoSecret } = await import('@/app/api/mp/webhook/route')
      // Signed with the real secret — must STILL be rejected, because with no
      // configured secret the only safe answer is "reject", never "accept".
      const res = await PostNoSecret(signedRequest(preapprovalNotification()))
      expect(res.status).toBe(403)
    } finally {
      process.env.MP_WEBHOOK_SECRET = saved
      vi.resetModules()
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  2. AUTHORIZATION — preapproval authorized → paid/active + User.plan + email
// ═════════════════════════════════════════════════════════════════════════════
describe('authorization (preapproval authorized)', () => {
  it('activates the project, marks it paid, and pins the plan', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    const res = await POST(signedRequest(preapprovalNotification()))
    expect(res.status).toBe(200)
    expect(project().hasPaid).toBe(true)
    expect(project().billingStatus).toBe('active')
    expect(project().plan).toBe('professional')
    expect(project().preapprovalId).toBe(PREAPPROVAL_ID)
    expect(project().graceUntil).toBeNull()
  })

  it('reflects the paid plan on the owner account (User.plan → highest held)', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    await POST(signedRequest(preapprovalNotification()))
    expect(user().plan).toBe('professional')
  })

  it('fires the payment-confirmation path for the site (type project)', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:essential` }))
    await POST(signedRequest(preapprovalNotification()))
    expect(H.email.sendPaymentConfirmationEmail).toHaveBeenCalledTimes(1)
    const [, details] = H.email.sendPaymentConfirmationEmail.mock.calls[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((details as any).type).toBe('project')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((details as any).plan).toBe('essential')
  })

  it('clears a prior billing hold (grace/suspended) on re-authorization', async () => {
    seedProject({ billingStatus: 'grace', graceUntil: new Date(Date.now() - 1000), hasPaid: true, plan: 'essential' })
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    await POST(signedRequest(preapprovalNotification()))
    expect(project().billingStatus).toBe('active')
    expect(project().graceUntil).toBeNull()
    expect(project().suspendedReason).toBeNull()
  })

  /**
   * HONEST IDEMPOTENCY FINDING — authorization is idempotent on STATE but NOT on
   * the confirmation email. Unlike the product branches (monitoring, reviews…),
   * the website-project `authorized` branch issues an UNGUARDED `updateMany` by
   * id (no `count === 0` early return), so a re-delivered `authorized`
   * notification re-writes the same row values (state stays put) but re-sends
   * the payment-confirmation email. This documents the real code, not the ideal.
   */
  it('is idempotent on STATE across MP retries, but re-sends the confirmation email (documented gap)', async () => {
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'authorized', externalReference: `${PROJECT_ID}:professional` }))
    await POST(signedRequest(preapprovalNotification()))
    await POST(signedRequest(preapprovalNotification())) // MP retry
    // State is stable — the retry changed nothing observable.
    expect(project().hasPaid).toBe(true)
    expect(project().billingStatus).toBe('active')
    expect(project().plan).toBe('professional')
    expect(user().plan).toBe('professional')
    // …but the website branch has no count-guard on the email, so it fired twice.
    expect(H.email.sendPaymentConfirmationEmail).toHaveBeenCalledTimes(2)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  3. RECURRING PAYMENT SUCCESS — stays active
// ═════════════════════════════════════════════════════════════════════════════
describe('recurring payment approved', () => {
  it('leaves an already-active project active and sends no recovery email', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    // exercises the subscription_authorized_payment shape (inner payment.status)
    installMp(assumedMpAuthorizedPayment({ id: 'authpay_1', status: 'approved', preapprovalId: PREAPPROVAL_ID }))
    const res = await POST(signedRequest(recurringNotification()))
    expect(res.status).toBe(200)
    expect(project().billingStatus).toBe('active')
    expect(H.email.sendSiteRecoveredEmail).not.toHaveBeenCalled()
  })

  it('recovers a project that was in grace back to active, and notifies once', async () => {
    seedProject({ billingStatus: 'grace', graceUntil: new Date(Date.now() + GRACE_PERIOD_MS), hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_1', status: 'approved', preapprovalId: PREAPPROVAL_ID }))
    await POST(signedRequest(paymentNotification()))
    expect(project().billingStatus).toBe('active')
    expect(project().graceUntil).toBeNull()
    expect(H.email.sendSiteRecoveredEmail).toHaveBeenCalledTimes(1)
  })

  it('is idempotent: a re-delivered approved charge does not re-recover or re-email', async () => {
    seedProject({ billingStatus: 'grace', graceUntil: new Date(Date.now() + GRACE_PERIOD_MS), hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_1', status: 'approved', preapprovalId: PREAPPROVAL_ID }))
    await POST(signedRequest(paymentNotification()))
    await POST(signedRequest(paymentNotification())) // MP retry
    expect(project().billingStatus).toBe('active')
    expect(H.email.sendSiteRecoveredEmail).toHaveBeenCalledTimes(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  4. RECURRING PAYMENT FAILED — enters grace, graceUntil set, grace email fires
// ═════════════════════════════════════════════════════════════════════════════
describe('recurring payment failed', () => {
  it('moves an active project into grace with a future graceUntil and emails the owner', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_1', status: 'rejected', preapprovalId: PREAPPROVAL_ID }))
    const before = Date.now()
    await POST(signedRequest(paymentNotification()))
    expect(project().billingStatus).toBe('grace')
    expect(project().graceUntil).toBeInstanceOf(Date)
    expect(new Date(project().graceUntil).getTime()).toBeGreaterThan(before)
    expect(H.email.sendSitePaymentFailedEmail).toHaveBeenCalledTimes(1)
    expect(H.email.sendAdminSiteBillingAlert).toHaveBeenCalledTimes(1)
  })

  it.each(['charged_back', 'refunded', 'cancelled'])(
    'also treats %s as a failed charge (enters grace)',
    async (failStatus) => {
      seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
      installMp(assumedMpPayment({ id: 'pay_1', status: failStatus, preapprovalId: PREAPPROVAL_ID }))
      await POST(signedRequest(paymentNotification()))
      expect(project().billingStatus).toBe('grace')
    }
  )

  it('is idempotent: a re-delivered failed charge does NOT slide the grace deadline nor re-email', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_1', status: 'rejected', preapprovalId: PREAPPROVAL_ID }))
    await POST(signedRequest(paymentNotification()))
    const firstDeadline = new Date(project().graceUntil).getTime()
    await POST(signedRequest(paymentNotification())) // MP retry, still within grace
    expect(new Date(project().graceUntil).getTime()).toBe(firstDeadline) // NOT slid forward
    expect(project().billingStatus).toBe('grace')
    expect(H.email.sendSitePaymentFailedEmail).toHaveBeenCalledTimes(1) // NOT re-sent
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  5. GRACE ELAPSED → SUSPENDED
//     (read-time derivation + the one webhook event that can persist it)
// ═════════════════════════════════════════════════════════════════════════════
describe('grace elapsed → suspended', () => {
  it('read-time: effectiveBillingStatus reports suspended once graceUntil has passed', () => {
    const past = new Date(Date.now() - 1000)
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: past })).toBe('suspended')
    // a still-open window stays grace
    const future = new Date(Date.now() + GRACE_PERIOD_MS)
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: future })).toBe('grace')
    // grace with NO deadline fails closed to suspended
    expect(effectiveBillingStatus({ billingStatus: 'grace', graceUntil: null })).toBe('suspended')
  })

  it('cron path: expireStaleGrace persists an elapsed grace row to suspended/payment_failed', async () => {
    // Standalone one-row delegate — the reporting optimisation the read paths
    // already simulate. Mirrors the ProjectDelegate contract in project-billing.
    const now = new Date('2026-07-22T12:00:00.000Z')
    const row = { billingStatus: 'grace', graceUntil: new Date(now.getTime() - 1), suspendedAt: null as Date | null, suspendedReason: null as string | null }
    const delegate = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateMany: async ({ where, data }: any) => {
        const graceOk = where.billingStatus === 'grace' && row.billingStatus === 'grace'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orOk = (where.OR as any[]).some(
          (c) => (c.graceUntil === null && row.graceUntil === null) || (c.graceUntil?.lte && row.graceUntil && row.graceUntil <= c.graceUntil.lte)
        )
        if (graceOk && orOk) {
          Object.assign(row, data)
          return { count: 1 }
        }
        return { count: 0 }
      },
    }
    const count = await expireStaleGrace(delegate, {}, now)
    expect(count).toBe(1)
    expect(row.billingStatus).toBe('suspended')
    expect(row.suspendedReason).toBe('payment_failed')
  })

  it('webhook path: a failed charge after grace elapsed persists suspension and emails once', async () => {
    const elapsed = new Date(Date.now() - 1000)
    seedProject({ billingStatus: 'grace', graceUntil: elapsed, hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_2', status: 'rejected', preapprovalId: PREAPPROVAL_ID }))
    await POST(signedRequest(paymentNotification('pay_2')))
    expect(project().billingStatus).toBe('suspended')
    expect(project().suspendedReason).toBe('payment_failed')
    expect(H.email.sendSiteSuspendedEmail).toHaveBeenCalledTimes(1)
  })

  it('is idempotent: re-delivering the failed charge after suspension does not re-email', async () => {
    const elapsed = new Date(Date.now() - 1000)
    seedProject({ billingStatus: 'grace', graceUntil: elapsed, hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPayment({ id: 'pay_2', status: 'rejected', preapprovalId: PREAPPROVAL_ID }))
    await POST(signedRequest(paymentNotification('pay_2')))
    await POST(signedRequest(paymentNotification('pay_2'))) // MP retry, now already suspended
    expect(project().billingStatus).toBe('suspended')
    expect(H.email.sendSiteSuspendedEmail).toHaveBeenCalledTimes(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  6. CANCELLATION — preapproval cancelled → suspended immediately, reason cancelled
// ═════════════════════════════════════════════════════════════════════════════
describe('cancellation (preapproval cancelled)', () => {
  it('suspends immediately with reason cancelled and no grace window', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'cancelled', externalReference: `${PROJECT_ID}:professional` }))
    const res = await POST(signedRequest(preapprovalNotification()))
    expect(res.status).toBe(200)
    expect(project().billingStatus).toBe('suspended')
    expect(project().suspendedReason).toBe('cancelled')
    expect(project().graceUntil).toBeNull()
    // hasPaid deliberately stays true — it records payment history, the gate is billingStatus.
    expect(project().hasPaid).toBe(true)
    expect(project().suspendedAt).toBeInstanceOf(Date)
  })

  it('reconciles the owner account plan down (User.plan recomputed)', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    H.state.user.plan = 'professional'
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'cancelled', externalReference: `${PROJECT_ID}:professional` }))
    await POST(signedRequest(preapprovalNotification()))
    // suspended project no longer counts → recomputed to free (no other live project)
    expect(user().plan).toBe('free')
  })

  it('is idempotent: re-delivering the cancellation does not re-suspend or re-run the plan sync', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional', preapprovalId: PREAPPROVAL_ID })
    installMp(assumedMpPreapproval({ id: PREAPPROVAL_ID, status: 'cancelled', externalReference: `${PROJECT_ID}:professional` }))
    await POST(signedRequest(preapprovalNotification()))
    const suspendedAt = project().suspendedAt
    const userUpdatesAfterFirst = H.counters.userUpdate
    await POST(signedRequest(preapprovalNotification())) // MP retry
    expect(project().billingStatus).toBe('suspended')
    expect(project().suspendedAt).toBe(suspendedAt) // NOT re-stamped
    // The count-guard (billingStatus NOT suspended) blocks the second pass, so
    // syncUserPlanFromProjects (a user.update) does not run again.
    expect(H.counters.userUpdate).toBe(userUpdatesAfterFirst)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
//  Upstream MP read failures must NOT be answered 200 (retry, don't drop)
// ═════════════════════════════════════════════════════════════════════════════
describe('MP re-fetch failure is not silently acknowledged', () => {
  it('answers 502 (so MP retries) when the preapproval read returns 5xx, and touches no state', async () => {
    seedProject({ billingStatus: 'active', hasPaid: true, plan: 'professional' })
    installMpError(500)
    const res = await POST(signedRequest(preapprovalNotification()))
    expect(res.status).toBe(502)
    expect(H.counters.projectUpdateMany).toBe(0)
    expect(project().billingStatus).toBe('active')
  })
})
