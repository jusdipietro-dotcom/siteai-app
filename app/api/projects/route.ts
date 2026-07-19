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

  let serialized
  try {
    // Billing fields are stripped: a new project always starts on the schema
    // defaults (plan "free", hasPaid false, views 0).
    serialized = serializeProjectFromClient(body)
  } catch (err) {
    if (err instanceof InvalidSubdomainError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma.project.create as any)({
      data: { ...serialized, userId: session.user.id },
    })
    return NextResponse.json(deserializeProject(row), { status: 201 })
  } catch (err) {
    // The availability check is advisory — two callers can both pass it and
    // then both write. The unique index decides; we just report it cleanly.
    if (isSubdomainConflict(err)) {
      return NextResponse.json({ error: 'Ese subdominio ya está en uso' }, { status: 409 })
    }
    throw err
  }
}
