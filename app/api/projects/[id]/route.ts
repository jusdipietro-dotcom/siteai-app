import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeProject, deserializeProject } from '@/lib/projectSerializer'

async function getOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const row = await getOwnedProject(params.id, session.user.id)
  if (!row) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  return NextResponse.json(deserializeProject(row))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const existing = await getOwnedProject(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: serializeProject(body),
  })

  return NextResponse.json(deserializeProject(updated))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const existing = await getOwnedProject(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
