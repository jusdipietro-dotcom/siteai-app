import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import {
  ADMIN_PRODUCTS,
  clampSubscriptionsLimit,
  isAdminProductId,
  type AdminProductId,
  type AdminSubscriptionsResponse,
} from '@/lib/admin-products'
import { countByProduct, fetchProductRows } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/subscriptions — every product, not three of them.
 *
 * This route used to run three unbounded `findMany({ include: ... })` calls
 * against monitoring, reviews and LinkedIn. Two problems, both fixed here:
 *
 *   THE OTHER TEN WERE INVISIBLE. Trading, leads, email marketing, prospección,
 *   facturación, causas, turnos, suite jurídica, LexPost and the website
 *   generator had paying customers and no way for the admin to see them.
 *
 *   `include` RETURNS EVERY COLUMN. It shipped every payer email and every
 *   notification email to the browser, and was one added product away from
 *   shipping CausasSubscription's encrypted MEV credentials — the four columns
 *   it stripped by hand were monitoring's, and nobody else's. Every read is now
 *   an explicit `select` (lib/admin-queries.ts), so a column can only leave the
 *   server if somebody typed it in.
 *
 * BOUNDS. Thirteen `findMany` with `include` would not scale, so the shape is:
 * thirteen `count` aggregates for the tab counters, and ONE page of rows for
 * ONE product per request — cursor-paginated, capped at
 * ADMIN_SUBSCRIPTIONS_MAX_LIMIT rows.
 *
 * Measured against Postgres with log_statement='all': 16 statements per
 * request — 1 admin session check, 13 counts, 1 page of rows, 1 batched read of
 * the owners for that whole page (plus 1 more when any row carries a coupon).
 * Constant in the number of products and constant in the page size: fifty rows
 * cost one owner query, not fifty.
 *
 * Query params:
 *   product — one of ADMIN_PRODUCT_IDS. Defaults to the first.
 *   limit   — page size, clamped to [1, 100]. Defaults to 50.
 *   cursor  — id of the last row from the previous page.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const requested = searchParams.get('product')
  // Unknown ids fall back rather than 400: the tab list is ours, so a bad value
  // is a stale bookmark, not an attack, and an empty panel is a worse answer.
  const product: AdminProductId = isAdminProductId(requested) ? requested : ADMIN_PRODUCTS[0].id
  const limit = clampSubscriptionsLimit(searchParams.get('limit'))
  const cursor = searchParams.get('cursor')

  const [counts, rows] = await Promise.all([
    countByProduct(),
    fetchProductRows(product, limit, cursor),
  ])

  const body: AdminSubscriptionsResponse = {
    counts,
    product,
    rows,
    total: counts[product],
    limit,
    // A full page means there MAY be more; a short page means there is not.
    nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
  }

  return NextResponse.json(body)
}
