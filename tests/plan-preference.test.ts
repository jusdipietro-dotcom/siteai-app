import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import {
  PLAN_PREFERENCE_STORAGE_KEY,
  clearWebsitePlanPreference,
  readWebsitePlanPreference,
  rememberWebsitePlanPreference,
  takeWebsitePlanPreference,
} from '@/lib/plan-preference'
import { WEBSITE_PLAN_IDS, getWebsitePlanConfig } from '@/lib/website-plans'

/**
 * The plan preselection is the one value that travels from the public pricing
 * page into checkout without passing through the database, so the invariant
 * under test is narrow and important: ONLY a real plan id ever comes back out.
 * Anything else — junk, a hostile string, a value edited into sessionStorage
 * after the fact — must resolve to `null`, which the UI reads as "no
 * preselection". It must never throw, because a preselection failing is not a
 * reason for a checkout page to fail.
 *
 * The environment is `node` (see vitest.config.ts), so `window` is stubbed with
 * a minimal in-memory Storage rather than pulling in jsdom for four methods.
 */

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size
    },
    /** test-only handle */
    _map: map,
  }
}

let store: ReturnType<typeof makeStorage>

beforeEach(() => {
  store = makeStorage()
  vi.stubGlobal('window', { sessionStorage: store })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('rememberWebsitePlanPreference — validates on the way IN', () => {
  it.each(WEBSITE_PLAN_IDS)('stores the real plan id %s', (planId) => {
    expect(rememberWebsitePlanPreference(planId)).toBe(planId)
    expect(store.getItem(PLAN_PREFERENCE_STORAGE_KEY)).toBe(planId)
  })

  it.each([
    ['an unknown plan', 'enterprise'],
    ['the free tier, which is not a paid plan id', 'free'],
    ['a script-looking value', '<script>alert(1)</script>'],
    ['a prototype key', 'toString'],
    ['an empty string', ''],
    ['null (absent ?plan= param)', null],
    ['undefined', undefined],
    ['a number', 1],
    ['an object', { id: 'professional' }],
  ])('refuses to store %s and reports no preselection', (_label, value) => {
    expect(rememberWebsitePlanPreference(value)).toBeNull()
    expect(store.getItem(PLAN_PREFERENCE_STORAGE_KEY)).toBeNull()
  })

  it('CLEARS a stale preference when the new value is junk', () => {
    rememberWebsitePlanPreference('professional')
    // Arriving again with a hostile/unknown param means "no plan chosen on this
    // trip" — keeping the old one would preselect something never picked.
    expect(rememberWebsitePlanPreference('enterprise')).toBeNull()
    expect(store.getItem(PLAN_PREFERENCE_STORAGE_KEY)).toBeNull()
    expect(readWebsitePlanPreference()).toBeNull()
  })
})

describe('readWebsitePlanPreference — validates on the way OUT', () => {
  it('returns a stored real plan', () => {
    rememberWebsitePlanPreference('professional')
    expect(readWebsitePlanPreference()).toBe('professional')
  })

  it('returns null when nothing was ever stored', () => {
    expect(readWebsitePlanPreference()).toBeNull()
  })

  it('rejects a value tampered with directly in sessionStorage', () => {
    // sessionStorage is client-writable: DevTools can put anything here between
    // the write and the read, so the guard must run on both sides.
    store.setItem(PLAN_PREFERENCE_STORAGE_KEY, 'enterprise')
    expect(readWebsitePlanPreference()).toBeNull()

    store.setItem(PLAN_PREFERENCE_STORAGE_KEY, '{"id":"professional"}')
    expect(readWebsitePlanPreference()).toBeNull()

    store.setItem(PLAN_PREFERENCE_STORAGE_KEY, 'toString')
    expect(readWebsitePlanPreference()).toBeNull()
  })
})

describe('takeWebsitePlanPreference — consumes once', () => {
  it('returns the preference and removes it', () => {
    rememberWebsitePlanPreference('professional')
    expect(takeWebsitePlanPreference()).toBe('professional')
    // A reload must not re-apply it and silently undo a change the customer made.
    expect(takeWebsitePlanPreference()).toBeNull()
    expect(store.getItem(PLAN_PREFERENCE_STORAGE_KEY)).toBeNull()
  })

  it('leaves nothing behind when the stored value was junk', () => {
    store.setItem(PLAN_PREFERENCE_STORAGE_KEY, 'enterprise')
    expect(takeWebsitePlanPreference()).toBeNull()
  })
})

describe('never throws when storage is unavailable', () => {
  it('is inert during server rendering (no window)', () => {
    vi.stubGlobal('window', undefined)
    expect(rememberWebsitePlanPreference('professional')).toBeNull()
    expect(readWebsitePlanPreference()).toBeNull()
    expect(takeWebsitePlanPreference()).toBeNull()
    expect(() => clearWebsitePlanPreference()).not.toThrow()
  })

  it('survives a browser that throws on storage access', () => {
    // Safari in Lockdown/private mode and blocked-site-data settings do this.
    vi.stubGlobal('window', {
      get sessionStorage(): Storage {
        throw new DOMException('The operation is insecure.')
      },
    })
    expect(rememberWebsitePlanPreference('professional')).toBeNull()
    expect(readWebsitePlanPreference()).toBeNull()
    expect(() => clearWebsitePlanPreference()).not.toThrow()
  })

  it('survives a storage that throws on setItem (quota exceeded)', () => {
    vi.stubGlobal('window', {
      sessionStorage: {
        ...makeStorage(),
        setItem: () => {
          throw new DOMException('QuotaExceededError')
        },
      },
    })
    expect(rememberWebsitePlanPreference('professional')).toBeNull()
  })
})

describe('price authority stays server-side', () => {
  it('exposes no price, only an id', () => {
    rememberWebsitePlanPreference('professional')
    const stored = store.getItem(PLAN_PREFERENCE_STORAGE_KEY)
    // The whole payload is an identifier. There is no amount to tamper with,
    // and checkout posts only this id — the charge is derived from
    // lib/website-plans.ts inside /api/mp/create-subscription.
    expect(stored).toBe('professional')
    expect(stored).not.toMatch(/\d/)
  })

  it('resolves to the same config the server prices from', () => {
    rememberWebsitePlanPreference('professional')
    const preference = readWebsitePlanPreference()
    expect(getWebsitePlanConfig(preference)?.monthly).toBe(
      getWebsitePlanConfig('professional')?.monthly
    )
  })
})
