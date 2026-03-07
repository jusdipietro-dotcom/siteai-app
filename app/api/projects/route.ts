import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeProject, deserializeProject } from '@/lib/projectSerializer'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const rows = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(rows.map(deserializeProject))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()

  const serialized = serializeProject(body)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (prisma.project.create as any)({
    data: { ...serialized, userId: session.user.id },
  })

  return NextResponse.json(deserializeProject(row), { status: 201 })
}
