import { prisma } from './prisma'
import { cancelPreapproval } from './mp-preapproval'

export interface DeleteProjectResult {
  ok: boolean
  /** Present only when ok is false — a message safe to show the caller. */
  reason?: string
}

/**
 * Deletes a website project, cancelling its MercadoPago subscription FIRST.
 *
 * The order is the whole point. If the project carries a live preapproval, it
 * is cancelled at MercadoPago before the row is deleted. Deleting first would
 * orphan a subscription that keeps charging the customer for a site that no
 * longer exists — the same failure the account-deletion flow guards against,
 * now guarded here too. If MercadoPago cannot confirm the cancellation, this
 * aborts and deletes NOTHING, so a card is never left billing a deleted site.
 * `cancelPreapproval` treats an already-cancelled preapproval as success, so a
 * project whose subscription the owner already stopped still deletes cleanly.
 *
 * What is NOT touched, deliberately:
 *  - SiteLead rows cascade away (schema `onDelete: Cascade`).
 *  - Uploaded images are left alone. `Media` is owned by the user and can be
 *    reused across their projects, so a per-project delete must not remove files
 *    another of their sites may still reference. Orphaned files are the account
 *    purge's job, not this one's.
 *
 * Callers own authorization: the owner route checks ownership, the admin route
 * checks admin. This function assumes the decision to delete was already made.
 */
export async function deleteProjectWithBilling(projectId: string): Promise<DeleteProjectResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, preapprovalId: true },
  })
  if (!project) return { ok: false, reason: 'Proyecto no encontrado' }

  if (project.preapprovalId) {
    const cancel = await cancelPreapproval(project.preapprovalId)
    if (!cancel.ok) {
      return {
        ok: false,
        reason:
          'No se pudo cancelar la suscripción en MercadoPago, así que el sitio no se borró (para no dejar un cobro activo sin sitio). Probá de nuevo en un momento.',
      }
    }
  }

  await prisma.project.delete({ where: { id: projectId } })
  return { ok: true }
}
