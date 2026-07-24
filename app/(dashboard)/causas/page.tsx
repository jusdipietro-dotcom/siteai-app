'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch, Shield, Check, Loader2, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Search, Lock, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

const DEPARTAMENTOS = [
  { id: '1', nombre: 'Azul' },
  { id: '2', nombre: 'Bahia Blanca' },
  { id: '3', nombre: 'Dolores' },
  { id: '4', nombre: 'Junin' },
  { id: '5', nombre: 'La Matanza' },
  { id: '6', nombre: 'La Plata' },
  { id: '7', nombre: 'Lomas de Zamora' },
  { id: '8', nombre: 'Mar del Plata' },
  { id: '9', nombre: 'Mercedes' },
  { id: '10', nombre: 'Moron' },
  { id: '11', nombre: 'Necochea' },
  { id: '12', nombre: 'Pergamino' },
  { id: '13', nombre: 'Quilmes' },
  { id: '14', nombre: 'San Isidro' },
  { id: '15', nombre: 'San Martin' },
  { id: '16', nombre: 'San Nicolas' },
  { id: '17', nombre: 'Trenque Lauquen' },
  { id: '18', nombre: 'Zarate-Campana' },
  { id: '19', nombre: 'Moreno-General Rodriguez' },
  { id: '20', nombre: 'Avellaneda-Lanus' },
  { id: '21', nombre: 'Florencio Varela' },
  { id: '22', nombre: 'Ituzaingo' },
  { id: '23', nombre: 'Quilmes (alt)' },
]

type Movement = {
  fecha: string
  fojas: string
  descripcion: string
  proveido_url?: string
  texto?: string
}

type CausasCase = {
  id: string
  caratula: string
  nroExpediente: string
  estado: string
  courtName: string
  setName: string
  totalMovimientos: number
  scrapedAt: string
  movimientos: Movement[]
}

