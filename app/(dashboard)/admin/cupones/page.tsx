import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminCouponsClient from './Client'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  return <AdminCouponsClient />
}
