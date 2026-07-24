'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, Linkedin, Scale, Star, TrendingUp, Users, Send, Target, Receipt,
  FileSearch, CalendarDays, Briefcase, FileText, Globe, KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ADMIN_PRODUCTS,
  type AdminProductId,
  type AdminSubscriptionRow,
  type AdminSubscriptionsResponse,
} from '@/lib/admin-products'

/**
 * All thirteen products, one table.
 *
 * The previous version hard-coded three tabs with three bespoke tables and
 * three response keys, which is exactly why the other ten stayed invisible for
 * as long as they did. The row shape is uniform now (see AdminSubscriptionRow),
 * so a fourteenth product is one entry in ADMIN_PRODUCTS and nothing here.
 *
 * Rows are fetched one product at a time. Loading thirteen tables to show one
 * is what the API used to do, and it does not scale past a handful of customers.
 */

const PRODUCT_ICONS: Record<AdminProductId, typeof Scale> = {
  monitoreo: Scale,
  resenas: Star,
  linkedin: Linkedin,
  crypto: TrendingUp,
  leads: Users,
  'email-marketing': Send,
  prospeccion: Target,
  facturacion: Receipt,
  causas: FileSearch,
  turnos: CalendarDays,
  'suite-juridica': Briefcase,
  lexpost: FileText,
  sitios: Globe,
}

const statusStyles: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  trial: 'bg-sky-100 text-sky-800',
  trial_expired: 'bg-orange-100 text-orange-800',
  active: 'bg-emerald-100 text-emerald-800',
  provisioning: 'bg-blue-100 text-blue-800',
  grace: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-surface-100 text-surface-600',
}

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente pago',
  trial: 'Prueba',
  trial_expired: 'Prueba vencida',
  active: 'Activo',
  provisioning: 'Activando',
  grace: 'En gracia',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

const emptyCounts = Object.fromEntries(
  ADMIN_PRODUCTS.map((p) => [p.id, 0])
) as Record<AdminProductId, number>

// Fechas siempre en hora de Buenos Aires, sin depender de la zona del navegador
// ni del contenedor (que corre en UTC): una baja de las 22:00 ART no debe
// mostrarse con la fecha del día siguiente por el desfase con UTC.
const BA_TZ = 'America/Argentina/Buenos_Aires'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { timeZone: BA_TZ })
}

export default function AdminSubscriptionsClient() {
  const [counts, setCounts] = useState<Record<AdminProductId, number>>(emptyCounts)
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<AdminProductId>(ADMIN_PRODUCTS[0].id)

  const load = useCallback(async (id: AdminProductId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?product=${id}`)
      if (res.status === 403) {
        toast.error('Sin permisos de admin')
        setRows([])
        return
      }
      const data: AdminSubscriptionsResponse = await res.json()
      setCounts(data.counts ?? emptyCounts)
      setRows(data.rows ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Error al cargar suscripciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(product)
  }, [load, product])

  const grandTotal = ADMIN_PRODUCTS.reduce((sum, p) => sum + (counts[p.id] ?? 0), 0)
  const activeInView = rows.filter((r) => r.status === 'active').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Suscripciones</h1>
        <p className="text-surface-500 text-sm mt-1">
          Los {ADMIN_PRODUCTS.length} productos. Se carga uno por vez: los contadores de cada pestaña son el
          total real, la tabla muestra la primera página.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-4">
          <p className="text-xs text-surface-500 font-medium">Total (todos los productos)</p>
          <p className="text-2xl font-bold text-surface-900">{grandTotal}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-4">
          <p className="text-xs text-surface-500 font-medium">En este producto</p>
          <p className="text-2xl font-bold text-surface-900">{total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-4">
          <p className="text-xs text-surface-500 font-medium">Activas en pantalla</p>
          <p className="text-2xl font-bold text-emerald-600">{activeInView}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-4">
          <p className="text-xs text-surface-500 font-medium">Filas mostradas</p>
          <p className="text-2xl font-bold text-surface-900">
            {rows.length}
            <span className="text-sm font-normal text-surface-400"> de {total}</span>
          </p>
        </div>
      </div>

      {/* Tabs — one per product, wrapping. */}
      <div className="flex flex-wrap gap-1 border-b border-surface-200 mb-6">
        {ADMIN_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICONS[p.id]
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProduct(p.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                product === p.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
              <span className="ml-1 text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded-full">
                {counts[p.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50">
                <th className="text-left py-3 px-4 font-medium text-surface-500">Usuario</th>
                <th className="text-left py-3 px-4 font-medium text-surface-500">Detalle</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Uso</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Cupón</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Alta</th>
                <th className="text-center py-3 px-4 font-medium text-surface-500">Bajas</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-surface-400">
                    Sin suscripciones
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-50 hover:bg-surface-25">
                  <td className="py-3 px-4">
                    <p className="font-medium text-surface-900">{row.user.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-surface-400">{row.user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-surface-800 flex items-center gap-1.5">
                      {row.title ?? '—'}
                      {/* Only the two products that store credentials show this.
                          `null` means the product has none to store, which is
                          different from having none on file. */}
                      {row.hasCredentials !== null && (
                        <span
                          title={row.hasCredentials ? 'Credenciales guardadas' : 'Sin credenciales'}
                          className={row.hasCredentials ? 'text-emerald-600' : 'text-surface-300'}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </p>
                    {row.subtitle && <p className="text-xs text-surface-400">{row.subtitle}</p>}
                  </td>
                  <td className="py-3 px-4 text-center capitalize font-medium">{row.plan}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[row.status] ?? 'bg-surface-100 text-surface-600'}`}
                    >
                      {statusLabels[row.status] ?? row.status}
                    </span>
                    {/* Shown only when the stored column disagrees with the
                        status we act on — an expired trial the batch job never
                        wrote back. Hiding it would make the panel and the
                        database look consistent when they are not. */}
                    {row.storedStatus && (
                      <p className="text-[10px] text-surface-400 mt-0.5">en base: {row.storedStatus}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">{row.metric ?? '—'}</td>
                  <td className="py-3 px-4 text-center">
                    {row.couponCode ? (
                      <span className="text-xs font-mono text-brand-600">
                        {row.couponCode} (-{row.couponDiscount}%)
                      </span>
                    ) : row.discountApplied > 0 ? (
                      <span className="text-xs text-surface-500">-{row.discountApplied}%</span>
                    ) : (
                      <span className="text-xs text-surface-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">{formatDate(row.createdAt)}</td>
                  <td className="py-3 px-4 text-center text-xs text-surface-500">
                    {row.cancelledAt
                      ? <span className="text-red-500">{formatDate(row.cancelledAt)}</span>
                      : <span className="text-surface-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length < total && (
        <p className="mt-3 text-xs text-surface-400">
          Mostrando las {rows.length} más recientes de {total}. La consulta está acotada a propósito: trece
          tablas sin límite no escalan.
        </p>
      )}
    </div>
  )
}
