import { describe, it, expect } from 'vitest'

import { LEADS_PLAN_IDS, LEADS_PLANS, getLeadsPlan, isLeadsPlanId } from '@/lib/leads-plans'
import {
  LINKEDIN_PLAN_IDS,
  LINKEDIN_PLANS,
  getLinkedInPlan,
  isLinkedInPlanId,
} from '@/lib/linkedin-plans'
import {
  MONITOREO_PLAN_IDS,
  MONITOREO_PLANS,
  getMonitoreoPlan,
  isMonitoreoPlanId,
} from '@/lib/monitoreo-plans'
import {
  RESENAS_PLAN_IDS,
  RESENAS_PLANS,
  getResenasPlan,
  isResenasPlanId,
} from '@/lib/resenas-plans'
import {
  TRADING_PLAN_IDS,
  TRADING_PLANS,
  getTradingPlan,
  isTradingPlanId,
} from '@/lib/trading-plans'

import { getCausasPlanConfig } from '@/lib/causas-plans'
import { getTurnosPlanConfig } from '@/lib/turnos-plans'
import { getWebsitePlanConfig } from '@/lib/website-plans'
import { getSuiteJuridicaPlanConfig } from '@/lib/suite-juridica-plans'
import { getFacturacionPlanConfig } from '@/lib/facturacion-plans'
import { getLexpostPlan } from '@/lib/lexpost-plans'
import { getPlanConfig as getProspeccionPlanConfig } from '@/lib/prospeccion-plans'
import { getPlanConfig as getEmailMarketingPlanConfig } from '@/lib/email-marketing-plans'

/**
 * Plan-id lookup guards.
 *
 * A plan config object is indexed by an untrusted string straight off a request
 * body. Because a plain object inherits from Object.prototype, a raw
 * `PLANS[planId]` returns a truthy FUNCTION for keys like "toString" — which
 * sails past a `if (!planConfig) return 400` check and then yields
 * `planConfig.monthly === undefined`, i.e. a NaN price.
 *
 * The hardened modules validate the id against an explicit id list first.
 */

/** Keys that exist on Object.prototype and are therefore never real plan ids. */
const PROTOTYPE_KEYS = [
  'toString',
  'constructor',
  'valueOf',
  '__proto__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
]

const NON_STRING_INPUTS = [null, undefined, 42, {}, [], true, Symbol('x')]

const hardened = [
  {
    name: 'leads',
    ids: LEADS_PLAN_IDS,
    plans: LEADS_PLANS,
    isId: isLeadsPlanId,
    get: getLeadsPlan,
  },
  {
    name: 'linkedin',
    ids: LINKEDIN_PLAN_IDS,
    plans: LINKEDIN_PLANS,
    isId: isLinkedInPlanId,
    get: getLinkedInPlan,
  },
  {
    name: 'monitoreo',
    ids: MONITOREO_PLAN_IDS,
    plans: MONITOREO_PLANS,
    isId: isMonitoreoPlanId,
    get: getMonitoreoPlan,
  },
  {
    name: 'resenas',
    ids: RESENAS_PLAN_IDS,
    plans: RESENAS_PLANS,
    isId: isResenasPlanId,
    get: getResenasPlan,
  },
  {
    name: 'trading',
    ids: TRADING_PLAN_IDS,
    plans: TRADING_PLANS,
    isId: isTradingPlanId,
    get: getTradingPlan,
  },
] as const

