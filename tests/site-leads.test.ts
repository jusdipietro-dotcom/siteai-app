import { describe, it, expect } from 'vitest'

import {
  SITE_LEAD_STATUSES,
  SITE_LEADS_PAGE_SIZE,
  clampLeadsPage,
  isSiteLeadStatus,
  leadsPageCount,
} from '@/lib/site-leads'

/**
 * The lead inbox reads third-party personal data, so the two things worth
 * pinning here are the two that decide how much of it moves: the status guard
 * (what a client may write) and the page clamp (how many rows a client may ask
 * for in one request). Ownership itself is enforced in the route handlers by the
 * same `findFirst({ id, userId })` shape the rest of app/api/projects uses.
 */

describe('isSiteLeadStatus', () => {
  it.each(SITE_LEAD_STATUSES)('accepts the schema status %s', (status) => {
    expect(isSiteLeadStatus(status)).toBe(true)
  })

  it('keeps the list and the documented schema values in sync', () => {
    // prisma/schema.prisma comments these exact three on SiteLead.status.
    expect([...SITE_LEAD_STATUSES]).toEqual(['new', 'read', 'archived'])
  })

  it.each([
    ['an unknown status', 'spam'],
    ['a near-miss with different case', 'NEW'],
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['a number', 1],
    ['an object', { status: 'new' }],
  ])('rejects %s', (_label, value) => {
    expect(isSiteLeadStatus(value)).toBe(false)
  })

  it('rejects inherited Object.prototype keys', () => {
    // The reason this checks a list instead of indexing a lookup object: a plain
    // object resolves these through the prototype and returns a truthy function.
    expect(isSiteLeadStatus('toString')).toBe(false)
    expect(isSiteLeadStatus('constructor')).toBe(false)
    expect(isSiteLeadStatus('hasOwnProperty')).toBe(false)
  })
})

describe('clampLeadsPage — bounds the query', () => {
  const pageSize = SITE_LEADS_PAGE_SIZE

  it('returns 0 when there are no leads at all', () => {
    expect(clampLeadsPage('7', 0)).toBe(0)
  })

  it('allows a page that exists', () => {
    // 3 full pages of rows -> pages 0,1,2 are real.
    expect(clampLeadsPage('2', pageSize * 3)).toBe(2)
  })

  it('clamps past-the-end requests to the last page holding data', () => {
    expect(clampLeadsPage('99999999', pageSize * 3)).toBe(2)
  })

  it('never lets skip exceed the row count', () => {
    const total = pageSize * 3 + 1 // 4 pages, last one holding a single row
    const page = clampLeadsPage(Number.MAX_SAFE_INTEGER, total)
    expect(page * pageSize).toBeLessThan(total)
  })

  it.each([
    ['a negative page', '-5'],
    ['a non-numeric string', 'DROP TABLE'],
    ['an empty string', ''],
    ['null (absent query param)', null],
    ['undefined', undefined],
    ['an array', ['2']],
    ['an object', {}],
  ])('falls back to page 0 for %s', (_label, raw) => {
    expect(clampLeadsPage(raw, pageSize * 3)).toBe(0)
  })

  it('rejects non-finite input rather than producing a non-finite skip', () => {
    // Non-finite falls back to page 0 (the `!Number.isFinite` branch) instead of
    // clamping to the last page. Either is bounded; 0 is chosen because a
    // request that is not a number is not a request for the last page.
    expect(clampLeadsPage('Infinity', pageSize * 3)).toBe(0)
    expect(clampLeadsPage('1e400', pageSize * 3)).toBe(0)
    expect(clampLeadsPage(Number.NaN, pageSize * 3)).toBe(0)
    for (const raw of ['Infinity', '1e400', Number.NaN, Number.MAX_SAFE_INTEGER]) {
      expect(Number.isSafeInteger(clampLeadsPage(raw, pageSize * 3))).toBe(true)
    }
  })

  it('floors a fractional page so skip stays an integer', () => {
    expect(clampLeadsPage('1.9', pageSize * 3)).toBe(1)
  })
})

describe('leadsPageCount', () => {
  it('reports one page when the inbox is empty, so the UI can render "1 / 1"', () => {
    expect(leadsPageCount(0)).toBe(1)
  })

  it('does not open a second page for an exactly-full first page', () => {
    expect(leadsPageCount(SITE_LEADS_PAGE_SIZE)).toBe(1)
    expect(leadsPageCount(SITE_LEADS_PAGE_SIZE + 1)).toBe(2)
  })

  it('agrees with clampLeadsPage about which page is last', () => {
    for (const total of [1, 24, 25, 26, 51, 200]) {
      expect(clampLeadsPage(Number.MAX_SAFE_INTEGER, total)).toBe(leadsPageCount(total) - 1)
    }
  })
})
