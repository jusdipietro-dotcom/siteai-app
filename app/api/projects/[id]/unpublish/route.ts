import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deserializeProject } from '@/lib/projectSerializer'

/**
 * Takes a project offline.
 *
 * Ownership only — no payment check. Unpublishing removes access rather than
 * granting it, so a lapsed or unpaid user must always be able to do it.
 * Returns the project to `draft` and clears the published URL.
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

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { status: 'draft', publishedUrl: null },
  })

  return NextResponse.json(deserializeProject(updated))
}
