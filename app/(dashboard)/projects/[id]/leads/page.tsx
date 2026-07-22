import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LeadsInboxClient from './Client'

export const dynamic = 'force-dynamic'

/**
 * Server shell for the lead inbox.
 *
 * The inbox is a client component (it polls, filters and mutates), and
 * `GET /api/projects/[id]/leads` is the boundary that actually enforces
 * ownership. This shell repeats the check anyway, on purpose: it is what makes a
 * non-owner see a real 404 page instead of a chrome-and-spinner shell that
 * fetches, fails, and shows an error — and it means the project name in the
 * header comes from a row the session owner provably owns, rather than from
 * anything the URL asserted.
 */
export default async function ProjectLeadsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect(`/login?next=creador-de-sitios`)

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, name: true },
  })
  // Not "forbidden": a project belonging to someone else must be indistinguishable
  // from one that does not exist.
  if (!project) notFound()

  return <LeadsInboxClient projectId={project.id} projectName={project.name} />
}
