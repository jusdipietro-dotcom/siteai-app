import { describe, it, expect, vi } from 'vitest'
import { cancelPreapproval, type FetchLike } from '@/lib/mp-preapproval'

/**
 * The billing kill-switch behind account deletion.
 *
 * The contract that matters is not "did our PUT succeed" but "can this
 * preapproval still charge somebody". Those differ in exactly two places, and
 * both are tested here:
 *
 *   - MercadoPago answers 4xx for an already-cancelled preapproval. Reading
 *     that as a failure would permanently trap any user who cancelled from
 *     their own MP account, on a subscription that charges nobody.
 *   - a timeout, a network error and a 500 all mean "we do not know", which
 *     must be reported as failure so the deletion is abandoned.
 *
 * No test touches the network: `fetchImpl` is injected.
 */

const TOKEN = 'test-token'

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as Response

describe('cancelPreapproval — success', () => {
  it('reports cancelled when MercadoPago accepts the PUT', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { status: 'cancelled' })) as FetchLike
    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result).toEqual({ ok: true, outcome: 'cancelled' })
  })

  it('sends the cancellation as a PUT with the bearer token', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(200, {}))
    await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl: fetchImpl as FetchLike })

    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.mercadopago.com/preapproval/pre-1')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual({ status: 'cancelled' })
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`)
  })

  it('does not read the preapproval back when the PUT already succeeded', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(200, {}))
    await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl: fetchImpl as FetchLike })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

/**
 * The trap this branch exists to avoid: a payer who cancelled from their own
 * MercadoPago account would otherwise never be able to delete their account,
 * because our PUT would 4xx forever on a subscription charging nobody.
 */
describe('cancelPreapproval — already cancelled at MercadoPago', () => {
  it('treats a rejected PUT as success when MP reports the preapproval cancelled', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? jsonResponse(400, { message: 'invalid status transition' })
        : jsonResponse(200, { status: 'cancelled' })
    ) as FetchLike

    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result).toEqual({ ok: true, outcome: 'already_cancelled' })
  })

  it('reports it as already_cancelled, distinct from a cancellation we performed', async () => {
    const fetchImpl = (async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT' ? jsonResponse(409, {}) : jsonResponse(200, { status: 'cancelled' })) as FetchLike

    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result.outcome).toBe('already_cancelled')
    expect(result.outcome).not.toBe('cancelled')
  })

  it('does NOT accept a rejected PUT when MP still reports it authorized', async () => {
    const fetchImpl = (async (_url: string, init?: RequestInit) =>
      init?.method === 'PUT' ? jsonResponse(400, {}) : jsonResponse(200, { status: 'authorized' })) as FetchLike

    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('authorized')
  })

  it('does NOT accept a rejected PUT when the read-back also fails', async () => {
    const fetchImpl = (async () => jsonResponse(500, {})) as FetchLike
    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result.ok).toBe(false)
    expect(result.outcome).toBe('failed')
  })
})

describe('cancelPreapproval — failure paths', () => {
  it('fails when MercadoPago returns a server error', async () => {
    const fetchImpl = (async () => jsonResponse(500, {})) as FetchLike
    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('500')
  })

  it('fails on a network error rather than throwing', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed')
    }) as FetchLike
    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result).toEqual({
      ok: false,
      outcome: 'failed',
      reason: 'error de red al contactar MercadoPago',
    })
  })

  it('fails on a timeout, and says so', async () => {
    const fetchImpl = (async () => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      throw err
    }) as FetchLike
    const result = await cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('timeout')
  })

  /**
   * The misconfiguration case. Reporting "nothing to cancel" here is how a
   * deleted account keeps being charged: without a token we cannot know
   * anything about the subscription, so the only safe answer is failure.
   */
  it('FAILS — never silently succeeds — when MP_ACCESS_TOKEN is missing', async () => {
    const fetchImpl = vi.fn()
    const result = await cancelPreapproval('pre-1', {
      token: undefined,
      fetchImpl: fetchImpl as unknown as FetchLike,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('MP_ACCESS_TOKEN')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('never throws, whatever the transport does', async () => {
    const throwers: FetchLike[] = [
      (async () => {
        throw new Error('boom')
      }) as FetchLike,
      (async () => {
        throw 'a string, not an Error'
      }) as unknown as FetchLike,
      (async () => ({ ok: false, status: 503, json: async () => { throw new Error('bad json') } })) as unknown as FetchLike,
    ]
    for (const fetchImpl of throwers) {
      await expect(cancelPreapproval('pre-1', { token: TOKEN, fetchImpl })).resolves.toMatchObject({
        ok: false,
      })
    }
  })

  it('is bounded by a timeout — the signal is always passed', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse(200, {}))
    await cancelPreapproval('pre-1', {
      token: TOKEN,
      fetchImpl: fetchImpl as FetchLike,
      timeoutMs: 50,
    })
    expect(fetchImpl.mock.calls[0][1]?.signal).toBeDefined()
  })
})
