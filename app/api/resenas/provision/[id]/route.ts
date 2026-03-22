import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PROVISIONING_SECRET = process.env.SCRAPER_API_KEY

function authenticateRequest(req: NextRequest): boolean {
  const apiKey = req.nextUrl.searchParams.get('apiKey')
    || req.headers.get('x-api-key')
  return !!PROVISIONING_SECRET && apiKey === PROVISIONING_SECRET
}

/**
 * GET /api/resenas/provision/[id]?apiKey=...
 * Returns subscription data for n8n provisioning workflow
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sub = await prisma.reviewsSubscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (!['provisioning', 'active'].includes(sub.status)) {
      return NextResponse.json({ error: `Cannot provision subscription with status: ${sub.status}` }, { status: 403 })
    }

    return NextResponse.json({
      subscriptionId: sub.id,
      userId: sub.userId,
      userName: sub.user.name,
      userEmail: sub.user.email,
      status: sub.status,
      plan: sub.plan,
      businessName: sub.businessName,
      businessType: sub.businessType,
      searchUrl: sub.searchUrl,
      googleEmail: sub.googleEmail,
      responseTone: sub.responseTone,
      notificationEmail: sub.notificationEmail,
      payerEmail: sub.payerEmail,
      n8nTenantId: sub.n8nTenantId,
    })
  } catch (err) {
    console.error('[Reviews Provision GET] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/resenas/provision/[id]?apiKey=...
 * Body: { action: 'activate', n8nTenantId: '...' }
 *    or { action: 'suspend' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, n8nTenantId } = body

    const sub = await prisma.reviewsSubscription.findUnique({
      where: { id: params.id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (action === 'activate') {
      if (!n8nTenantId) {
        return NextResponse.json({ error: 'n8nTenantId required for activation' }, { status: 400 })
      }
      if (sub.status !== 'provisioning') {
        return NextResponse.json({ error: `Cannot activate subscription with status: ${sub.status}` }, { status: 400 })
      }

      await prisma.reviewsSubscription.update({
        where: { id: params.id },
        data: {
          status: 'active',
          n8nTenantId,
          provisionedAt: new Date(),
        },
      })

      console.log(`[Reviews Provision] Subscription ${params.id} activated — tenantId: ${n8nTenantId}`)
      return NextResponse.json({ status: 'active', n8nTenantId })
    }

    if (action === 'suspend') {
      await prisma.reviewsSubscription.update({
        where: { id: params.id },
        data: { status: 'suspended' },
      })

      console.log(`[Reviews Provision] Subscription ${params.id} suspended`)
      return NextResponse.json({ status: 'suspended' })
    }

    return NextResponse.json({ error: 'Invalid action. Use: activate, suspend' }, { status: 400 })
  } catch (err) {
    console.error('[Reviews Provision PATCH] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
