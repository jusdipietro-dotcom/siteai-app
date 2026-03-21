import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptPortalCredentials } from '@/lib/encryption'

const PROVISIONING_SECRET = process.env.SCRAPER_API_KEY

function authenticateRequest(req: NextRequest): boolean {
  const apiKey = req.nextUrl.searchParams.get('apiKey')
    || req.headers.get('x-api-key')
  return !!PROVISIONING_SECRET && apiKey === PROVISIONING_SECRET
}

/**
 * GET /api/monitoreo/provision/[id]?apiKey=...
 * Returns decrypted credentials for a subscription (used by n8n provisioning workflow)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authenticateRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sub = await prisma.monitoringSubscription.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Decrypt portal credentials
    const creds = decryptPortalCredentials({
      credentialUser: sub.credentialUser,
      credentialPass: sub.credentialPass,
      credentialIv: sub.credentialIv,
      credentialTag: sub.credentialTag,
    })

    return NextResponse.json({
      subscriptionId: sub.id,
      userId: sub.userId,
      userName: sub.user.name,
      userEmail: sub.user.email,
      status: sub.status,
      plan: sub.plan,
      portal: sub.portal,
      cuil: sub.cuil,
      notificationEmail: sub.notificationEmail,
      payerEmail: sub.payerEmail,
      n8nTenantId: sub.n8nTenantId,
      // Decrypted credentials for tenant registration
      pjnUser: creds.pjnUser || null,
      pjnPass: creds.pjnPass || null,
      scbaUser: creds.scbaUser || null,
      scbaPass: creds.scbaPass || null,
    })
  } catch (err) {
    console.error('[Provision GET] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/monitoreo/provision/[id]?apiKey=...
 * Body: { action: 'activate', n8nTenantId: '...' }
 *    or { action: 'suspend' }
 * Updates subscription status after provisioning/deprovisioning
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

    const sub = await prisma.monitoringSubscription.findUnique({
      where: { id: params.id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (action === 'activate') {
      if (!n8nTenantId) {
        return NextResponse.json({ error: 'n8nTenantId required for activation' }, { status: 400 })
      }

      await prisma.monitoringSubscription.update({
        where: { id: params.id },
        data: {
          status: 'active',
          n8nTenantId,
          provisionedAt: new Date(),
        },
      })

      console.log(`[Provision] Subscription ${params.id} activated — tenantId: ${n8nTenantId}`)
      return NextResponse.json({ status: 'active', n8nTenantId })
    }

    if (action === 'suspend') {
      await prisma.monitoringSubscription.update({
        where: { id: params.id },
        data: { status: 'suspended' },
      })

      console.log(`[Provision] Subscription ${params.id} suspended`)
      return NextResponse.json({ status: 'suspended' })
    }

    return NextResponse.json({ error: 'Invalid action. Use: activate, suspend' }, { status: 400 })
  } catch (err) {
    console.error('[Provision PATCH] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
