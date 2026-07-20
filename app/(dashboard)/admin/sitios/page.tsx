import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminSitesClient from './Client'

export const dynamic = 'force-dynamic'

export default async function AdminSitesPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  return <AdminSitesClient />
}
