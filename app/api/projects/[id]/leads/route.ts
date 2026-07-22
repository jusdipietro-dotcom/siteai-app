import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  SITE_LEADS_PAGE_SIZE,
  clampLeadsPage,
  leadsPageCount,
  type SiteLeadsResponse,
} from '@/lib/site-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The owner's read path for leads captured by their published site.
 *
 * WHY THIS EXISTS: `POST /api/site-leads` was the only call site for the
 * `SiteLead` table in the whole repo. A lead was delivered exactly once, by a
 * fire-and-forget notification email; if that mail bounced or was deleted, the
 * row was unreachable by any code path. The data was durable and invisible.
 *
 * OWNERSHIP IS THE WHOLE SECURITY STORY HERE. These rows are third-party
 * personal data — the name, email and phone of someone who contacted a business,
 * who never had an account here and never consented to anyone else reading it.
 * So the project is resolved with the same `findFirst({ id, userId })` shape the
 * other project routes use (see `app/api/projects/[id]/route.ts`), and the lead
 * query is then scoped to `project.id` — the id that came back from the
 * ownership check, never the raw `params.id`. A caller who is not the owner gets
 * 404, which is also what a nonexistent project returns: the response must not
 * confirm that someone else's project id is real.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Counted before the page is read so the page number can be clamped to a page
  // that exists. That clamp is what bounds `skip`: it can never exceed the row
  // count, so `?page=99999999` degrades to the last real page instead of asking
  // Postgres to walk an arbitrary offset.
  const [total, unread] = await Promise.all([
    prisma.siteLead.count({ where: { projectId: project.id } }),
    prisma.siteLead.count({ where: { projectId: project.id, status: 'new' } }),
  ])

  const page = clampLeadsPage(req.nextUrl.searchParams.get('page'), total)

  const rows = await prisma.siteLead.findMany({
    where: { projectId: project.id },
    // Newest-first, which is what the @@index([projectId, createdAt]) on the
    // model was added to serve.
    orderBy: { createdAt: 'desc' },
    skip: page * SITE_LEADS_PAGE_SIZE,
    take: SITE_LEADS_PAGE_SIZE,
    // Explicit select, not the whole row: `ipAddress` and `userAgent` stay on
    // the server. They exist for abuse triage, and the inbox does not need them
    // to act on a lead.
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      status: true,
      createdAt: true,
    },
  })

  const body: SiteLeadsResponse = {
    leads: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    page,
    pageSize: SITE_LEADS_PAGE_SIZE,
    pageCount: leadsPageCount(total),
    total,
    unread,
  }

  return NextResponse.json(body)
}
