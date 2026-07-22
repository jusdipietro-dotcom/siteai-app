/**
 * Carries the plan the visitor picked on the public pricing page across
 * registration and the wizard, so checkout can preselect it.
 *
 * WHAT THIS IS, AND WHAT IT IS EMPHATICALLY NOT
 * ---------------------------------------------
 * This is a UI PREFERENCE. It decides which card starts selected on the
 * checkout screen and nothing else. It is NEVER an authority on price.
 * `POST /api/mp/create-subscription` derives the charged amount from
 * `getWebsitePlanConfig(plan)` in `lib/website-plans.ts`, server-side, on every
 * request — so the worst a tampered value here can do is preselect a different
 * card, which the customer can see and change. It cannot change what is
 * charged. If you are ever tempted to read a price out of this module, that is
 * the bug.
 *
 * WHY sessionStorage AND NOT THE DATABASE
 * ---------------------------------------
 * It is a per-tab intent that should die with the tab: someone who opens
 * pricing, picks Professional, and abandons should not have "Professional"
 * follow their account around forever. The wizard already persists exactly this
 * way (`store/useWizardStore.ts`), so the storage lifetime is one the codebase
 * already reasons about. It deliberately gets no schema field — a preselection
 * is not a fact about the user worth a migration.
 *
 * VALIDATION HAPPENS ON BOTH SIDES OF THE STORAGE
 * -----------------------------------------------
 * On write, because the value comes from a query string. On read, because
 * sessionStorage is client-writable and the value may have been edited in
 * DevTools between the two. Both go through `isWebsitePlanId`, so an unknown or
 * hostile value resolves to `null` — no preselection, no error, and no raw
 * string reaching a caller.
 */

import { isWebsitePlanId, type WebsitePlanId } from './website-plans'

/** Namespaced to avoid colliding with the wizard's own `wizard-draft` key. */
export const PLAN_PREFERENCE_STORAGE_KEY = 'website-plan-preference'

/**
 * sessionStorage access that cannot throw.
 *
 * It throws for real: Safari in Lockdown/private mode, embedded webviews, and
 * any browser where the user blocked site data. A preselection is a nicety, so
 * losing it must never take a page down with it.
 */
function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Stores the plan the visitor chose, if it is a real plan.
 *
 * An unrecognised value CLEARS any previous preference rather than being
 * ignored: arriving at register with `?plan=<junk>` means the visitor did not
 * choose a plan on this trip, and silently keeping a stale one from an earlier
 * trip would preselect something they never picked.
 *
 * Returns what was stored, so the caller can render a label from the plan
 * config without re-deriving it (and without echoing the raw param).
 */
export function rememberWebsitePlanPreference(value: unknown): WebsitePlanId | null {
  const store = storage()
  if (!store) return null

  if (!isWebsitePlanId(value)) {
    try {
      store.removeItem(PLAN_PREFERENCE_STORAGE_KEY)
    } catch {
      /* nothing to do — a preference we could not clear is still not returned */
    }
    return null
  }

  try {
    store.setItem(PLAN_PREFERENCE_STORAGE_KEY, value)
  } catch {
    // Quota or a blocked store. The preselection is lost; checkout falls back to
    // its default, which is a worse experience and not a broken one.
    return null
  }
  return value
}

/** Reads the stored preference, re-validating it. Unknown/absent/hostile -> null. */
export function readWebsitePlanPreference(): WebsitePlanId | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PLAN_PREFERENCE_STORAGE_KEY)
    return isWebsitePlanId(raw) ? raw : null
  } catch {
    return null
  }
}

export function clearWebsitePlanPreference(): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(PLAN_PREFERENCE_STORAGE_KEY)
  } catch {
    /* best effort */
  }
}

/**
 * Reads the preference and consumes it.
 *
 * Checkout uses this rather than a plain read so the preselection applies once,
 * at the moment the customer first arrives. Without the clear, a customer who
 * deliberately switched to Essential and then reloaded would find Professional
 * selected again — the page silently overruling a choice they just made.
 */
export function takeWebsitePlanPreference(): WebsitePlanId | null {
  const preference = readWebsitePlanPreference()
  if (preference) clearWebsitePlanPreference()
  return preference
}
