'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Search, Loader2, Gift, RotateCcw, ExternalLink, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'

type AdminProject = {
  id: string
  name: string
  slug: string
  subdomain: string | null
  status: string
  plan: string
  hasPaid: boolean
  billingStatus: string
  graceUntil: string | null
  suspendedAt: string | null
  suspendedReason: string | null
  grantedBy: string | null
  grantedAt: string | null
  couponRedeemedAt: string | null
  coupon: { id: string; code: string; discount: number } | null
  createdAt: string
  user: { id: string; email: string; name: string | null }
}

const FILTERS = [
  { value: 'all',       label: 'Todos' },
  { value: 'paid',      label: 'Pagos' },
  { value: 'gifted',    label: 'Regalados' },
  { value: 'coupon',    label: 'Con cupón' },
  { value: 'free',      label: 'Gratuitos' },
  { value: 'suspended', label: 'Suspendidos' },
]

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'

function BillingBadge({ p }: { p: AdminProject }) {
  const tone =
    p.billingStatus === 'suspended' ? 'bg-red-100 text-red-700'
    : p.billingStatus === 'grace'   ? 'bg-amber-100 text-amber-700'
    : 'bg-emerald-100 text-emerald-700'

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tone}`}>
      {p.billingStatus}
    </span>
  )
}

/**
 * Why this site is paid — the question `hasPaid` on its own cannot answer.
 *
 * Three provenances, read from three independent sources so they never collide:
 *   grantedBy/grantedAt   → an admin comped it from this panel;
 *   coupon/couponRedeemedAt → the owner redeemed a 100% coupon at checkout;
 *   neither, but hasPaid  → a real MercadoPago sale.
 *
 * Both badges can appear at once (a site that redeemed a coupon and was later
 * also gifted). Showing both is the honest reading — collapsing them would pick
 * a winner arbitrarily.
 */
function OriginCell({ p }: { p: AdminProject }) {
  const gifted = !!p.grantedAt
  const couponed = !!p.coupon

  if (!gifted && !couponed) {
    return p.hasPaid ? (
      <span className="text-xs text-surface-500">Venta</span>
    ) : (
      <span className="text-xs text-surface-300">-</span>
    )
  }

  return (
    <div className="space-y-1">
      {gifted && (
        <div className="flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <div>
            <p className="text-xs text-violet-700 font-medium">{fmtDate(p.grantedAt)}</p>
            <p className="text-[10px] text-surface-400">{p.grantedBy}</p>
          </div>
        </div>
      )}
      {couponed && (
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-brand-500 shrink-0" />
          <div>
            <p className="text-xs font-mono font-medium text-brand-700">{p.coupon!.code}</p>
            <p className="text-[10px] text-surface-400">
              {p.coupon!.discount}% · {fmtDate(p.couponRedeemedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSitesClient() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ project: AdminProject; action: 'gift' | 'revoke' } | null>(null)

  const fetchProjects = useCallback(async (q: string, f: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter: f })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/projects?${params}`)
      if (!res.ok) {
        toast.error(res.status === 403 ? 'No tenés permisos de administrador' : 'Error al cargar sitios')
        return
      }
      const data = await res.json()
      setProjects(data.projects ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced so typing an email does not fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { fetchProjects(search, filter) }, 300)
    return () => clearTimeout(t)
  }, [search, filter, fetchProjects])

  const runAction = async () => {
    if (!confirm) return
    const { project, action } = confirm
    setConfirm(null)
    setPendingId(project.id)
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/gift`, {
        method: action === 'gift' ? 'POST' : 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al aplicar el cambio')
        return
      }
      // Patch the row in place — keeps scroll position and current filter.
      setProjects((prev) => prev.map((p) => (p.id === project.id ? data.project : p)))
      toast.success(
        action === 'gift'
          ? `Sitio "${project.name}" regalado a ${project.user.email}`
          : `Regalo removido de "${project.name}"`
      )
    } catch {
      toast.error('Error de conexión')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <Globe className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sitios</h1>
          <p className="text-sm text-surface-500">
            {total} {total === 1 ? 'sitio' : 'sitios'} en total
          </p>
        </div>
      </div>

      <p className="text-sm text-surface-500 mb-6 max-w-3xl">
        &ldquo;Regalar&rdquo; marca el sitio como pago (plan professional) y levanta cualquier
        suspensión. Queda registrado quién lo regaló y cuándo, así se distingue de una venta real.
        Regalar no publica el sitio: el dueño sigue teniendo que publicarlo.
      </p>
      <p className="text-sm text-surface-500 mb-6 max-w-3xl">
        La columna <span className="font-medium">Origen</span> muestra por qué el sitio está pago:
        regalo del panel, cupón de acceso gratuito canjeado por el dueño en el checkout, o{' '}
        <span className="font-medium">Venta</span> cuando es una suscripción real de MercadoPago.
        Quitar el regalo no borra el canje del cupón: el uso ya se consumió y queda como registro.
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email del dueño, nombre, slug o subdominio..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`h-10 px-3 rounded-xl text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-surface-200 mx-auto mb-3" />
            <p className="text-surface-500">No se encontraron sitios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Dueño</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Sitio</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Plan</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Pago</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Facturación</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-500">Origen</th>
                  <th className="text-center py-3 px-4 font-medium text-surface-500">Creado</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-25">
                    <td className="py-3 px-4">
                      <p className="font-medium text-surface-900">{p.user.name ?? 'Sin nombre'}</p>
                      <p className="text-xs text-surface-500">{p.user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-surface-900">{p.name}</p>
                      <p className="text-xs text-surface-500 font-mono flex items-center gap-1">
                        {p.subdomain ? `${p.subdomain}.sitios` : `/${p.slug}`}
                        {p.status === 'published' && (
                          <ExternalLink className="w-3 h-3 text-surface-300" />
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === 'published' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-surface-600">{p.plan}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.hasPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-500'
                      }`}>
                        {p.hasPaid ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <BillingBadge p={p} />
                      {p.graceUntil && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          hasta {fmtDate(p.graceUntil)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <OriginCell p={p} />
                    </td>
                    <td className="py-3 px-4 text-center text-surface-500 text-xs">
                      {fmtDate(p.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pendingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-surface-400 inline" />
                      ) : p.grantedAt || p.hasPaid ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirm({ project: p, action: 'revoke' })}
                          className="gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Quitar regalo
                        </Button>
                      ) : (
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={() => setConfirm({ project: p, action: 'gift' })}
                          className="gap-1.5"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Regalar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => { if (!open) setConfirm(null) }}
        title={confirm?.action === 'gift' ? 'Regalar sitio' : 'Quitar regalo'}
        description={
          confirm?.action === 'gift'
            ? `El sitio "${confirm?.project.name}" de ${confirm?.project.user.email} va a quedar como pago (plan professional) y se va a levantar cualquier suspensión.`
            : `El sitio "${confirm?.project.name}" de ${confirm?.project.user.email} vuelve a hasPaid=false y plan free. Si estaba publicado, sigue publicado.`
        }
        confirmLabel={confirm?.action === 'gift' ? 'Regalar' : 'Quitar regalo'}
        variant={confirm?.action === 'revoke' ? 'destructive' : 'default'}
        onConfirm={runAction}
      />
    </div>
  )
}
