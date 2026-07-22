import { describe, it, expect } from 'vitest'

import {
  ADMIN_PRODUCTS,
  ADMIN_PRODUCT_IDS,
  ADMIN_SUBSCRIPTIONS_MAX_LIMIT,
  ADMIN_SUBSCRIPTIONS_PAGE_SIZE,
  clampSubscriptionsLimit,
  getAdminProduct,
  isAdminProductId,
} from '@/lib/admin-products'
import { SUBSCRIPTION_PURGE_SPECS } from '@/lib/account-deletion'

/**
 * The admin panel was blind to ten of thirteen products because the list of
 * products lived as three hand-written branches instead of as data. These tests
 * pin the two things that stop that happening again: the catalogue is complete,
 * and it agrees with the OTHER place in the codebase that enumerates the same
 * products (the deletion purge plan). A fourteenth product added to one list and
 * not the other fails here rather than silently disappearing from the panel.
 */

describe('the catalogue covers all thirteen products', () => {
  it('has thirteen entries', () => {
    expect(ADMIN_PRODUCT_IDS).toHaveLength(13)
    expect(ADMIN_PRODUCTS).toHaveLength(13)
  })

  it('has no duplicate ids', () => {
    expect(new Set(ADMIN_PRODUCT_IDS).size).toBe(ADMIN_PRODUCT_IDS.length)
  })

  it('has no duplicate Prisma delegates', () => {
    const delegates = ADMIN_PRODUCTS.map((p) => p.delegate)
    expect(new Set(delegates).size).toBe(delegates.length)
  })

  it('keeps ADMIN_PRODUCTS and ADMIN_PRODUCT_IDS in the same order', () => {
    expect(ADMIN_PRODUCTS.map((p) => p.id)).toEqual([...ADMIN_PRODUCT_IDS])
  })

  it('gives every product a non-empty label', () => {
    for (const p of ADMIN_PRODUCTS) expect(p.label.trim().length).toBeGreaterThan(0)
  })
})

describe('the catalogue agrees with the deletion purge plan', () => {
  // Both lists enumerate the same commercial relationships from opposite ends:
  // one to show them, one to erase them. They must not drift.
  const purgeDelegates = SUBSCRIPTION_PURGE_SPECS.map((s) => s.delegate).sort()
  const panelSubscriptionDelegates = ADMIN_PRODUCTS
    .map((p) => p.delegate)
    .filter((d) => d !== 'project')
    .sort()

  it('covers exactly the twelve subscription models the purge plan knows about', () => {
    expect(panelSubscriptionDelegates).toEqual(purgeDelegates)
    expect(purgeDelegates).toHaveLength(12)
  })

  it('adds the website generator as the thirteenth', () => {
    // Project is a product but not a *Subscription model: a 100% coupon marks it
    // paid directly, with no MercadoPago preapproval. See the Coupon model.
    expect(ADMIN_PRODUCTS.map((p) => p.delegate)).toContain('project')
  })

  it('flags storesCredentials for exactly the models whose purge destroys credentials', () => {
    // The purge blanks a credential column precisely on the models that hold
    // one, so that list is the authority on which products the panel must strip.
    const withCredentials = SUBSCRIPTION_PURGE_SPECS.filter((s) =>
      (s.blank ?? []).some((c) => /^(credential|mev)/i.test(c))
    ).map((s) => s.delegate).sort()

    const flagged = ADMIN_PRODUCTS.filter((p) => p.storesCredentials).map((p) => p.delegate).sort()

    expect(flagged).toEqual(withCredentials)
    expect(flagged).toEqual(['causasSubscription', 'monitoringSubscription'])
  })
})

describe('isAdminProductId', () => {
  it.each(ADMIN_PRODUCT_IDS)('accepts the known id %s', (id) => {
    expect(isAdminProductId(id)).toBe(true)
  })

  it.each([
    ['an unknown product', 'seo'],
    ['a near miss in case', 'Monitoreo'],
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['a number', 1],
    ['an object', { id: 'monitoreo' }],
    ['an array', ['monitoreo']],
  ])('rejects %s', (_label, value) => {
    expect(isAdminProductId(value)).toBe(false)
  })

  it('rejects inherited Object.prototype keys', () => {
    // Why the implementation checks a list instead of indexing a lookup object:
    // a plain object resolves these through the prototype and returns a truthy
    // function, which would slip past an `if (!found)` guard and reach Prisma.
    expect(isAdminProductId('toString')).toBe(false)
    expect(isAdminProductId('constructor')).toBe(false)
    expect(isAdminProductId('hasOwnProperty')).toBe(false)
  })
})

describe('getAdminProduct', () => {
  it('resolves a known id to its metadata', () => {
    expect(getAdminProduct('causas')?.delegate).toBe('causasSubscription')
    expect(getAdminProduct('causas')?.storesCredentials).toBe(true)
  })

  it('returns undefined for anything else, including prototype keys', () => {
    expect(getAdminProduct('nope')).toBeUndefined()
    expect(getAdminProduct('toString')).toBeUndefined()
    expect(getAdminProduct(undefined)).toBeUndefined()
  })
})

describe('clampSubscriptionsLimit — bounds the page size', () => {
  it('accepts a sensible request', () => {
    expect(clampSubscriptionsLimit('25')).toBe(25)
    expect(clampSubscriptionsLimit(10)).toBe(10)
  })

  it('caps at the hard ceiling', () => {
    expect(clampSubscriptionsLimit('1000')).toBe(ADMIN_SUBSCRIPTIONS_MAX_LIMIT)
    expect(clampSubscriptionsLimit(Number.MAX_SAFE_INTEGER)).toBe(ADMIN_SUBSCRIPTIONS_MAX_LIMIT)
  })

  it('falls back to the default for junk, so `take` is never NaN', () => {
    for (const junk of [null, undefined, '', 'abc', NaN, Infinity, {}, ['5']]) {
      expect(clampSubscriptionsLimit(junk)).toBe(ADMIN_SUBSCRIPTIONS_PAGE_SIZE)
    }
  })

  it('rejects zero and negatives rather than passing them to the query', () => {
    expect(clampSubscriptionsLimit('0')).toBe(ADMIN_SUBSCRIPTIONS_PAGE_SIZE)
    expect(clampSubscriptionsLimit('-1')).toBe(ADMIN_SUBSCRIPTIONS_PAGE_SIZE)
    expect(clampSubscriptionsLimit(-Infinity)).toBe(ADMIN_SUBSCRIPTIONS_PAGE_SIZE)
  })

  it('floors fractional requests to a whole number of rows', () => {
    expect(clampSubscriptionsLimit('7.9')).toBe(7)
  })

  it('keeps the default at or below the ceiling', () => {
    expect(ADMIN_SUBSCRIPTIONS_PAGE_SIZE).toBeLessThanOrEqual(ADMIN_SUBSCRIPTIONS_MAX_LIMIT)
  })
})
