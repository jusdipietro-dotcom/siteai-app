import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminFreeAccountsClient from './Client'

export const dynamic = 'force-dynamic'

export default async function AdminFreeAccountsPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  return <AdminFreeAccountsClient />
}
