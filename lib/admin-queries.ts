/**
 * The database side of the admin panel: the queries the pure modules do not do.
 *
 * `lib/admin-overview.ts` and `lib/admin-products.ts` decide what numbers mean.
 * This module is the only place that talks to Prisma on their behalf, so the
 * thirteen-model enumeration lives once instead of once per call site.
 *
 * BOUNDS ARE THE POINT. Every read here is either an aggregate (`count`,
 * `groupBy`) or an explicitly capped `findMany` with a narrow `select`. Nothing
 * loads rows it only intends to count, and nothing loads a column the panel
 * does not render.
 *
 * On N+1: the nested `user`/`coupon` selects below do NOT issue a query per
 * row. Prisma resolves each relation with one additional query for the whole
 * batch, so a page of 50 rows costs 3 queries (rows, users, coupons), not 101.
 */

import { prisma } from './prisma'
import { effectiveSubscriptionStatus } from './trial'
import { effectiveBillingStatus } from './project-billing'
import { trialExpiryWindow } from './admin-overview'
import type { AdminProductId, AdminSubscriptionRow } from './admin-products'

/* ────────────────────────────────────────────────────────────────────────────
 * Trials expiring soon
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * How many trials fall due in the next seven days, across the twelve
 * subscription products.
 *
 * The website generator is NOT included and cannot be: `Project` has no
 * `trialEndsAt` column and no trial concept — a site is paid or it is not.
 * Twelve `count` aggregates in parallel; no rows are loaded.
 */
export async function countTrialsExpiringSoon(now: Date = new Date()): Promise<number> {
  const { start, end } = trialExpiryWindow(now)
  // Rows literally stored as 'trial' whose deadline has not passed yet. An
  // already-elapsed deadline is an expiry that happened, not one that is coming.
  const where = { status: 'trial', trialEndsAt: { gt: start, lte: end } }

  const counts = await Promise.all([
    prisma.monitoringSubscription.count({ where }),
    prisma.reviewsSubscription.count({ where }),
    prisma.linkedInSubscription.count({ where }),
    prisma.tradingSubscription.count({ where }),
    prisma.leadsSubscription.count({ where }),
    prisma.emailMarketingSubscription.count({ where }),
    prisma.prospeccionSubscription.count({ where }),
    prisma.facturacionSubscription.count({ where }),
    prisma.causasSubscription.count({ where }),
    prisma.turnosSubscription.count({ where }),
    prisma.suiteJuridicaSubscription.count({ where }),
    prisma.lexPostSubscription.count({ where }),
  ])

  return counts.reduce((a, b) => a + b, 0)
}

/* ────────────────────────────────────────────────────────────────────────────
 * Per-product row counts
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Row count for each of the thirteen products. Thirteen `count` aggregates.
 *
 * Every product appears in the result, including the ones at zero: a missing
 * key would make a tab disappear, and "this product has no subscribers" is a
 * fact the owner needs, unlike a zero dressed up as a metric.
 */