type Subscription = {
  id: string
  status: string
  plan: string
  dptoNombre: string
  dptoId: string
  scrapeFrequency: string
  notificationEmail: string
  totalCausas: number
  lastScrapeAt: string | null
  provisionedAt: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function CausasPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Cases state
  const [cases, setCases] = useState<CausasCase[]>([])
  const [casesTotal, setCasesTotal] = useState(0)
  const [casesPage, setCasesPage] = useState(1)
  const [casesSearch, setCasesSearch] = useState('')
  const [casesEstado, setCasesEstado] = useState('')
  const [estados, setEstados] = useState<{ estado: string; count: number }[]>([])
  const [loadingCases, setLoadingCases] = useState(false)
  const [expandedCase, setExpandedCase] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [lastScrapeAt, setLastScrapeAt] = useState<string | null>(null)

  const fetchSubscriptions = () => {
    fetch('/api/causas/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])

  // Fetch cases when active subscription exists
  const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'provisioning')
  const pendingConfigSub = subscriptions.find(s => s.status === 'pending_config')

  const fetchCases = (page = 1) => {
    if (!activeSub) return
    setLoadingCases(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(casesSearch && { search: casesSearch }),
      ...(casesEstado && { estado: casesEstado }),
    })
    fetch(`/api/causas/data?${params}`)
      .then(r => r.json())
      .then(data => {
        setCases(data.cases ?? [])
        setCasesTotal(data.total ?? 0)
        setEstados(data.estados ?? [])
        setLastScrapeAt(data.lastScrapeAt ?? null)
      })
      .catch(() => toast.error('Error al cargar causas'))
      .finally(() => setLoadingCases(false))
  }

  useEffect(() => {
    if (activeSub?.status === 'active') {
      fetchCases(casesPage)
    }
  }, [activeSub?.id, casesPage, casesSearch, casesEstado])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/causas/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Sincronizacion iniciada')
      } else {
        toast.error(data.error || 'Error al sincronizar')
      }
    } catch {
      toast.error('Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar esta suscripcion? Se desactivara tu acceso al dashboard de causas.')) return
    try {
      const res = await fetch('/api/causas/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suscripcion cancelada')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al cancelar')
      }
    } catch {
      toast.error('Error al cancelar')
    }
  }

  // --- pending_config state (Suite Juridica flow) ---
  const [cfgMevUser, setCfgMevUser] = useState('')
  const [cfgMevPass, setCfgMevPass] = useState('')
  const [cfgDptoId, setCfgDptoId] = useState('')
  const [configuring, setConfiguring] = useState(false)

  const handleConfigure = async (subId: string) => {
    if (!cfgMevUser || !cfgMevPass || !cfgDptoId) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setConfiguring(true)
    try {
      const dpto = DEPARTAMENTOS.find(d => d.id === cfgDptoId)
      const res = await fetch('/api/causas/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subId,
          mevUser: cfgMevUser,
          mevPass: cfgMevPass,
          dptoId: cfgDptoId,
          dptoNombre: dpto?.nombre || '',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Configuracion guardada. Activando servicio...')
        fetchSubscriptions()
      } else {
        toast.error(data.error ?? 'Error al configurar')
      }
    } catch {
      toast.error('Error al configurar')
    } finally {
      setConfiguring(false)
    }
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_config: { text: 'Pendiente de configuracion', color: 'bg-orange-100 text-orange-800' },
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando (hasta 24hs)', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  const estadoColors: Record<string, string> = {
    'En Letra': 'bg-blue-100 text-blue-800',
    'A Despacho': 'bg-yellow-100 text-yellow-800',
    'Paralizadas': 'bg-red-100 text-red-800',
    'Archivada': 'bg-surface-100 text-surface-600',
    'SENTENCIA': 'bg-purple-100 text-purple-800',
    'Fuera del Organismo': 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard de Causas MEV</h1>
        <p className="text-surface-500 mt-1">Monitoreá todas tus causas judiciales de la Mesa de Entradas Virtual (SCBA) en un solo lugar.</p>
      </div>

      {/* Loading subscriptions */}
      {loadingSubs && (
        <div className="mb-10 flex items-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando suscripciones...</span>
        </div>
      )}

      {/* Pending configuration (Suite Juridica flow) */}
      {!loadingSubs && pendingConfigSub && (
        <div className="mb-10">
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 overflow-hidden">
            <div className="p-4 border-b border-orange-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 text-sm">Configurar Dashboard de Causas MEV</h3>
                <p className="text-xs text-surface-500">
                  Plan {pendingConfigSub.plan} — Ingresa tus credenciales de la Mesa de Entradas Virtual para activar el servicio.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4 max-w-lg">
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  Tus credenciales se encriptan con AES-256-GCM y nunca se almacenan en texto plano.
                </p>
              </div>
              <div>
                <label htmlFor="cfg-mev-user" className="block text-sm font-medium text-surface-700 mb-1">Usuario MEV *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    id="cfg-mev-user"
                    type="text"
                    autoComplete="off"
                    value={cfgMevUser}
                    onChange={e => setCfgMevUser(e.target.value)}
                    placeholder="usuario@notificaciones.scba.gov.ar"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cfg-mev-pass" className="block text-sm font-medium text-surface-700 mb-1">Contrasena MEV *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    id="cfg-mev-pass"
                    type="password"
                    autoComplete="off"
                    value={cfgMevPass}
                    onChange={e => setCfgMevPass(e.target.value)}
                    placeholder="Contrasena de la MEV"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cfg-dpto" className="block text-sm font-medium text-surface-700 mb-1">Departamento Judicial *</label>
                <select
                  id="cfg-dpto"
                  value={cfgDptoId}
                  onChange={e => setCfgDptoId(e.target.value)}
                  title="Seleccionar departamento judicial"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                >
                  <option value="">Seleccionar departamento...</option>
                  {DEPARTAMENTOS.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <Button
                onClick={() => handleConfigure(pendingConfigSub.id)}
                disabled={configuring || !cfgMevUser || !cfgMevPass || !cfgDptoId}
                className="gap-1.5"
              >
                {configuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activar Dashboard de Causas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active subscription: show cases dashboard */}
      {activeSub?.status === 'active' && (
        <div className="mb-10">
          {/* Subscription info bar */}
          <div className="rounded-2xl border border-surface-100 bg-white p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm">
                  Plan {activeSub.plan} — Dpto. {activeSub.dptoNombre || activeSub.dptoId}
                </p>
                <p className="text-xs text-surface-400">
                  {activeSub.totalCausas} causas — Sync {activeSub.scrapeFrequency}
                  {lastScrapeAt && ` — Ultima: ${new Date(lastScrapeAt).toLocaleString('es-AR')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCancel(activeSub.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Search & filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Buscar por caratula, expediente o juzgado..."
                value={casesSearch}
                onChange={e => { setCasesSearch(e.target.value); setCasesPage(1) }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={casesEstado}
              onChange={e => { setCasesEstado(e.target.value); setCasesPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">Todos los estados</option>
              {estados.map(e => (
                <option key={e.estado} value={e.estado}>{e.estado} ({e.count})</option>
              ))}
            </select>
          </div>

          {/* Cases table */}
          {loadingCases ? (
            <div className="flex items-center gap-3 text-surface-500 py-10 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando causas...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-16 text-surface-400">
              <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{casesSearch || casesEstado ? 'No se encontraron causas con ese filtro' : 'Aun no hay causas. La primera sincronizacion puede tardar unos minutos.'}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                {cases.map((c, idx) => (
                  <div key={c.id} className={idx > 0 ? 'border-t border-surface-50' : ''}>
                    <button
                      onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                      className="w-full text-left p-4 hover:bg-surface-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-surface-900 text-sm truncate">{c.caratula}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
                            <span>{c.nroExpediente}</span>
                            <span>{c.courtName}</span>
                            <span>{c.totalMovimientos} mov.</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColors[c.estado] || 'bg-surface-100 text-surface-600'}`}>
                            {c.estado || 'Sin estado'}
                          </span>
                          {expandedCase === c.id ? (
                            <ChevronUp className="w-4 h-4 text-surface-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-surface-400" />
                          )}
                        </div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedCase === c.id && c.movimientos.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <div className="bg-surface-50 rounded-xl overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-surface-100">
                                    <th className="text-left px-3 py-2 font-medium text-surface-500">Fecha</th>
                                    <th className="text-left px-3 py-2 font-medium text-surface-500">Fojas</th>
                                    <th className="text-left px-3 py-2 font-medium text-surface-500">Descripcion</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.movimientos.slice(0, 20).map((m, i) => (
                                    <tr key={i} className={i > 0 ? 'border-t border-surface-100/50' : ''}>
                                      <td className="px-3 py-2 text-surface-600 whitespace-nowrap">{m.fecha}</td>
                                      <td className="px-3 py-2 text-surface-500">{m.fojas || '-'}</td>
                                      <td className="px-3 py-2 text-surface-700">{m.descripcion}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {casesTotal > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-surface-400">
                    Mostrando {(casesPage - 1) * 20 + 1}-{Math.min(casesPage * 20, casesTotal)} de {casesTotal}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={casesPage <= 1}
                      onClick={() => setCasesPage(p => p - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={casesPage * 20 >= casesTotal}
                      onClick={() => setCasesPage(p => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Existing subscriptions list (non-active) */}
      {!loadingSubs && subscriptions.filter(s => s.status !== 'active').length > 0 && !activeSub && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FileSearch className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">
                          Plan {sub.plan} — Dpto. {sub.dptoNombre || sub.dptoId}
                        </p>
                        <p className="text-xs text-surface-400">
                          Desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                  {/* Trial banners */}
                  {sub.status === 'trial' && sub.trialEndsAt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                      <p className="text-xs text-blue-600">
                        Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {sub.status === 'trial_expired' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                      <p className="text-xs text-orange-600">Escribinos por WhatsApp para seguir usando el servicio.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sign-up: request personalised implementation via WhatsApp (only if no active subscription) */}
      {!loadingSubs && !activeSub && (
        <WhatsAppServiceCTA slug="causas" showHeading={false} />
      )}
    </div>
  )
}
