'use client'

import { useState, useEffect } from 'react'
import { Scale, Loader2, User, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type Subscription = {
  id: string
  status: string
  plan: string
  portal: string
  cuil: string
  payerEmail: string
  discountApplied: number
  hasCredentials: boolean
  provisionedAt: string | null
  n8nTenantId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string; createdAt: string }
  coupon: { code: string; discount: number } | null
}

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  active: 'bg-emerald-100 text-emerald-800',
  provisioning: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-surface-100 text-surface-600',
}

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente pago',
  active: 'Activo',
  provisioning: 'Activando',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(r => {
        if (r.status === 403) { toast.error('Sin permisos de admin'); return { subscriptions: [] } }
        return r.json()
      })
      .then(data => setSubs(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: subs.length,
    active: subs.filter(s => s.status === 'active').length,
    provisioning: subs.filter(s => s.status === 'provisioning').length,
    pending: subs.filter(s => s.status === 'pending_payment').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Suscripciones de monitoreo</h1>
        <p className="text-surface-500 text-sm mt-1">Registro de todos los usuarios con monitoreo judicial.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-900' },
          { label: 'Activas', value: stats.active, color: 'text-emerald-600' },
          { label: 'Activando', value: stats.provisioning, color: 'text-blue-600' },
          { label: 'Pendientes pago', value: stats.pending, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs text-surface-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th className="text-left py-3 px-4 font-medium text-surface-500">Usuario</th>
              <th className="text-left py-3 px-4 font-medium text-surface-500">CUIT</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Portal</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Cupón</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">No hay suscripciones registradas</td></tr>
            )}
            {subs.map(sub => (
              <tr key={sub.id} className="border-b border-surface-50 hover:bg-surface-25">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-surface-900">{sub.user.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-surface-400">{sub.user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs">{sub.cuil}</td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {sub.portal}
                  </span>
                </td>
                <td className="py-3 px-4 text-center capitalize font-medium">{sub.plan}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[sub.status] ?? ''}`}>
                    {statusLabels[sub.status] ?? sub.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {sub.coupon ? (
                    <span className="text-xs font-mono text-brand-600">{sub.coupon.code} (-{sub.coupon.discount}%)</span>
                  ) : (
                    <span className="text-xs text-surface-300">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-xs text-surface-500">
                  {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
