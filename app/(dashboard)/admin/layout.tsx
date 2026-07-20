import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'

/**
 * Server-side gate for every /admin/* route.
 *
 * 404 rather than 403 on purpose: a 403 confirms the route exists, which tells
 * a probing non-admin exactly where the panel lives. To a non-admin, /admin is
 * indistinguishable from a typo.
 *
 * Each admin page repeats this check. That is deliberate redundancy, not an
 * oversight — a layout is not a reliable authorization boundary on its own, and
 * every underlying /api/admin/* route re-checks independently as well.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  if (!session) notFound()

  return <>{children}</>
}
