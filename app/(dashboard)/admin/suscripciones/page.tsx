'use client'

import { useState, useEffect } from 'react'
import { Loader2, Linkedin, Scale, Star } from 'lucide-react'
import { toast } from 'sonner'

type MonitoringSub = {
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
  user: { id: string; name: string | null; email: string }
  coupon: { code: string; discount: number } | null
}

type LinkedInSub = {
  id: string
  status: string
  plan: string
  linkedinName: string | null
  industry: string
  audience: string
  telegramChatId: string | null
  postsGenerated: number
  postsPublished: number
  payerEmail: string
  discountApplied: number
  provisionedAt: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  coupon: { code: string; discount: number } | null
}

type ReviewsSub = {
  id: string
  status: string
  plan: string
  businessName: string
  businessType: string
  payerEmail: string
  discountApplied: number
  provisionedAt: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
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

type Tab = 'monitoreo' | 'linkedin' | 'resenas'

export default function AdminSubscriptionsPage() {
  const [monitoringSubs, setMonitoringSubs] = useState<MonitoringSub[]>([])
  const [linkedinSubs, setLinkedinSubs] = useState<LinkedInSub[]>([])
  const [reviewsSubs, setReviewsSubs] = useState<ReviewsSub[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('monitoreo')

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(r => {
        if (r.status === 403) { toast.error('Sin permisos de admin'); return { subscriptions: [], linkedin: [], reviews: [] } }
        return r.json()
      })
      .then(data => {
        setMonitoringSubs(data.subscriptions ?? [])
        setLinkedinSubs(data.linkedin ?? [])
        setReviewsSubs(data.reviews ?? [])
      })
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoading(false))
  }, [])

  const countActive = (subs: { status: string }[]) => subs.filter(s => s.status === 'active').length

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
        <h1 className="text-2xl font-bold text-surface-900">Suscripciones</h1>
        <p className="text-surface-500 text-sm mt-1">Todas las suscripciones de todos los servicios.</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: monitoringSubs.length + linkedinSubs.length + reviewsSubs.length, color: 'text-surface-900' },
          { label: 'Monitoreo activas', value: countActive(monitoringSubs), color: 'text-emerald-600' },
          { label: 'LinkedIn activas', value: countActive(linkedinSubs), color: 'text-blue-600' },
          { label: 'Resenas activas', value: countActive(reviewsSubs), color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs text-surface-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        {([
          { id: 'monitoreo' as Tab, label: 'Monitoreo Judicial', icon: Scale, count: monitoringSubs.length },
          { id: 'linkedin' as Tab, label: 'LinkedIn IA', icon: Linkedin, count: linkedinSubs.length },
          { id: 'resenas' as Tab, label: 'Resenas Google', icon: Star, count: reviewsSubs.length },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className="ml-1 text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Monitoreo table */}
      {tab === 'monitoreo' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left py-3 px-4 font-medium text-surface-500">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">CUIT</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Portal</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Cupon</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {monitoringSubs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-surface-400">Sin suscripciones</td></tr>
              )}
              {monitoringSubs.map(sub => (
                <tr key={sub.id} className="border-b border-surface-50 hover:bg-surface-25">
                  <td className="py-3 px-4">
                    <p className="font-medium text-surface-900">{sub.user.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-surface-400">{sub.user.email}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{sub.cuil}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{sub.portal}</span>
                  </td>
                  <td className="py-3 px-4 text-center capitalize font-medium">{sub.plan}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[sub.status] ?? ''}`}>
                      {statusLabels[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sub.coupon ? <span className="text-xs font-mono text-brand-600">{sub.coupon.code} (-{sub.coupon.discount}%)</span> : <span className="text-xs text-surface-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">{new Date(sub.createdAt).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LinkedIn table */}
      {tab === 'linkedin' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left py-3 px-4 font-medium text-surface-500">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">LinkedIn</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Posts</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Telegram</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Cupon</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {linkedinSubs.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-surface-400">Sin suscripciones</td></tr>
              )}
              {linkedinSubs.map(sub => (
                <tr key={sub.id} className="border-b border-surface-50 hover:bg-surface-25">
                  <td className="py-3 px-4">
                    <p className="font-medium text-surface-900">{sub.user.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-surface-400">{sub.user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{sub.linkedinName || '—'}</p>
                    <p className="text-xs text-surface-400">{sub.industry}</p>
                  </td>
                  <td className="py-3 px-4 text-center capitalize font-medium">{sub.plan}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[sub.status] ?? ''}`}>
                      {statusLabels[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs">{sub.postsGenerated}g / {sub.postsPublished}p</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">{sub.telegramChatId || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    {sub.coupon ? <span className="text-xs font-mono text-brand-600">{sub.coupon.code} (-{sub.coupon.discount}%)</span> : <span className="text-xs text-surface-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">{new Date(sub.createdAt).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reviews table */}
      {tab === 'resenas' && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left py-3 px-4 font-medium text-surface-500">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Negocio</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Cupon</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {reviewsSubs.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-surface-400">Sin suscripciones</td></tr>
              )}
              {reviewsSubs.map(sub => (
                <tr key={sub.id} className="border-b border-surface-50 hover:bg-surface-25">
                  <td className="py-3 px-4">
                    <p className="font-medium text-surface-900">{sub.user.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-surface-400">{sub.user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{sub.businessName}</p>
                    <p className="text-xs text-surface-400">{sub.businessType}</p>
                  </td>
                  <td className="py-3 px-4 text-center capitalize font-medium">{sub.plan}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[sub.status] ?? ''}`}>
                      {statusLabels[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sub.coupon ? <span className="text-xs font-mono text-brand-600">{sub.coupon.code} (-{sub.coupon.discount}%)</span> : <span className="text-xs text-surface-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">{new Date(sub.createdAt).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
