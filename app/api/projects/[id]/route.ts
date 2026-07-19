import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  serializeProjectFromClient,
  deserializeProject,
  InvalidSubdomainError,
} from '@/lib/projectSerializer'
import { isSubdomainConflict } from '@/lib/prismaErrors'

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

  // Billing fields (plan / hasPaid / preapprovalId / views / publishedUrl) are
  // stripped here — only the MercadoPago webhook may write them.
  let data: Record<string, unknown>
  try {
    data = serializeProjectFromClient(body) as Record<string, unknown>
  } catch (err) {
    if (err instanceof InvalidSubdomainError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  // Once a project is published on a subdomain, that subdomain is frozen.
  // The live URL is already in the wild (links, QR codes, Google), so changing
  // or clearing it here would silently 404 real traffic. Re-sending the same
  // value is a no-op and stays allowed so unrelated PUTs don't break.
  if (existing.status === 'published' && existing.subdomain && 'subdomain' in data) {
    if (data.subdomain !== existing.subdomain) {
      return NextResponse.json(
        {
          error:
            'No se puede cambiar el subdominio de un proyecto publicado. Despublicá el sitio primero.',
        },
        { status: 409 }
      )
    }
  }

  try {
    const updated = await prisma.project.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json(deserializeProject(updated))
  } catch (err) {
    // The availability check is advisory — the unique index is the arbiter.
    if (isSubdomainConflict(err)) {
      return NextResponse.json({ error: 'Ese subdominio ya está en uso' }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const existing = await getOwnedProject(params.id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
