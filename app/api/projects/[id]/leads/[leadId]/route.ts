import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSiteLeadStatus } from '@/lib/site-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Marks one lead read / archived / back to new.
 *
 * `status` is the only writable field, and only to one of the three values the
 * schema already models. Nothing else about a lead is editable: the row is a
 * record of what a visitor actually sent, so letting the owner rewrite the
 * message or the email would destroy the only copy of it.
 *
 * WHY `updateMany` AND NOT `update`: `update` takes a unique `where`, which
 * means the ownership check and the write would look at two different things —
 * the project row, then the lead row by id alone. Between those two statements
 * the lead id is just a client-supplied string, and a mismatch would write to
 * another project's lead. `updateMany` lets `projectId` be part of the write's
 * own WHERE clause, so the ownership constraint and the mutation are the same
 * statement. `count === 0` then means "no such lead in a project you own",
 * which is a 404 for both halves of that sentence.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; leadId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const status = (body as { status?: unknown } | null)?.status
  if (!isSiteLeadStatus(status)) {
    return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
  }

  const result = await prisma.siteLead.updateMany({
    where: { id: params.leadId, projectId: project.id },
    data: { status },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ id: params.leadId, status })
}
