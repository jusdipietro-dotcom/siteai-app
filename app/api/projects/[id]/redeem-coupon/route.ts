import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWebsitePlanConfig } from '@/lib/website-plans'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Thrown inside the redemption transaction to abort it with a caller-facing
 * status. Anything already written in that transaction is rolled back, which is
 * the whole point: a consumed coupon use must never survive a failed grant.
 */
class RedeemError extends Error {
  constructor(public status: number, message: string, public code: string) {
    super(message)
    this.name = 'RedeemError'
  }
}

/**
 * POST: redeem a free-access coupon on a generated site.
 *
 * ── Scope: 100% discount only ─────────────────────────────────────────────────
 * A partial discount would mean charging a reduced amount through MercadoPago,
 * which requires manipulating the preapproval's `transaction_amount` — not
 * something this product does. Rather than half-apply such a coupon and leave
 * the customer paying full price, anything other than `discount === 100` is
 * rejected with an explicit message.
 *
 * ── A 100% coupon does NOT create a MercadoPago preapproval ───────────────────
 * You cannot open a $0 recurring subscription. So redemption writes the paid
 * state directly, mirroring app/api/admin/projects/[id]/gift: hasPaid, plan,
 * billingStatus 'active', and clearing graceUntil / suspendedAt /
 * suspendedReason. `preapprovalId` stays null, which is exactly what the cancel
 * route already expects from a site with no MP subscription behind it.
 *
 * The provenance columns differ on purpose. A gift writes grantedBy/grantedAt;
 * a redemption writes couponId/couponRedeemedAt. Neither is written by the
 * other, so "who comped this site" stays answerable.
 *
 * ── Which plan does it grant ──────────────────────────────────────────────────
 * The plan the user picked at checkout, sent in the body and re-validated here
 * against lib/website-plans.ts. The client never sends a price: the plan id is
 * only ever a key into the server-side config, same as create-subscription.
 *
 * ── Atomicity ─────────────────────────────────────────────────────────────────
 * See the transaction below. Consuming the use and granting the plan are one
 * unit; either both happen or neither does.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Redemption is a code-guessing surface: a valid code grants a paid plan for
  // free. Same bucket size as the other coupon endpoints.
  const ip = getClientIp(req)
  const rl = checkRateLimit(`coupon-website:${ip}`, { maxRequests: 10, windowSeconds: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá un momento.' }, { status: 429 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { code?: unknown; plan?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const rawCode = typeof body.code === 'string' ? body.code.trim() : ''
  if (!rawCode) {
    return NextResponse.json({ error: 'Ingresá un código' }, { status: 400 })
  }
  const code = rawCode.toUpperCase()

  // Never trust a client-sent plan (or price): the id is only accepted if it
  // resolves in the server-side plan config.
  // getWebsitePlanConfig validates by id-list membership, so a non-string body
  // value and a prototype key such as 'toString' both resolve to undefined.
  const planConfig = getWebsitePlanConfig(body.plan)
  if (!planConfig) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  // Ownership. A project the session user does not own is indistinguishable
  // from one that does not exist — 404 either way, so this endpoint cannot be
  // used to probe for other people's project ids.
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, name: true, slug: true, plan: true, hasPaid: true, couponId: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon) {
    return NextResponse.json({ error: 'Cupón inválido' }, { status: 404 })
  }

  // Idempotency, checked BEFORE every validity rule below, on purpose.
  //
  // Re-sending the same code on a project this same code already paid for is a
  // no-op success: the grant exists and no second use may be consumed. Running
  // the validity checks first made this branch unreachable in the most common
  // case — a maxUses:1 coupon is exhausted the instant it is redeemed, so the
  // retry answered "Cupón agotado" and told the user their own successful
  // redemption had failed. Deactivation and expiry would do the same. A past
  // success must not become an error because the coupon has since changed.
  //
  // The `hasPaid` half matters: if the grant was later revoked from the admin
  // panel the project keeps its couponId (the provenance is historical), and
  // re-redeeming then legitimately costs a fresh use.
  if (project.couponId === coupon.id && project.hasPaid) {
    return NextResponse.json({
      ok: true,
      alreadyRedeemed: true,
      code: coupon.code,
      // The plan actually in force, not the one this request asked for — a
      // replay grants nothing, so echoing the requested plan could describe a
      // state that does not exist.
      plan: project.plan,
    })
  }

  if (!coupon.active) {
    return NextResponse.json({ error: 'Cupón inválido' }, { status: 404 })
  }

  const now = new Date()
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return NextResponse.json({ error: 'Cupón fuera del período de validez' }, { status: 400 })
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
  }
  if (coupon.discount !== 100) {
    return NextResponse.json(
      {
        error:
          'Este cupón no aplica al creador de sitios. Sólo se aceptan cupones de acceso gratuito (100% de descuento).',
        code: 'partial_discount_unsupported',
      },
      { status: 400 }
    )
  }

  // A project that is already paid has nothing left to grant, so a *different*
  // coupon is refused rather than silently burning a use.
  if (project.hasPaid) {
    return NextResponse.json(
      {
        error: 'Este sitio ya tiene un plan activo. No hace falta usar un cupón.',
        code: 'already_paid',
      },
      { status: 409 }
    )
  }

  // Same active-project ceiling the paid path enforces (create-subscription).
  // Without it a free coupon would be a way around the plan's project limit.
  const paidCount = await prisma.project.count({
    where: { userId: session.user.id, hasPaid: true, id: { not: project.id } },
  })
  if (paidCount >= planConfig.maxProjects) {
    return NextResponse.json(
      {
        error: `Tu plan permite hasta ${planConfig.maxProjects} proyecto${planConfig.maxProjects > 1 ? 's' : ''} activo${planConfig.maxProjects > 1 ? 's' : ''}. Cancelá uno existente para continuar.`,
        code: 'plan_limit_reached',
      },
      { status: 403 }
    )
  }

  try {
    await prisma.$transaction(async (tx) => {
      // ── Consume one use, atomically ──────────────────────────────────────────
      // The checks above are advisory: they run on a snapshot, so between them
      // and this write someone else can take the last use. The guard is what
      // actually decides. `usedCount: { lt: fields.maxUses }` is evaluated by
      // Postgres against the row it locks for the UPDATE, so of two requests
      // racing for the last use of a maxUses:1 coupon exactly one sees count 1
      // and the other sees count 0 — a read-then-write would let both through.
      //
      // This is stricter than the MercadoPago webhook, which does a bare
      // `increment: 1` and leans on the subscription's own status guard for
      // single-execution. There is no such upstream row here (redemption is the
      // whole transaction), so the guard lives on the coupon itself.
      const consumed = await tx.coupon.updateMany({
        where: {
          id: coupon.id,
          active: true,
          usedCount: { lt: prisma.coupon.fields.maxUses },
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
        data: { usedCount: { increment: 1 } },
      })
      if (consumed.count === 0) {
        throw new RedeemError(409, 'Cupón agotado', 'coupon_exhausted')
      }

      // ── Grant the plan ───────────────────────────────────────────────────────
      // Guarded on `hasPaid: false` so two redemptions racing on the same
      // project cannot both grant. The loser throws, which rolls back its own
      // coupon increment above — the use is never spent without a grant.
      const granted = await tx.project.updateMany({
        where: { id: project.id, userId: session.user!.id, hasPaid: false },
        data: {
          hasPaid: true,
          plan: planConfig.id,
          billingStatus: 'active',
          graceUntil: null,
          suspendedAt: null,
          suspendedReason: null,
          couponId: coupon.id,
          couponRedeemedAt: now,
        },
      })
      if (granted.count === 0) {
        throw new RedeemError(
          409,
          'Este sitio ya tiene un plan activo. No hace falta usar un cupón.',
          'already_paid'
        )
      }
    })
  } catch (err) {
    if (err instanceof RedeemError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    console.error(`[redeem-coupon] project ${project.id} / coupon ${coupon.code} failed:`, err)
    return NextResponse.json({ error: 'Error interno al canjear el cupón' }, { status: 500 })
  }

  console.log(
    `[redeem-coupon] ${session.user.email ?? session.user.id} redeemed ${coupon.code} on project ${project.id} (${project.slug}) → plan ${planConfig.id}`
  )

  return NextResponse.json({
    ok: true,
    alreadyRedeemed: false,
    code: coupon.code,
    plan: planConfig.id,
    planName: planConfig.name,
  })
}
