import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { deleteProjectWithBilling } from '@/lib/project-delete'

/**
 * DELETE /api/admin/projects/[id] — an admin removes any customer's site.
 *
 * The deletion itself is the same billing-safe path the owner route uses
 * (cancel the MercadoPago subscription first, abort if MP cannot confirm it),
 * so an admin can never accidentally leave a card billing a deleted site. The
 * only difference from the owner route is the gate: requireAdmin instead of an
 * ownership check.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const result = await deleteProjectWithBilling(params.id)
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 502 })
  return NextResponse.json({ deleted: true })
}
