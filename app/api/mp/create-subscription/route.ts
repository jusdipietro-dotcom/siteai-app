import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/validators'
import { getWebsitePlanConfig } from '@/lib/website-plans'
import { MP_API_TIMEOUT_MS } from '@/lib/fetch-timeouts'
import { requestLogger } from '@/lib/request-log'

const log = requestLogger({ route: 'api/mp/create-subscription' })

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

// ─── Configuración de planes ────────────────────────────────────────────────
// Precios y límites viven en lib/website-plans.ts (única fuente de verdad,
// compartida con el checkout y la página pública del producto).

/**
 * Best-effort cancellation of a prior MercadoPago preapproval.
 *
 * Time-bounded with an AbortController: MP can hang, and a stale preapproval
 * must not hold up a new checkout. A failure here never blocks the new
 * subscription — we log and proceed. Mirrors cancelMpPreapproval() in the
 * project cancel route.
 */
async function cancelMpPreapproval(preapprovalId: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      log.error('prior preapproval ${preapprovalId} cancel failed — status ${res.status}')
    }
    return res.ok
  } catch (err) {
    log.error('prior preapproval ${preapprovalId} cancel errored', { err })
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      log.error('MP_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ error: 'Pago no configurado. Contactá soporte.' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { plan, projectId, payerEmail, billing } = await req.json()
    const isAnnual = billing === 'annual'

    const config = getWebsitePlanConfig(plan)
    if (!config) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    if (!isValidEmail(payerEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })
    }

    // The project must belong to the session user. Without this check anyone
    // could open a preapproval pointing at someone else's project, and the
    // plan-limit count below would be scoped against the wrong project.
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true, preapprovalId: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Límite de proyectos activos: Essential=1, Professional=3
    const paidCount = await prisma.project.count({
      where: { userId: session.user.id, hasPaid: true, id: { not: projectId } },
    })
    const maxAllowed = config.maxProjects
    if (paidCount >= maxAllowed) {
      return NextResponse.json(
        { error: `Tu plan permite hasta ${maxAllowed} proyecto${maxAllowed > 1 ? 's' : ''} activo${maxAllowed > 1 ? 's' : ''}. Cancelá uno existente para continuar.` },
        { status: 403 }
      )
    }

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
    const requestHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000'
    const requestProto = req.headers.get('x-forwarded-proto') ?? 'https'
    const baseUrl = configuredUrl ?? `${requestProto}://${requestHost}`

    // MP redirige al back_url y agrega ?preapproval_id=XXX automáticamente
    const backUrl = `${baseUrl}/projects/${projectId}/checkout?mp_return=true`

    // Deliberately NO `start_date`: MercadoPago starts the billing cycle when
    // the payer authorises the subscription, which is what we want.
    //
    // This field used to be `Date.now() + 60_000`, added to avoid a rejection
    // for a start date in the past. It achieved the opposite: it gave the
    // customer SIXTY SECONDS to complete MercadoPago's own checkout — log in,
    // choose a card, confirm. Past that the start date was in the past and
    // MercadoPago silently disabled its "Confirmar" button: no error shown to
    // the customer, nothing logged on our side, and the sale simply died. Every
    // real customer would have hit this; nobody completes that flow in a minute.
    //
    // Verified live on 2026-07-22 against the production API: the identical
    // preapproval with a future start_date confirmed without a problem, and
    // MercadoPago accepts the field being omitted entirely. Omitting it removes
    // the time window rather than widening it.
    const body = {
      reason: config.title,
      external_reference: `${projectId}:${plan}`,
      payer_email: payerEmail.toLowerCase(),
      auto_recurring: {
        frequency: isAnnual ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: isAnnual ? config.annual : config.monthly,
        currency_id: 'ARS',
      },
      back_url: backUrl,
      status: 'pending',
    }

    // If this project already has a preapproval on file, cancel it at MP before
    // opening a new one. Otherwise a second checkout leaves two live
    // preapprovals and the customer is charged twice. Best-effort and
    // time-bounded: a failure here is logged and we proceed anyway — the new
    // checkout must not be blocked by MP being slow or the old id being stale.
    if (project.preapprovalId) {
      const cancelled = await cancelMpPreapproval(project.preapprovalId)
      if (!cancelled) {
        log.warn(
          'Proceeding with a new checkout despite failing to cancel the prior preapproval — it may keep charging until cancelled by other means',
          { projectId, priorPreapprovalId: project.preapprovalId }
        )
      }
    }

    log.info('Creating preapproval', { plan, projectId, payerEmail: payerEmail.toLowerCase() })

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(MP_API_TIMEOUT_MS),
    })

    const data = await res.json()

    if (!res.ok) {
      log.error('MercadoPago rejected the preapproval', { httpStatus: res.status, mpResponse: data })
      const mpCause = Array.isArray(data.cause)
        ? data.cause.map((c: { code?: string; description?: string }) => c.description ?? c.code).join(', ')
        : null

      // MercadoPago answers a bare 500 "Internal server error" — instead of a
      // clean 4xx — when it cannot process the payer_email (an address it does
      // not recognise or cannot resolve). Verified 2026-07-24: the identical
      // preapproval body 500s with one email and succeeds with another. Passing
      // MP's raw "Internal server error" straight to the customer made it look
      // like OUR checkout broke, when the fix is on their side (a valid email).
      // Translate that case into something actionable, and answer 502 (an
      // upstream failure) rather than echoing 500 (which reads as our bug).
      const isUpstreamGeneric =
        res.status >= 500 || /internal server error/i.test(String(data.message ?? ''))
      if (isUpstreamGeneric && !mpCause) {
        return NextResponse.json(
          {
            error:
              'MercadoPago no pudo iniciar la suscripción con ese email. Verificá que sea el email de una cuenta de MercadoPago válida (distinta de la del vendedor) y volvé a intentar en unos minutos.',
            mp_status: res.status,
          },
          { status: 502 }
        )
      }

      const mpMessage = data.message ?? data.error ?? 'Error de MercadoPago'
      return NextResponse.json(
        { error: mpCause ? `${mpMessage}: ${mpCause}` : mpMessage, mp_status: res.status },
        { status: res.status }
      )
    }

    const initPoint = data.init_point
    if (!initPoint) {
      log.error('preapproval missing init_point', { data })
      return NextResponse.json({ error: 'MercadoPago no devolvió un link de suscripción' }, { status: 502 })
    }

    log.info('Preapproval created', { preapprovalId: data.id })

    // Persist the preapproval id NOW, at creation — not only when the authorized
    // webhook lands. The double-checkout guard above and the project cancel flow
    // both key off Project.preapprovalId; leaving it null until the webhook is
    // exactly the Fase-2 gap documented in the cancel route. The webhook later
    // writes the same id on `authorized`, so the two writes are idempotent.
    // Scoped by owner and written server-side only; never client-writable.
    await prisma.project.updateMany({
      where: { id: projectId, userId: session.user.id },
      data: { preapprovalId: data.id },
    })

    return NextResponse.json({ init_point: initPoint, id: data.id })
  } catch (err) {
    log.error('create-subscription exception', { err })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
