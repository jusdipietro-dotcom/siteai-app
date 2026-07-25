import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { promises as dns } from 'dns'
import { randomBytes } from 'crypto'
import { normalizeCustomDomain, isValidCustomDomain } from '@/lib/custom-domain'

// DNS lookups need the Node runtime (not Edge) and must never be cached.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/*
  Custom-domain lifecycle for the owner (enfoque B — assisted activation).

  The app never holds EasyPanel credentials: it takes the domain, checks the
  owner pointed DNS at us, and marks it 'verified'. The final Traefik activation
  (route + TLS) is done out of band by an operator, which flips the row to
  'active'. Only then does the site serve on the domain (see the loader gate).

  Actions (POST): set | verify | remove.
*/

// Clients point their A record at the platform's web host. Resolved live so a
// server IP change never leaves this endpoint (or the instructions) stale.
const TARGET_HOST = 'sites.automaticialab.com'

// Subdomain where the owner publishes the TXT ownership token.
const VERIFY_PREFIX = '_automaticialab-verify'

async function targetIps(): Promise<string[]> {
  try {
    return await dns.resolve4(TARGET_HOST)
  } catch {
    return []
  }
}

// dns.resolveTxt returns string[][] (a record may be split into chunks). Flatten
// each record's chunks into one string and return the list of full TXT values.
async function txtValues(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(name)
    return records.map((chunks) => chunks.join(''))
  } catch {
    return []
  }
}

// Read-only status + the current target IP, so the card can show the DNS
// instructions on load without a side-effecting verify.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const projectId = req.nextUrl.searchParams.get('projectId') ?? ''
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { customDomain: true, customDomainStatus: true, customDomainVerifyToken: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }
  const target = await targetIps()
  return NextResponse.json({
    domain: project.customDomain,
    status: project.customDomainStatus,
    targetIp: target[0] ?? null,
    targetHost: TARGET_HOST,
    // Ownership challenge the owner must publish as a TXT record before verify.
    verifyToken: project.customDomainVerifyToken,
    verifyHost: project.customDomain ? `${VERIFY_PREFIX}.${project.customDomain}` : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let action = ''
  let projectId = ''
  let domainInput = ''
  try {
    const body = await req.json()
    action = String(body?.action ?? '')
    projectId = String(body?.projectId ?? '')
    domainInput = String(body?.domain ?? '')
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }
  if (!project.hasPaid) {
    return NextResponse.json({ error: 'El dominio propio requiere un plan pago' }, { status: 403 })
  }

  const target = await targetIps()
  const targetIp = target[0] ?? null

  // ── remove ────────────────────────────────────────────────────────────────
  if (action === 'remove') {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        customDomain: null,
        customDomainStatus: 'none',
        customDomainVerifiedAt: null,
        customDomainVerifyToken: null,
      },
    })
    return NextResponse.json({ ok: true, status: 'none', targetIp })
  }

  // ── set ───────────────────────────────────────────────────────────────────
  if (action === 'set') {
    const domain = normalizeCustomDomain(domainInput)
    if (!isValidCustomDomain(domain)) {
      return NextResponse.json(
        { error: 'Ingresá un dominio válido, por ejemplo tunegocio.com.ar' },
        { status: 400 }
      )
    }
    // A domain can back only one site.
    const taken = await prisma.project.findFirst({
      where: { customDomain: domain, NOT: { id: project.id } },
    })
    if (taken) {
      return NextResponse.json({ error: 'Ese dominio ya está en uso por otro sitio' }, { status: 409 })
    }
    // Fresh ownership token on every (re)assignment: rotating it means a domain
    // released by one project can't be verified by another with a stale token.
    const verifyToken = randomBytes(16).toString('hex')
    await prisma.project.update({
      where: { id: project.id },
      data: {
        customDomain: domain,
        customDomainStatus: 'pending',
        customDomainVerifiedAt: null,
        customDomainVerifyToken: verifyToken,
      },
    })
    return NextResponse.json({
      ok: true,
      status: 'pending',
      domain,
      targetIp,
      verifyToken,
      verifyHost: `${VERIFY_PREFIX}.${domain}`,
    })
  }

  // ── verify ────────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!project.customDomain) {
      return NextResponse.json({ error: 'Primero ingresá tu dominio' }, { status: 400 })
    }
    if (!project.customDomainVerifyToken) {
      // Domain set before the token challenge existed — reissue and ask again.
      const verifyToken = randomBytes(16).toString('hex')
      await prisma.project.update({
        where: { id: project.id },
        data: { customDomainVerifyToken: verifyToken },
      })
      return NextResponse.json({
        ok: false,
        verified: false,
        status: project.customDomainStatus,
        targetIp,
        verifyToken,
        verifyHost: `${VERIFY_PREFIX}.${project.customDomain}`,
        message: 'Agregá el registro TXT de verificación y volvé a intentar.',
      })
    }
    if (target.length === 0) {
      return NextResponse.json(
        { error: 'No pudimos resolver el servidor de destino. Probá de nuevo en unos minutos.' },
        { status: 502 }
      )
    }

    // Ownership gate: the TXT token proves the requester controls the domain's
    // DNS. Without it, the A-record check alone only proves the domain points at
    // our SHARED host — which anyone can do to a name they don't own, letting a
    // paid user squat someone else's domain. Check ownership FIRST.
    const verifyHost = `${VERIFY_PREFIX}.${project.customDomain}`
    const publishedTokens = await txtValues(verifyHost)
    const ownsDomain = publishedTokens.includes(project.customDomainVerifyToken)
    if (!ownsDomain) {
      return NextResponse.json({
        ok: false,
        verified: false,
        status: project.customDomainStatus,
        targetIp,
        verifyToken: project.customDomainVerifyToken,
        verifyHost,
        message: 'Todavía no vemos el registro TXT de verificación. Agregalo en tu DNS y esperá la propagación (puede tardar hasta 48 hs).',
      })
    }

    let clientIps: string[] = []
    try {
      clientIps = await dns.resolve4(project.customDomain)
    } catch {
      return NextResponse.json({
        ok: false,
        verified: false,
        status: project.customDomainStatus,
        targetIp,
        message: 'Todavía no vemos tu dominio apuntando a nosotros. El DNS puede tardar hasta 48 hs en propagar.',
      })
    }

    const matches = clientIps.some((ip) => target.includes(ip))
    if (matches) {
      await prisma.project.update({
        where: { id: project.id },
        data: { customDomainStatus: 'verified', customDomainVerifiedAt: new Date() },
      })
      return NextResponse.json({
        ok: true,
        verified: true,
        status: 'verified',
        targetIp,
        message: 'DNS verificado. Vamos a activar tu dominio a la brevedad.',
      })
    }

    return NextResponse.json({
      ok: false,
      verified: false,
      status: project.customDomainStatus,
      targetIp,
      message: 'Tu dominio todavía no apunta a nuestro servidor. Revisá el registro A y esperá la propagación del DNS.',
    })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