export async function countByProduct(): Promise<Record<AdminProductId, number>> {
  const [
    monitoreo, resenas, linkedin, crypto, leads, emailMarketing, prospeccion,
    facturacion, causas, turnos, suiteJuridica, lexpost, sitios,
  ] = await Promise.all([
    prisma.monitoringSubscription.count(),
    prisma.reviewsSubscription.count(),
    prisma.linkedInSubscription.count(),
    prisma.tradingSubscription.count(),
    prisma.leadsSubscription.count(),
    prisma.emailMarketingSubscription.count(),
    prisma.prospeccionSubscription.count(),
    prisma.facturacionSubscription.count(),
    prisma.causasSubscription.count(),
    prisma.turnosSubscription.count(),
    prisma.suiteJuridicaSubscription.count(),
    prisma.lexPostSubscription.count(),
    prisma.project.count(),
  ])

  return {
    monitoreo, resenas, linkedin, crypto, leads,
    'email-marketing': emailMarketing, prospeccion, facturacion, causas, turnos,
    'suite-juridica': suiteJuridica, lexpost, sitios,
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * One product's rows
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The columns every subscription product shares.
 *
 * An explicit allowlist, not `include`. The route this replaced used
 * `include: { user, coupon }`, which returns EVERY scalar column and then
 * deleted four of them by hand — so the encrypted MEV credentials on
 * CausasSubscription, and every payer email on all twelve, would have shipped
 * to the browser the moment a fourth product was added. A select can only leak
 * what somebody typed into it.
 */
const BASE_SELECT = {
  id: true,
  status: true,
  plan: true,
  discountApplied: true,
  trialEndsAt: true,
  provisionedAt: true,
  createdAt: true,
  // Proxy for the cancellation date: the twelve products have no dedicated
  // column, and the last write to a cancelled/suspended row is the one that
  // brought it down. Only surfaced when the row is actually down (see toRow).
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  coupon: { select: { code: true, discount: true } },
} as const

type BaseSelected = {
  id: string
  status: string
  plan: string
  discountApplied: number
  trialEndsAt: Date | null
  provisionedAt: Date | null
  createdAt: Date
  updatedAt: Date
  user: { id: string; name: string | null; email: string }
  coupon: { code: string; discount: number } | null
}

interface RowExtras {
  title?: string | null
  subtitle?: string | null
  metric?: string | null
  hasCredentials?: boolean | null
}

/** Folds a selected subscription row into the shared shape. */
function toRow(product: AdminProductId, r: BaseSelected, extras: RowExtras = {}): AdminSubscriptionRow {
  // Trial expiry is applied here, not trusted from the column: without a
  // scheduler a row can read 'trial' months after its deadline.
  const effective = effectiveSubscriptionStatus({ status: r.status, trialEndsAt: r.trialEndsAt }).status
  const isDown = effective === 'cancelled' || effective === 'suspended'
  return {
    id: r.id,
    product,
    status: effective,
    storedStatus: effective === r.status ? null : r.status,
    plan: r.plan,
    title: extras.title ?? null,
    subtitle: extras.subtitle ?? null,
    metric: extras.metric ?? null,
    discountApplied: r.discountApplied,
    couponCode: r.coupon?.code ?? null,
    couponDiscount: r.coupon?.discount ?? null,
    hasCredentials: extras.hasCredentials ?? null,
    trialEndsAt: r.trialEndsAt?.toISOString() ?? null,
    provisionedAt: r.provisionedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    cancelledAt: isDown ? r.updatedAt.toISOString() : null,
    user: r.user,
  }
}

/** Newest first, cursor-paginated. Shared by all thirteen reads. */
function pageArgs(limit: number, cursor: string | null) {
  return {
    orderBy: { createdAt: 'desc' as const },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  }
}

/**
 * One page of rows for one product.
 *
 * Exactly one `findMany` (plus Prisma's two batched relation reads). The
 * per-product blocks differ only in which extra columns they select and how
 * those become `title`/`subtitle`/`metric` — the shape that leaves the server
 * is identical, and it is built by `toRow` in one place.
 */
export async function fetchProductRows(
  product: AdminProductId,
  limit: number,
  cursor: string | null = null
): Promise<AdminSubscriptionRow[]> {
  const page = pageArgs(limit, cursor)

  switch (product) {
    case 'monitoreo': {
      const rows = await prisma.monitoringSubscription.findMany({
        // credentialUser/Pass/Iv/Tag are the customer's judicial portal login.
        // Not selected at all: `hasCredentials` is derived from a boolean the
        // database computes, so the ciphertext never enters this process.
        select: { ...BASE_SELECT, portal: true, cuil: true, credentialUser: true, n8nTenantId: true },
        ...page,
      })
      return rows.map(({ portal, cuil, credentialUser, n8nTenantId, ...base }) =>
        toRow(product, base, {
          // The CUIL is the subject of the monitoring itself — which identity's
          // cases are watched — so the panel cannot support the product without
          // it. It is the one fiscal identifier kept, and only here.
          title: cuil,
          subtitle: `Portal ${portal}`,
          metric: n8nTenantId ? `tenant ${n8nTenantId}` : null,
          hasCredentials: !!credentialUser,
        })
      )
    }

    case 'resenas': {
      const rows = await prisma.reviewsSubscription.findMany({
        select: { ...BASE_SELECT, businessName: true, businessType: true, responseTone: true },
        ...page,
      })
      return rows.map(({ businessName, businessType, responseTone, ...base }) =>
        toRow(product, base, { title: businessName, subtitle: businessType, metric: `tono ${responseTone}` })
      )
    }

    case 'linkedin': {
      const rows = await prisma.linkedInSubscription.findMany({
        select: { ...BASE_SELECT, linkedinName: true, industry: true, postsGenerated: true, postsPublished: true },
        ...page,
      })
      return rows.map(({ linkedinName, industry, postsGenerated, postsPublished, ...base }) =>
        toRow(product, base, {
          title: linkedinName,
          subtitle: industry,
          metric: `${postsGenerated} generados / ${postsPublished} publicados`,
        })
      )
    }

    case 'crypto': {
      const rows = await prisma.tradingSubscription.findMany({
        select: { ...BASE_SELECT, symbols: true, timeframe: true, signalsSent: true },
        ...page,
      })
      return rows.map(({ symbols, timeframe, signalsSent, ...base }) =>
        toRow(product, base, {
          title: symbols.split(',').slice(0, 3).join(', '),
          subtitle: `timeframe ${timeframe}`,
          metric: `${signalsSent} señales`,
        })
      )
    }

    case 'leads': {
      const rows = await prisma.leadsSubscription.findMany({
        select: { ...BASE_SELECT, captureFrequency: true, leadsGenerated: true, n8nWorkflowId: true },
        ...page,
      })
      return rows.map(({ captureFrequency, leadsGenerated, n8nWorkflowId, ...base }) =>
        toRow(product, base, {
          title: n8nWorkflowId ? `wf ${n8nWorkflowId}` : null,
          subtitle: `cada ${captureFrequency}`,
          metric: `${leadsGenerated} leads`,
        })
      )
    }

    case 'email-marketing': {
      const rows = await prisma.emailMarketingSubscription.findMany({
        select: { ...BASE_SELECT, businessName: true, contactCount: true, contactsUploadedAt: true },
        ...page,
      })
      return rows.map(({ businessName, contactCount, contactsUploadedAt, ...base }) =>
        toRow(product, base, {
          title: businessName,
          subtitle: contactsUploadedAt ? 'contactos cargados' : 'sin contactos',
          metric: `${contactCount} contactos`,
        })
      )
    }

    case 'prospeccion': {
      const rows = await prisma.prospeccionSubscription.findMany({
        select: { ...BASE_SELECT, businessName: true, website: true },
        ...page,
      })
      return rows.map(({ businessName, website, ...base }) =>
        toRow(product, base, { title: businessName, subtitle: website })
      )
    }

    case 'facturacion': {
      const rows = await prisma.facturacionSubscription.findMany({
        // `cuit` is deliberately NOT selected: razonSocial already identifies
        // the firm for the panel's purposes, and a fiscal id nobody reads is a
        // liability with no upside.
        select: { ...BASE_SELECT, razonSocial: true, puntoVenta: true, condicionIva: true, flaskTenantId: true },
        ...page,
      })
      return rows.map(({ razonSocial, puntoVenta, condicionIva, flaskTenantId, ...base }) =>
        toRow(product, base, {
          title: razonSocial,
          subtitle: `${condicionIva} · PV ${puntoVenta}`,
          metric: flaskTenantId ? `tenant ${flaskTenantId}` : null,
        })
      )
    }

    case 'causas': {
      const rows = await prisma.causasSubscription.findMany({
        // mevUser/mevPass/mevIv/mevTag are encrypted MEV credentials, never selected.
        select: { ...BASE_SELECT, mevUser: true, dptoNombre: true, dptoTipo: true, totalCausas: true, lastScrapeAt: true },
        ...page,
      })
      return rows.map(({ mevUser, dptoNombre, dptoTipo, totalCausas, lastScrapeAt, ...base }) =>
        toRow(product, base, {
          title: dptoNombre || `Depto ${dptoTipo}`,
          subtitle: lastScrapeAt ? `último scrape ${lastScrapeAt.toISOString().slice(0, 10)}` : 'sin scrapes',
          metric: `${totalCausas} causas`,
          hasCredentials: !!mevUser,
        })
      )
    }

    case 'turnos': {
      const rows = await prisma.turnosSubscription.findMany({
        select: { ...BASE_SELECT, businessName: true, businessType: true, slug: true, slotDuration: true },
        ...page,
      })
      return rows.map(({ businessName, businessType, slug, slotDuration, ...base }) =>
        toRow(product, base, {
          title: businessName,
          subtitle: `${businessType} · /turnos/${slug}`,
          metric: `turnos de ${slotDuration} min`,
        })
      )
    }

    case 'suite-juridica': {
      const rows = await prisma.suiteJuridicaSubscription.findMany({
        select: {
          ...BASE_SELECT,
          monitoringSubId: true, facturacionSubId: true, causasSubId: true, turnosSubId: true,
        },
        ...page,
      })
      return rows.map(({ monitoringSubId, facturacionSubId, causasSubId, turnosSubId, ...base }) => {
        const wired = [monitoringSubId, facturacionSubId, causasSubId, turnosSubId].filter(Boolean).length
        return toRow(product, base, {
          subtitle: 'Combo de 4 productos',
          metric: `${wired}/4 aprovisionados`,
        })
      })
    }

    case 'lexpost': {
      const rows = await prisma.lexPostSubscription.findMany({
        select: {
          ...BASE_SELECT,
          igUsername: true, igAccountCount: true, publicationsUsed: true, publicationsLimit: true,
        },
        ...page,
      })
      return rows.map(({ igUsername, igAccountCount, publicationsUsed, publicationsLimit, ...base }) =>
        toRow(product, base, {
          title: igUsername ? `@${igUsername}` : null,
          subtitle: `${igAccountCount} cuenta(s) IG`,
          metric: `${publicationsUsed}/${publicationsLimit} publicaciones`,
        })
      )
    }

    case 'sitios': {
      // The website generator bills differently from the twelve: no status
      // string, no trialEndsAt, no provisionedAt. The mapping below is the
      // whole adapter, and every branch of it names a real column.
      const rows = await prisma.project.findMany({
        select: {
          id: true, slug: true, subdomain: true, status: true, plan: true, hasPaid: true,
          billingStatus: true, graceUntil: true, suspendedReason: true, suspendedAt: true,
          grantedBy: true, couponRedeemedAt: true, createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          coupon: { select: { code: true, discount: true } },
        },
        ...page,
      })
      return rows.map((r) => {
        const effective = effectiveBillingStatus(r)
        // 'pending_payment' for a site that never paid is the same vocabulary
        // the twelve use for the same situation, which is what lets one status
        // filter work across all thirteen.
        const status = !r.hasPaid
          ? 'pending_payment'
          : effective === 'suspended' && r.suspendedReason === 'cancelled'
            ? 'cancelled'
            : effective
        const provenance = r.grantedBy ? 'Regalado' : r.couponRedeemedAt ? 'Cupón 100%' : 'Venta'
        return {
          id: r.id,
          product,
          status,
          storedStatus: r.billingStatus === status ? null : r.billingStatus,
          plan: r.plan,
          title: r.subdomain ?? r.slug,
          subtitle: `${provenance} · ${r.status}`,
          metric: null,
          discountApplied: 0,
          couponCode: r.coupon?.code ?? null,
          couponDiscount: r.coupon?.discount ?? null,
          hasCredentials: null,
          trialEndsAt: null,
          provisionedAt: null,
          createdAt: r.createdAt.toISOString(),
          // The generator has a real suspension timestamp, unlike the twelve.
          cancelledAt:
            status === 'cancelled' || status === 'suspended'
              ? (r.suspendedAt?.toISOString() ?? null)
              : null,
          user: r.user,
        } satisfies AdminSubscriptionRow
      })
    }
  }
}

