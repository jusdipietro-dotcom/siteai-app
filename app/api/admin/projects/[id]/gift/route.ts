import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/** Fields returned to the panel after a change, so the row can refresh in place. */
const PROJECT_SELECT = {
  id: true,
  name: true,
  slug: true,
  subdomain: true,
  status: true,
  plan: true,
  hasPaid: true,
  billingStatus: true,
  graceUntil: true,
  suspendedAt: true,
  suspendedReason: true,
  grantedBy: true,
  grantedAt: true,
  createdAt: true,
  user: { select: { id: true, email: true, name: true } },
} as const

/**
 * POST: gift a project — "Regalar".
 *
 * Mirrors what /root/regalar-sitio.sh does on the VPS today: flip the project
 * to a paid professional plan and clear anything that would suspend it.
 *
 * It also does the one thing the script could not: record *who* granted it and
 * *when*. Without that, a comped site is indistinguishable from a real sale in
 * every later revenue query.
 *
 * suspendedReason is cleared alongside suspendedAt — leaving 'payment_failed'
 * on a site we just marked active would be self-contradictory state.
 *
 * Publication status is intentionally NOT touched. Gifting pays for a site; it
 * does not decide to publish it. The owner still presses publish.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      hasPaid: true,
      plan: 'professional',
      billingStatus: 'active',
      graceUntil: null,
      suspendedAt: null,
      suspendedReason: null,
      grantedBy: session.user.email,
      grantedAt: new Date(),
    },
    select: PROJECT_SELECT,
  })

  console.log(
    `[admin/gift] ${session.user.email} granted project ${project.id} (${project.slug}) to ${updated.user.email}`
  )

  return NextResponse.json({ project: updated })
}

/**
 * DELETE: revoke a gift — "Quitar regalo".
 *
 * Reverts to the unpaid free state and clears the provenance columns, because
 * they mean "this project is currently comped" — leaving a grantedBy on a
 * hasPaid=false row would report a gift that no longer exists.
 *
 * That does mean revoking erases the record of the gift. A permanent audit
 * trail needs an append-only event table, which is out of scope here; the
 * server log line below is the interim record.
 *
 * Also intentionally NOT touched: `status`. A published site stays published
 * — the public read path already re-derives access from hasPaid/billingStatus,
 * so unpublishing here would be a second, divergent source of truth.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const project = await prisma.project.findUnique({ where: { id: params.id } })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      hasPaid: false,
      plan: 'free',
      grantedBy: null,
      grantedAt: null,
    },
    select: PROJECT_SELECT,
  })

  console.log(
    `[admin/gift] ${session.user.email} revoked project ${project.id} (${project.slug}) from ${updated.user.email}`
  )

  return NextResponse.json({ project: updated })
}
