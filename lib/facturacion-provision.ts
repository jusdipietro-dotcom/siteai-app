import { prisma } from './prisma'
import { FLASK_BACKEND_TIMEOUT_MS } from './fetch-timeouts'
import { requestLogger } from './request-log'

/**
 * A provisioning failure here means a customer paid and never got the product,
 * so these lines are the ones an operator greps. Structured, request-correlated
 * and redacted — the Flask provisioning secret must never reach a log.
 */
const log = requestLogger({ flow: 'facturacion-provision' })

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
    log.warn('FLASK_BACKEND_URL or FLASK_PROVISION_SECRET not configured — cannot provision')
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
        signal: AbortSignal.timeout(FLASK_BACKEND_TIMEOUT_MS),
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
        log.info('Provisioned', { subscriptionId, targetStatus, flaskTenantId: data.tenantId })
        return { success: true, flaskTenantId: data.tenantId }
      }

      log.warn('Provisioning attempt failed', { subscriptionId, attempt, maxRetries, httpStatus: res.status })
    } catch (err) {
      log.error('Provisioning attempt errored', { subscriptionId, attempt, maxRetries, err })
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  log.error('Provisioning FAILED — manual provisioning required', { subscriptionId, maxRetries })
  return { success: false }
}
