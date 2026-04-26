import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SECRET = 'iq-migrate-2026-04-25-bff44a5'

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('token') !== SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Inquiry" (
        "id" TEXT NOT NULL,
        "service" TEXT NOT NULL,
        "packageId" TEXT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "company" TEXT,
        "website" TEXT,
        "budget" TEXT,
        "message" TEXT NOT NULL,
        "source" TEXT,
        "status" TEXT NOT NULL DEFAULT 'new',
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Inquiry_service_status_idx" ON "Inquiry"("service", "status")
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Inquiry_createdAt_idx" ON "Inquiry"("createdAt")
    `)

    const count = await prisma.inquiry.count()

    return NextResponse.json({
      ok: true,
      message: 'Inquiry table ensured',
      currentCount: count,
    })
  } catch (err) {
    console.error('[migrate-inquiry]', err)
    return NextResponse.json(
      { error: 'migration failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
