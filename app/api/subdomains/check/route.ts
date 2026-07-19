import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'

/**
 * GET /api/subdomains/check?value=<x> -> { available, reason? }
 *
 * Authenticated on purpose: the response reveals which subdomains are already
 * taken, which is enumeration material. Rate limited on top of that.
 *
 * This is advisory only. Two callers can both see `available: true` and then
 * both write — the unique index on Project.subdomain is the real arbiter and
 * the write paths translate its P2002 into a 409.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`subdomain-check:${ip}`, { maxRequests: 30, windowSeconds: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const value = req.nextUrl.searchParams.get('value')
  if (value === null) {
    return NextResponse.json({ error: 'Parámetro "value" requerido' }, { status: 400 })
  }

  // Format + reserved rejection happen before any DB query.
  const validation = validateSubdomain(value)
  if (!validation.valid) {
    return NextResponse.json({ available: false, reason: validation.reason })
  }

  const normalized = normalizeSubdomain(value)
  const taken = await prisma.project.findFirst({
    where: { subdomain: normalized },
    select: { id: true },
  })

  if (taken) {
    return NextResponse.json({ available: false, reason: 'Ese subdominio ya está en uso' })
  }

  return NextResponse.json({ available: true })
}
