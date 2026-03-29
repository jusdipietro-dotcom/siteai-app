'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch, Shield, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Mail, CheckCircle2,
  RefreshCw, ChevronDown, ChevronUp, Search, Filter, Lock, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    price: 10000,
    features: ['Hasta 30 causas monitoreadas', 'Sincronizacion diaria', 'Vista de movimientos', 'Busqueda por caratula', 'Estados de expedientes'],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 22000,
    popular: true,
    features: ['Hasta 100 causas monitoreadas', 'Sincronizacion cada 6 horas', 'Vista de movimientos', 'Alertas por email (nuevos movimientos)', 'Exportar datos (CSV/PDF)', 'Busqueda por caratula', 'Soporte prioritario'],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 45000,
    features: ['Causas ilimitadas', 'Sincronizacion cada 2 horas', 'Vista de movimientos + texto completo', 'Alertas por email (nuevos movimientos)', 'Exportar datos (CSV/PDF)', 'Busqueda avanzada', 'Soporte dedicado'],
  },
]

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

type Step = 'plan' | 'datos' | 'coupon' | 'payment' | 'done'

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

export default function CausasPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <CausasPage />
    </Suspense>
  )
}

function CausasPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [mevUser, setMevUser] = useState('')
  const [mevPass, setMevPass] = useState('')
  const [dptoId, setDptoId] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  const fetchSubscriptions = () => {
    fetch('/api/causas/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])
  useEffect(() => {
    if (mpReturn) fetchSubscriptions()
  }, [mpReturn])

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

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/causas/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = await res.json()
      setCouponValid(data)
      if (data.valid) {
        toast.success(`Cupon valido: ${data.discount}% de descuento`)
      } else {
        toast.error(data.error ?? 'Cupon invalido')
      }
    } catch {
      toast.error('Error al validar cupon')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const dpto = DEPARTAMENTOS.find(d => d.id === dptoId)
      const subRes = await fetch('/api/causas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          mevUser,
          mevPass,
          dptoId,
          dptoNombre: dpto?.nombre || '',
          dptoTipo: 'CC',
          notificationEmail,
          payerEmail,
          couponCode: couponValid?.valid ? couponCode : undefined,
        }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) {
        toast.error(subData.error)
        setLoading(false)
        return
      }

      // Check if trial or free — skip payment
      if (subData.nextStep === 'trial_started' || subData.nextStep === 'done') {
        toast.success(subData.freeAccount ? 'Servicio activado!' : 'Trial de 3 dias activado!')
        fetchSubscriptions()
        setStep('plan')
        return
      }

      const mpRes = await fetch('/api/mp/create-causas-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subData.subscriptionId,
          payerEmail: payerEmail || session?.user?.email,
        }),
      })
      const mpData = await mpRes.json()
      if (!mpRes.ok) {
        toast.error(mpData.error ?? 'Error al crear el pago')
        setLoading(false)
        return
      }

      window.location.href = mpData.init_point
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
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

  const planConfig = PLANS.find(p => p.id === selectedPlan)
  const discount = couponValid?.valid ? couponValid.discount : 0
  const finalPrice = planConfig ? Math.round(planConfig.price * (1 - discount / 100)) : 0

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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                          <p className="text-xs text-blue-600">
                            Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setStep('plan')}>
                          Suscribirse
                        </Button>
                      </div>
                    </div>
                  )}
                  {sub.status === 'trial_expired' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                          <p className="text-xs text-orange-600">Suscribite para seguir usando el servicio</p>
                        </div>
                        <Button size="sm" onClick={() => setStep('plan')}>
                          Elegir plan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wizard: only show if no active subscription */}
      {!loadingSubs && !activeSub && (
        <AnimatePresence mode="wait">
          {/* STEP: Plan selection */}
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-semibold text-surface-800 mb-4">Elegir plan</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan.id); setStep('datos') }}
                    className={`relative rounded-2xl border p-6 text-left transition-all hover:shadow-md ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                        : 'border-surface-200 bg-white hover:border-surface-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-3 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <p className="font-semibold text-surface-900">{plan.name}</p>
                    <p className="text-2xl font-bold text-surface-900 mt-2">
                      ${plan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-surface-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <span className="w-full inline-flex justify-center py-2 rounded-xl text-sm font-medium bg-blue-600 text-white">
                        Elegir plan
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: Datos MEV */}
          {step === 'datos' && (
            <motion.div key="datos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('plan')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver a planes
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Datos de acceso MEV</h2>
                <p className="text-sm text-surface-500 mb-6">Ingresa tus credenciales de la Mesa de Entradas Virtual (mev.scba.gov.ar).</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Usuario MEV</label>
                    <input
                      type="text"
                      value={mevUser}
                      onChange={e => setMevUser(e.target.value)}
                      placeholder="Tu usuario de mev.scba.gov.ar"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Contrasena MEV</label>
                    <input
                      type="password"
                      value={mevPass}
                      onChange={e => setMevPass(e.target.value)}
                      placeholder="Tu contrasena de MEV"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Departamento judicial</label>
                    <select
                      value={dptoId}
                      onChange={e => setDptoId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      <option value="">Seleccionar departamento</option>
                      {DEPARTAMENTOS.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">Tus credenciales se encriptan con AES-256-GCM y nunca se almacenan en texto plano. Solo se usan para sincronizar tus causas automaticamente.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Email de notificaciones</label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Email de facturacion</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <Button
                    onClick={() => setStep('coupon')}
                    disabled={!mevUser || !mevPass || !dptoId || !notificationEmail || !payerEmail}
                    className="w-full"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Coupon */}
          {step === 'coupon' && (
            <motion.div key="coupon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('datos')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Cupon de descuento</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenes un cupon de descuento, ingresalo aca. Si no, podes continuar directamente.</p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CUPON2025"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase"
                    />
                    <Button variant="outline" onClick={validateCoupon} disabled={loading || !couponCode.trim()}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                    </Button>
                  </div>

                  {couponValid?.valid && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {couponValid.discount}% de descuento aplicado
                    </div>
                  )}

                  {/* Price summary */}
                  {planConfig && (
                    <div className="rounded-xl border border-surface-100 bg-surface-50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-600">Plan {planConfig.name}</span>
                        <span className="text-surface-900 font-medium">${planConfig.price.toLocaleString('es-AR')}/mes</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-emerald-600">Descuento ({discount}%)</span>
                          <span className="text-emerald-600">-${Math.round(planConfig.price * discount / 100).toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-surface-200">
                        <span className="font-semibold text-surface-900">Total</span>
                        <span className="font-bold text-surface-900">${finalPrice.toLocaleString('es-AR')}/mes</span>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
                    ) : (
                      <>Ir a pagar — ${finalPrice.toLocaleString('es-AR')}/mes <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Done (after MP return) */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Pago procesado</h2>
                <p className="text-surface-500 text-sm mb-6">
                  Tu suscripcion se esta activando. La primera sincronizacion de causas puede tardar unos minutos.
                  Te notificaremos por email cuando este lista.
                </p>
                <Button onClick={() => { setStep('plan'); fetchSubscriptions() }}>
                  Ver mis suscripciones
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
