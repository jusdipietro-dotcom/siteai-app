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

import {
  CAUSAS_PLAN_IDS,
  CAUSAS_PLANS,
  getCausasPlanConfig,
  isCausasPlanId,
} from '@/lib/causas-plans'
import {
  TURNOS_PLAN_IDS,
  TURNOS_PLANS,
  getTurnosPlanConfig,
  isTurnosPlanId,
} from '@/lib/turnos-plans'
import {
  WEBSITE_PLAN_IDS,
  WEBSITE_PLANS,
  getWebsitePlanConfig,
  isWebsitePlanId,
} from '@/lib/website-plans'
import {
  SUITE_JURIDICA_PLAN_IDS,
  SUITE_JURIDICA_PLANS,
  getSuiteJuridicaPlanConfig,
  isSuiteJuridicaPlanId,
} from '@/lib/suite-juridica-plans'
import {
  FACTURACION_PLAN_IDS,
  FACTURACION_PLANS,
  getFacturacionPlanConfig,
  isFacturacionPlanId,
} from '@/lib/facturacion-plans'
import {
  LEXPOST_PLAN_IDS,
  LEXPOST_PLANS,
  getLexpostPlan,
  isLexpostPlanId,
} from '@/lib/lexpost-plans'
import {
  PROSPECCION_PLAN_IDS,
  PROSPECCION_PLANS,
  getPlanConfig as getProspeccionPlanConfig,
  isProspeccionPlanId,
} from '@/lib/prospeccion-plans'
import {
  EMAIL_MARKETING_PLAN_IDS,
  EMAIL_MARKETING_PLANS,
  getPlanConfig as getEmailMarketingPlanConfig,
  isEmailMarketingPlanId,
} from '@/lib/email-marketing-plans'

/**
 * Plan-id lookup guards.
 *
 * A plan config object is indexed by an untrusted string straight off a request
 * body. Because a plain object inherits from Object.prototype, a raw
 * `PLANS[planId]` returns a truthy FUNCTION for keys like "toString" — which
 * sails past a `if (!planConfig) return 400` check and then yields
 * `planConfig.monthly === undefined`, i.e. a NaN price.
 *
 * Every module below validates the id against an explicit id list first, so the
 * raw indexing is never reached with an unvalidated key.
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

/**
 * Strings that must never resolve to a plan. Filtered per module against that
 * module's real ids, because one module's junk is another's real id — e.g.
 * `enterprise` is a genuine prospeccion plan.
 */
const UNKNOWN_ID_CANDIDATES = [
  '',
  'free',
  'gratis',
  'BASICO',
  'basico ',
  ' basico',
  'enterprise',
  'definitely-not-a-plan',
]

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
  {
    name: 'causas',
    ids: CAUSAS_PLAN_IDS,
    plans: CAUSAS_PLANS,
    isId: isCausasPlanId,
    get: getCausasPlanConfig,
  },
  {
    name: 'turnos',
    ids: TURNOS_PLAN_IDS,
    plans: TURNOS_PLANS,
    isId: isTurnosPlanId,
    get: getTurnosPlanConfig,
  },
  {
    name: 'website',
    ids: WEBSITE_PLAN_IDS,
    plans: WEBSITE_PLANS,
    isId: isWebsitePlanId,
    get: getWebsitePlanConfig,
  },
  {
    name: 'suite-juridica',
    ids: SUITE_JURIDICA_PLAN_IDS,
    plans: SUITE_JURIDICA_PLANS,
    isId: isSuiteJuridicaPlanId,
    get: getSuiteJuridicaPlanConfig,
  },
  {
    name: 'prospeccion',
    ids: PROSPECCION_PLAN_IDS,
    plans: PROSPECCION_PLANS,
    isId: isProspeccionPlanId,
    get: getProspeccionPlanConfig,
  },
  {
    name: 'lexpost',
    ids: LEXPOST_PLAN_IDS,
    plans: LEXPOST_PLANS,
    isId: isLexpostPlanId,
    get: getLexpostPlan,
  },
  {
    name: 'facturacion',
    ids: FACTURACION_PLAN_IDS,
    plans: FACTURACION_PLANS,
    isId: isFacturacionPlanId,
    get: getFacturacionPlanConfig,
  },
  {
    name: 'email-marketing',
    ids: EMAIL_MARKETING_PLAN_IDS,
    plans: EMAIL_MARKETING_PLANS,
    isId: isEmailMarketingPlanId,
    get: getEmailMarketingPlanConfig,
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
    const real = ids as readonly string[]
    const unknownIds = UNKNOWN_ID_CANDIDATES.filter((candidate) => !real.includes(candidate))
    // Guard the guard: a filter that removed everything would assert nothing.
    expect(unknownIds.length).toBeGreaterThan(0)
    for (const bad of unknownIds) {
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

  /**
   * The NaN-price path this module used to reach. Kept as an explicit assertion
   * that it can no longer happen, not just that the lookup returns undefined:
   * the expression below is the one the MercadoPago routes evaluate.
   */
  it('can no longer produce a NaN price from a prototype key', () => {
    for (const key of PROTOTYPE_KEYS) {
      const leaked = get(key) as unknown as { monthly?: number } | undefined
      // Previously a truthy function, so `if (!planConfig) return 400` passed.
      expect(leaked).toBeUndefined()
      // The route never gets to the pricing math, so no NaN reaches checkout.
      expect(leaked?.monthly).toBeUndefined()
    }

    for (const id of ids) {
      const monthly = (get(id) as { monthly: number }).monthly
      const finalPrice = Math.round(monthly * (1 - 0 / 100))
      expect(finalPrice).not.toBeNaN()
      // NaN <= 0 is false, which is why a NaN price used to skip the
      // free-provisioning short-circuit instead of being caught by it.
      expect(finalPrice).toBeGreaterThan(0)
    }
  })
})
