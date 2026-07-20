import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminSubscriptionsClient from './Client'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  return <AdminSubscriptionsClient />
}
