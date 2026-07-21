import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

/**
 * external_reference prefix → Prisma model, for the twelve product
 * subscriptions. Mirrors the dispatch in app/api/mp/webhook/route.ts; keep the
 * two in sync when a product is added.
 */
const PRODUCT_MODELS: Record<string, string> = {
  monitoring: 'monitoringSubscription',
  reviews: 'reviewsSubscription',
  linkedin: 'linkedInSubscription',
  trading: 'tradingSubscription',
  leads: 'leadsSubscription',
  emailmarketing: 'emailMarketingSubscription',
  prospeccion: 'prospeccionSubscription',
  turnos: 'turnosSubscription',
  causas: 'causasSubscription',
  facturacion: 'facturacionSubscription',
  lexpost: 'lexPostSubscription',
  suite: 'suiteJuridicaSubscription',
}

/**
 * Confirms the record behind an external_reference belongs to `userId`.
 *
 * Knowing a preapproval_id or payment_id must not be enough to read its status:
 * those identifiers come from the URL and any authenticated user can substitute
 * someone else's. This is the ownership check that turns "I know an id" into
 * "this is mine".
 *
 * Fails closed. An unparseable reference, an unknown product prefix, a missing
 * record and someone else's record all return false — callers must not be able
 * to tell those apart.
 */
async function referenceBelongsToUser(
  externalReference: string | null | undefined,
  userId: string
): Promise<boolean> {
  if (!externalReference || typeof externalReference !== 'string') return false

  const parts = externalReference.split(':')

  // Site generator: "{projectId}:{plan}"
  if (parts.length === 2) {
    const [projectId] = parts
    if (!projectId) return false
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    })
    return project !== null
  }

  // Products: "{producto}:{subId}:{plan}", and monitoring's plan-replacement
  // variant "monitoring:{subId}:{plan}:{replacesSubId}". Mirrors the webhook,
  // which accepts any reference with at least three segments.
  if (parts.length >= 3) {
    const [producto, subId] = parts
    if (!producto || !subId) return false

    const model = PRODUCT_MODELS[producto]
    if (!model) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (prisma as any)[model]
    if (!delegate?.findFirst) return false

    const row = await delegate.findFirst({
      where: { id: subId, userId },
      select: { id: true },
    })
    return row !== null
  }

  return false
}

/** Single denial response — never distinguishes "not yours" from "not found". */
function notFound() {
  return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Only identifiers are read from the URL. The subscription status is always
  // resolved against the MercadoPago API — never taken from query params, which
  // the user fully controls. Knowing an id is not authorization: every branch
  // below re-derives the owner from external_reference and matches it against
  // the session before returning anything.
  const preapprovalId = req.nextUrl.searchParams.get('preapproval_id')
  const paymentId = req.nextUrl.searchParams.get('payment_id')

  // ── Caso 1: retorno desde preapproval (suscripción real) ──────────────────
  if (preapprovalId) {
    try {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[MP] check-preapproval error:', data)
        // An id MercadoPago does not know is indistinguishable from one that is
        // not the caller's. Upstream failures stay 502 so a transient outage is
        // not reported to the user as "no existe".
        if (res.status === 404) return notFound()
        return NextResponse.json({ error: 'Error consultando suscripción' }, { status: 502 })
      }

      if (!(await referenceBelongsToUser(data.external_reference, session.user.id))) {
        return notFound()
      }

      // Narrowed on purpose: the raw MercadoPago object carries amounts, payer
      // details and the external_reference (which encodes projectId and plan).
      // Both callers only read `status`.
      return NextResponse.json({
        status: data.status === 'authorized' ? 'authorized' : data.status,
      })
    } catch (err) {
      console.error('[MP] check-preapproval exception:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  // ── Caso 2: retorno con payment_id (Checkout Pro legacy) ──────────────────
  if (paymentId) {
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[MP] check-payment error:', data)
        if (res.status === 404) return notFound()
        return NextResponse.json({ error: 'Error consultando pago' }, { status: 502 })
      }

      if (!(await referenceBelongsToUser(data.external_reference, session.user.id))) {
        return notFound()
      }

      // Narrowed: the full payment object exposes amount, payer email and more.
      return NextResponse.json({
        status: data.status === 'approved' ? 'authorized' : data.status,
      })
    } catch (err) {
      console.error('[MP] check-payment exception:', err)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })
}
