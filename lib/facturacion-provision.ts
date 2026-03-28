import { prisma } from './prisma'

/**
 * Provision a facturacion subscription in the Flask backend.
 * Creates a tenant with the subscription's CUIT, plan, and user data.
 * Used by: webhook (after payment), subscribe (free/trial), configure (suite).
 *
 * @param subscriptionId - FacturacionSubscription ID
 * @param targetStatus - Final status after provisioning ('active' or 'trial')
 */
export async function provisionFacturacion(
  subscriptionId: string,
  targetStatus: 'active' | 'trial' = 'active'
): Promise<{ success: boolean; flaskTenantId?: number }> {
  const flaskUrl = process.env.FLASK_BACKEND_URL
  const provisionSecret = process.env.FLASK_PROVISION_SECRET

  if (!flaskUrl || !provisionSecret) {
    console.warn('[Facturacion Provision] FLASK_BACKEND_URL or FLASK_PROVISION_SECRET not configured')
    return { success: false }
  }

  const sub = await prisma.facturacionSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!sub) return { success: false }

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${flaskUrl}/auth/portal-provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Portal-Secret': provisionSecret,
        },
        body: JSON.stringify({
          cuit: sub.cuit,
          razonSocial: sub.razonSocial,
          puntoVenta: sub.puntoVenta,
          condicionIva: sub.condicionIva,
          email: sub.user.email,
          nombre: sub.user.name || sub.razonSocial,
          plan: sub.plan,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        await prisma.facturacionSubscription.update({
          where: { id: subscriptionId },
          data: {
            status: targetStatus,
            flaskTenantId: data.tenantId,
            flaskUserEmail: data.userEmail || sub.user.email,
            provisionedAt: new Date(),
          },
        })
        console.log(`[Facturacion Provision] ${subscriptionId} -> ${targetStatus} (Flask tenant: ${data.tenantId})`)
        return { success: true, flaskTenantId: data.tenantId }
      }

      console.warn(`[Facturacion Provision] Attempt ${attempt}/${maxRetries} failed: ${res.status}`)
    } catch (err) {
      console.error(`[Facturacion Provision] Attempt ${attempt}/${maxRetries} error:`, err)
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  console.error(`[Facturacion Provision] ${subscriptionId} FAILED after ${maxRetries} attempts`)
  return { success: false }
}
