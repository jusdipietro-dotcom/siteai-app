import { describe, it, expect } from 'vitest'
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  generateRequestId,
  isValidRequestId,
  resolveRequestId,
  withCorrelationHeaders,
} from '@/lib/request-id'

/**
 * Correlation ids. The one that bites is the MercadoPago invariant at the
 * bottom of this file: MP signs a manifest containing the `x-request-id` header
 * it sent, so rewriting that header would 403 every payment notification.
 */

describe('isValidRequestId', () => {
  it('accepts a uuid — what MercadoPago and most proxies send', () => {
    expect(isValidRequestId('0f3d5a4c-1c2b-4a7e-9f10-8b6d2e5a1c99')).toBe(true)
  })

  it('accepts the other trace formats a proxy or gateway might already set', () => {
    // W3C traceparent, as forwarded by most tracing-aware proxies.
    expect(isValidRequestId('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')).toBe(true)
    expect(isValidRequestId('req_1a2b3c4d')).toBe(true)
    expect(isValidRequestId('req-1a2b3c4d')).toBe(true)
  })

  it('rejects anything that could forge a log line or split a response header', () => {
    expect(isValidRequestId('abcdefgh\ninjected')).toBe(false)
    expect(isValidRequestId('abcdefgh\r\nSet-Cookie: a=b')).toBe(false)
    expect(isValidRequestId('abcdefgh <script>')).toBe(false)
  })

  it('rejects values too short to correlate or long enough to bloat every line', () => {
    expect(isValidRequestId('short')).toBe(false)
    expect(isValidRequestId('a'.repeat(201))).toBe(false)
    expect(isValidRequestId('a'.repeat(200))).toBe(true)
  })

  it('rejects empty and missing', () => {
    expect(isValidRequestId('')).toBe(false)
    expect(isValidRequestId(null)).toBe(false)
    expect(isValidRequestId(undefined)).toBe(false)
  })
})

describe('generateRequestId', () => {
  it('produces ids that pass our own validation', () => {
    for (let i = 0; i < 50; i++) expect(isValidRequestId(generateRequestId())).toBe(true)
  })

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 500 }, generateRequestId))
    expect(ids.size).toBe(500)
  })
})

describe('resolveRequestId', () => {
  it('adopts a usable inbound id so a caller-side trace stays joined to ours', () => {
    const inbound = '0f3d5a4c-1c2b-4a7e-9f10-8b6d2e5a1c99'
    expect(resolveRequestId(inbound)).toEqual({ id: inbound, inherited: true })
  })

  it('mints one when nothing usable arrived', () => {
    for (const inbound of [null, undefined, '', 'nope', 'bad\nvalue']) {
      const resolved = resolveRequestId(inbound)
      expect(resolved.inherited).toBe(false)
      expect(isValidRequestId(resolved.id)).toBe(true)
    }
  })
})

describe('withCorrelationHeaders', () => {
  it('always stamps the internal correlation header, so a handler always finds one', () => {
    const out = withCorrelationHeaders(new Headers(), resolveRequestId(null))
    expect(isValidRequestId(out.get(CORRELATION_ID_HEADER))).toBe(true)
  })

  it('overwrites a spoofed correlation header — clients do not get to pick it', () => {
    const source = new Headers({ [CORRELATION_ID_HEADER]: 'attacker-supplied-value' })
    const resolved = resolveRequestId(null)
    const out = withCorrelationHeaders(source, resolved)
    expect(out.get(CORRELATION_ID_HEADER)).toBe(resolved.id)
  })

  it('adds x-request-id when the caller sent none', () => {
    const resolved = resolveRequestId(null)
    const out = withCorrelationHeaders(new Headers(), resolved)
    expect(out.get(REQUEST_ID_HEADER)).toBe(resolved.id)
  })

  it('leaves the rest of the request headers alone', () => {
    const source = new Headers({ 'content-type': 'application/json', host: 'automaticialab.com' })
    const out = withCorrelationHeaders(source, resolveRequestId(null))
    expect(out.get('content-type')).toBe('application/json')
    expect(out.get('host')).toBe('automaticialab.com')
  })

  /**
   * THE invariant.
   *
   * `verifyMPSignature` in app/api/mp/webhook/route.ts builds the signed
   * manifest as `id:{data.id};request-id:{x-request-id};ts:{ts};`. If middleware
   * replaced that header, the HMAC would never match, every MercadoPago
   * notification would be answered 403, and paying customers would go
   * unprovisioned with nothing in the logs that looks like an error — the exact
   * failure instrumentation.ts refuses to boot over.
   *
   * So: an inbound x-request-id is never rewritten. Not when it is a uuid, and
   * not even when it fails our own validation.
   */
  it('NEVER rewrites an inbound x-request-id (MercadoPago signs over it)', () => {
    const mpRequestId = '0f3d5a4c-1c2b-4a7e-9f10-8b6d2e5a1c99'
    const source = new Headers({ [REQUEST_ID_HEADER]: mpRequestId })
    const out = withCorrelationHeaders(source, resolveRequestId(mpRequestId))
    expect(out.get(REQUEST_ID_HEADER)).toBe(mpRequestId)
  })

  it('does not rewrite an inbound x-request-id we consider malformed either', () => {
    const odd = 'x1'
    const source = new Headers({ [REQUEST_ID_HEADER]: odd })
    const resolved = resolveRequestId(odd)
    const out = withCorrelationHeaders(source, resolved)
    expect(resolved.inherited).toBe(false)
    expect(out.get(REQUEST_ID_HEADER)).toBe(odd)
    // The handler and the response still agree, via the internal header.
    expect(out.get(CORRELATION_ID_HEADER)).toBe(resolved.id)
  })
})