describe.each(hardened)('$name plan guard (hardened)', ({ ids, plans, isId, get }) => {
  it('resolves every real plan id', () => {
    for (const id of ids) {
      expect(isId(id)).toBe(true)
      const plan = get(id)
      expect(plan).toBeDefined()
      expect(plan).toBe((plans as Record<string, unknown>)[id])
    }
  })

  it('every real plan has a finite, positive monthly price', () => {
    for (const id of ids) {
      const monthly = (get(id) as { monthly: number }).monthly
      expect(Number.isFinite(monthly)).toBe(true)
      expect(monthly).toBeGreaterThan(0)
    }
  })

  it('every real plan id round-trips to a config carrying that same id', () => {
    for (const id of ids) {
      expect((get(id) as { id: string }).id).toBe(id)
    }
  })

  /**
   * The hole that was live in production and created subscriptions with NaN
   * prices.
   */
  it.each(PROTOTYPE_KEYS)('rejects the prototype key %j', (key) => {
    expect(isId(key)).toBe(false)
    expect(get(key)).toBeUndefined()
  })

  it('rejects unknown ids', () => {
    for (const bad of ['', 'free', 'gratis', 'BASICO', 'basico ', ' basico', 'enterprise']) {
      expect(isId(bad)).toBe(false)
      expect(get(bad)).toBeUndefined()
    }
  })

  it('rejects non-string input without throwing', () => {
    for (const bad of NON_STRING_INPUTS) {
      expect(() => get(bad)).not.toThrow()
      expect(isId(bad)).toBe(false)
      expect(get(bad)).toBeUndefined()
    }
  })

  it('never returns a function — a function is the signature of a prototype hit', () => {
    for (const key of [...PROTOTYPE_KEYS, ...ids, 'nope']) {
      expect(typeof get(key)).not.toBe('function')
    }
  })
})

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KNOWN VULNERABILITY — characterisation tests, NOT an endorsement.
 *
 * These eight modules were NOT hardened. They still do `PLANS[planId as PlanId]`
 * with no id validation, so a prototype key returns a truthy value and passes
 * the `if (!planConfig) return 400` guard in the routes that call them.
 *
 * Reachable today, e.g.:
 *   POST /api/email-marketing/subscribe   {"plan":"toString"}  -> 201, row stored
 *   POST /api/mp/create-email-marketing-subscription
 *     -> finalPrice = Math.round(undefined * ...) = NaN, and `NaN <= 0` is false,
 *        so it does not even take the free-provisioning branch.
 *
 * The tests below assert CURRENT (broken) behaviour so the gap is visible and
 * tracked rather than silently forgotten. When a module is hardened, its case
 * here SHOULD go red — move it into the `hardened` table above at that point.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const unhardened = [
  { name: 'causas', get: getCausasPlanConfig, realId: 'basico' },
  { name: 'turnos', get: getTurnosPlanConfig, realId: 'basico' },
  { name: 'website', get: getWebsitePlanConfig, realId: 'essential' },
  { name: 'suite-juridica', get: getSuiteJuridicaPlanConfig, realId: 'abogado' },
  { name: 'facturacion', get: getFacturacionPlanConfig, realId: 'basico' },
  { name: 'lexpost', get: getLexpostPlan, realId: 'basico' },
  { name: 'prospeccion', get: getProspeccionPlanConfig, realId: 'starter' },
  { name: 'email-marketing', get: getEmailMarketingPlanConfig, realId: 'basico' },
] as const

describe.each(unhardened)('$name plan lookup', ({ get, realId }) => {
  it('resolves its real plan id', () => {
    const plan = get(realId) as { id: string; monthly: number } | undefined
    expect(plan).toBeDefined()
    expect(plan!.id).toBe(realId)
    expect(Number.isFinite(plan!.monthly)).toBe(true)
    expect(plan!.monthly).toBeGreaterThan(0)
  })

  it('correctly rejects an ordinary unknown id', () => {
    expect(get('definitely-not-a-plan')).toBeUndefined()
    expect(get('')).toBeUndefined()
  })

  it('KNOWN VULNERABILITY: a prototype key is accepted as a plan', () => {
    // Documents the live hole. Should start failing once the module is hardened.
    const leaked = get('toString')
    expect(leaked).toBeDefined()
    expect(typeof leaked).toBe('function')
  })

  it('KNOWN VULNERABILITY: the leaked value produces a NaN price', () => {
    const leaked = get('toString') as unknown as { monthly?: number }
    expect(leaked.monthly).toBeUndefined()
    // This is the exact expression the MercadoPago routes evaluate.
    expect(Math.round((leaked.monthly as number) * (1 - 0 / 100))).toBeNaN()
    // ...and NaN <= 0 is false, so the "free plan" short-circuit does not catch it.
    expect(Number.isNaN(NaN) && (NaN as number) <= 0).toBe(false)
  })
})
