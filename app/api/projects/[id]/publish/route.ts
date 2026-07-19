import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deserializeProject } from '@/lib/projectSerializer'

/**
 * Publishes a project — the only path to `status: 'published'`.
 *
 * Publishing is a paid transition, so it cannot be an ordinary field write:
 * `status` is not client-writable (see lib/projectSerializer.ts) precisely so
 * that this check cannot be routed around with
 * `PUT /api/projects/{id} {"status":"published"}`.
 *
 * Two server-side gates, in order:
 *   1. Ownership — the project must belong to the session user.
 *   2. Payment   — `hasPaid` must be true. `hasPaid` is written only by the
 *      MercadoPago webhook (app/api/mp/webhook/route.ts), never by a client.
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
