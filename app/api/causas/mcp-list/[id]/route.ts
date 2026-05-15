import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * MCP service endpoint — returns a single case (with parsed movements).
 * Same service-token auth as ../route.ts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const expectedToken = process.env.MCP_SERVICE_TOKEN
  if (!expectedToken) {
    return NextResponse.json(
      { error: 'MCP_SERVICE_TOKEN not configured on server' },
      { status: 503 }
    )
  }
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ') || auth.slice(7).trim() !== expectedToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userEmail =
    searchParams.get('userEmail') ?? process.env.MCP_CAUSAS_DEFAULT_EMAIL ?? ''
  if (!userEmail) {
    return NextResponse.json(
      { error: 'userEmail param required (or set MCP_CAUSAS_DEFAULT_EMAIL)' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const caso = await prisma.causasCase.findFirst({
    where: {
      id: params.id,
      subscription: { userId: user.id, status: 'active' },
    },
    include: { subscription: { select: { lastScrapeAt: true, dptoNombre: true } } },
  })

  if (!caso) {
    return NextResponse.json({ error: 'case not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...caso,
    movimientos: JSON.parse(caso.movimientos || '[]'),
  })
}
