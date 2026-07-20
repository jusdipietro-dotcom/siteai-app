import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deserializeProject } from '@/lib/projectSerializer'
import { effectiveBillingStatus } from '@/lib/project-billing'

/**
 * Publishes a project — the only path to `status: 'published'`.
 *
 * Publishing is a paid transition, so it cannot be an ordinary field write:
 * `status` is not client-writable (see lib/projectSerializer.ts) precisely so
 * that this check cannot be routed around with
 * `PUT /api/projects/{id} {"status":"published"}`.
 *
 * Three server-side gates, in order:
 *   1. Ownership — the project must belong to the session user.
 *   2. Payment   — `hasPaid` must be true. `hasPaid` is written only by the
 *      MercadoPago webhook (app/api/mp/webhook/route.ts), never by a client.
 *   3. Billing   — the subscription must not be suspended. `hasPaid` survives a
 *      suspension, so it cannot answer this on its own.
 *
 * Gates 2 and 3 together are exactly what publishedGate() requires to serve the
 * site. Publishing must not succeed where serving would fail: a 200 from here
 * followed by a 404 on the public URL is worse than a clear refusal.
 *
 * The client-side paywall in the publish page is UX, not enforcement.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  // The paywall. Read from the DB row, never from the request.
  if (!project.hasPaid) {
    return NextResponse.json(
      {
        error:
          'Necesitás un plan activo para publicar este sitio. Elegí un plan y volvé a intentar.',
        code: 'payment_required',
      },
      { status: 402 }
    )
  }

  // `hasPaid` only says the project paid at some point; it stays true after a
  // suspension. Without this second gate a suspended project published fine and
  // got a 200 — but publishedGate() in lib/published-site.ts requires
  // active-or-in-grace, so the public URL 404'd. The owner was told the site was
  // live while it was dead, with nothing explaining why.
  //
  // Same predicate as publishedGate(), via effectiveBillingStatus(), so the two
  // cannot drift: 'grace' is still publishable (the site stays live while the
  // owner recovers the payment) and an elapsed grace resolves to 'suspended'
  // here even if no job has rewritten the row.
  const billing = effectiveBillingStatus(project)
  if (billing === 'suspended') {
    const cancelled = project.suspendedReason === 'cancelled'
    return NextResponse.json(
      {
        error: cancelled
          ? 'Tu suscripción está cancelada, así que el sitio no se puede publicar. Reactivala para volver a publicarlo.'
          : 'Tu suscripción está suspendida por un pago pendiente. Regularizá el pago para publicar el sitio.',
        code: cancelled ? 'subscription_cancelled' : 'subscription_suspended',
      },
      { status: 402 }
    )
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      status: 'published',
      // Server-owned: derived from the stored slug, never from the request body.
      publishedUrl: `/s/${project.slug}`,
    },
  })

  return NextResponse.json(deserializeProject(updated))
}
