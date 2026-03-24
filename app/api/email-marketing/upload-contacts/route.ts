import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getPlanConfig } from '@/lib/email-marketing-plans'
import * as XLSX from 'xlsx'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Column name patterns for auto-detection
const EMAIL_PATTERNS = ['email', 'e-mail', 'correo', 'mail', 'correo electronico', 'correo electrónico', 'email address']
const NAME_PATTERNS = ['nombre', 'name', 'first_name', 'first name', 'nombre completo', 'full name', 'cliente', 'contacto']

function detectColumn(headers: string[], patterns: string[]): number {
  const normalized = headers.map(h => h.toLowerCase().trim())
  for (const pattern of patterns) {
    const idx = normalized.indexOf(pattern)
    if (idx !== -1) return idx
  }
  return -1
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`emailmarketing-upload:${ip}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Parse multipart form
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const subscriptionId = formData.get('subscriptionId') as string | null

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    // Validate file
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ error: 'Formato no soportado. Subí un archivo .csv, .xlsx o .xls' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })
    }

    // Validate subscription
    const sub = await prisma.emailMarketingSubscription.findFirst({
      where: { id: subscriptionId, userId: session.user.id },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    if (sub.status !== 'awaiting_contacts') {
      return NextResponse.json({ error: 'Esta suscripción no está esperando contactos' }, { status: 400 })
    }

    const planConfig = getPlanConfig(sub.plan)
    if (!planConfig) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Parse file
    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch {
      return NextResponse.json({ error: 'No se pudo leer el archivo. Verificá que sea un CSV o Excel válido.' }, { status: 400 })
    }

    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return NextResponse.json({ error: 'El archivo no tiene hojas de datos' }, { status: 400 })
    }

    const sheet = workbook.Sheets[sheetName]
    const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (rawData.length < 2) {
      return NextResponse.json({ error: 'El archivo necesita al menos una fila de encabezado y una de datos' }, { status: 400 })
    }

    // Detect columns
    const headers = rawData[0].map(h => String(h))
    const emailCol = detectColumn(headers, EMAIL_PATTERNS)
    const nameCol = detectColumn(headers, NAME_PATTERNS)

    if (emailCol === -1) {
      return NextResponse.json(
        { error: `No se encontró columna de email. Las columnas del archivo son: ${headers.join(', ')}. Necesitamos una columna llamada "Email", "E-mail" o "Correo".` },
        { status: 400 }
      )
    }

    // Parse contacts
    const contacts: { email: string; name: string }[] = []
    const errors: string[] = []

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const email = String(row[emailCol] ?? '').toLowerCase().trim()
      const name = nameCol !== -1 ? String(row[nameCol] ?? '').trim() : ''

      if (!email) continue // skip empty rows

      if (!EMAIL_RE.test(email)) {
        if (errors.length < 5) errors.push(`Fila ${i + 1}: email inválido "${email}"`)
        continue
      }

      contacts.push({ email, name: name || 'Sin nombre' })
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No se encontraron contactos válidos en el archivo' }, { status: 400 })
    }

    // Deduplicate by email
    const seen = new Set<string>()
    const uniqueContacts = contacts.filter(c => {
      if (seen.has(c.email)) return false
      seen.add(c.email)
      return true
    })

    // Validate plan limit
    if (uniqueContacts.length > planConfig.maxContacts) {
      return NextResponse.json(
        { error: `Tu plan (${planConfig.name}) permite hasta ${planConfig.maxContacts.toLocaleString()} contactos. El archivo tiene ${uniqueContacts.length.toLocaleString()}. Necesitás un plan superior.` },
        { status: 400 }
      )
    }

    // Send contacts to n8n provisioning webhook
    const webhookUrl = process.env.N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK
    if (!webhookUrl) {
      console.error('[Upload Contacts] N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK not configured')
      return NextResponse.json({ error: 'El sistema de provisioning no está configurado. Contactá soporte.' }, { status: 503 })
    }

    let googleSheetId: string | null = null

    try {
      const provRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'provision',
          subscriptionId: sub.id,
          userId: sub.userId,
          plan: sub.plan,
          businessName: sub.businessName,
          senderName: sub.senderName,
          senderEmail: sub.senderEmail,
          notificationEmail: sub.notificationEmail,
          contacts: uniqueContacts,
          contactCount: uniqueContacts.length,
        }),
      })

      if (provRes.ok) {
        const provData = await provRes.json().catch(() => ({}))
        googleSheetId = provData.googleSheetId ?? null
      } else {
        console.error('[Upload Contacts] Provisioning webhook failed:', provRes.status)
      }
    } catch (err) {
      console.error('[Upload Contacts] Provisioning webhook error:', err)
    }

    // Update subscription
    await prisma.emailMarketingSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'provisioning',
        contactCount: uniqueContacts.length,
        contactsUploadedAt: new Date(),
        googleSheetId,
      },
    })

    const duplicatesRemoved = contacts.length - uniqueContacts.length
    const invalidSkipped = rawData.length - 1 - contacts.length

    return NextResponse.json({
      success: true,
      contactCount: uniqueContacts.length,
      duplicatesRemoved,
      invalidSkipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[Upload Contacts] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
