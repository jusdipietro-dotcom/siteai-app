import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendSiteLeadNotificationEmail } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { parseJSON } from '@/lib/published-site'
import type { BusinessData } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Lead capture for the contact form on a PUBLISHED client site.
 *
 * Deliberately a sibling of /api/inquiries rather than an extension of it. That
 * endpoint is the agency's own sales funnel: its `service` enum, its honeypot,
 * and its notification all target the platform admin. A published-site lead is a
 * different thing entirely — it belongs to one specific project and must reach
 * THAT project's owner, never the platform. Overloading the security-sensitive
 * inquiries route with per-project routing and a different recipient would blur
 * two flows that should stay apart, so the lead gets its own endpoint and its
 * own table (SiteLead) associated to the project.
 */
const siteLeadSchema = z.object({
  projectId: z.string().min(1).max(60),
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().nullable(),
  message: z.string().min(2).max(4000),
  // Same anti-spam contract as /api/inquiries: a filled honeypot means a bot.
  honeypot: z.string().max(0).optional(),
})

export async function POST(req: Request) {
  const ip = getClientIp(req)

  const limit = checkRateLimit(`site-leads:${ip}`, { maxRequests: 5, windowSeconds: 600 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados mensajes desde esta conexion. Intenta de nuevo en unos minutos.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const parsed = siteLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // A filled honeypot: pretend success so the bot has nothing to learn, but
  // store nothing and notify no one.
  if (parsed.data.honeypot && parsed.data.honeypot.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // Only accept leads for a live site. A draft/unpaid project has no public form,
  // so a request for one is either stale or forged — reject without leaking
  // whether the id exists.
  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, status: 'published', hasPaid: true },
    select: { id: true, name: true, businessData: true, user: { select: { email: true } } },
  })
  if (!project) {
    return NextResponse.json({ error: 'Sitio no disponible' }, { status: 404 })
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null

  let lead
  try {
    // Persist FIRST. The owner must be able to see the lead later even if the
    // notification email fails, so storage is what defines success.
    lead = await prisma.siteLead.create({
      data: {
        projectId: project.id,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim().toLowerCase(),
        phone: parsed.data.phone?.trim() || null,
        message: parsed.data.message.trim(),
        ipAddress: ip,
        userAgent,
      },
    })
  } catch (err) {
    console.error('[site-leads] create failed', err)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }, { status: 500 })
  }

  // Route the notification to the SITE OWNER, not the platform: prefer the
  // public contact email the owner set on the site, fall back to the account
  // email. Fire-and-forget — the lead is already saved, so a mail failure must
  // not turn a captured lead into an error for the visitor.
  const bd = parseJSON<BusinessData>(project.businessData, {} as BusinessData)
  const ownerEmail = bd.contact?.email?.trim() || project.user?.email || null
  if (ownerEmail) {
    sendSiteLeadNotificationEmail({
      to: ownerEmail,
      businessName: bd.name || project.name,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
      },
    }).catch((err) => {
      console.error('[site-leads] notification email failed', err)
    })
  } else {
    console.warn(`[site-leads] no owner email for project ${project.id}; lead ${lead.id} stored only`)
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 })
}
