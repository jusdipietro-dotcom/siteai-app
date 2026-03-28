'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Shield, FileText, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Mail, CheckCircle2, ExternalLink,
  Building2, Hash, CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    price: 15000,
    features: ['1 punto de venta', 'Facturas B (hasta 50/mes)', 'PDF con QR reglamentario', 'CAE automatico (ARCA)', 'Gestion de clientes', 'Historial de comprobantes'],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 30000,
    popular: true,
    features: ['1 punto de venta', 'Facturas A + B (hasta 200/mes)', 'Notas de credito y debito', 'PDF con QR reglamentario', 'CAE automatico (ARCA)', 'Gestion de clientes', 'Historial de comprobantes', 'Soporte prioritario'],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 60000,
    features: ['Hasta 3 puntos de venta', 'Facturas A + B + C (ilimitadas)', 'Notas de credito y debito', 'PDF con QR reglamentario', 'CAE automatico (ARCA)', 'Gestion de clientes', 'Historial de comprobantes', 'Multi-usuario', 'Soporte dedicado'],
  },
]

const IVA_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'No Responsable',
]

type Step = 'plan' | 'datos' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  cuit: string
  razonSocial: string
  puntoVenta: number
  condicionIva: string
  notificationEmail: string
  payerEmail: string
  flaskTenantId: number | null
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function FacturacionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <FacturacionPage />
    </Suspense>
  )
}

function FacturacionPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [cuit, setCuit] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [puntoVenta, setPuntoVenta] = useState('1')
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Pre-fill emails from session
  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  // Fetch existing subscriptions
  const fetchSubscriptions = () => {
    fetch('/api/facturacion/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])
  useEffect(() => {
    if (mpReturn) fetchSubscriptions()
  }, [mpReturn])

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/facturacion/validate-coupon', {
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
      // Step 1: Create subscription
      const subRes = await fetch('/api/facturacion/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          cuit,
          razonSocial,
          puntoVenta,
          condicionIva,
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

      // Step 2: Create MercadoPago payment
      const mpRes = await fetch('/api/mp/create-facturacion-subscription', {
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

      // Redirect to MercadoPago
      window.location.href = mpData.init_point
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenFacturacion = async (sub: Subscription) => {
    setSsoLoading(true)
    try {
      const res = await fetch('/api/facturacion/sso-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al generar acceso')
        return
      }
      // Open Flask backend with SSO token
      const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'https://facturacion.automaticialab.com'
      window.open(`${flaskUrl}/auth/portal-login?token=${data.ssoToken}`, '_blank')
    } catch {
      toast.error('Error al acceder a facturacion')
    } finally {
      setSsoLoading(false)
    }
  }

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar esta suscripcion? Se desactivara tu acceso a facturacion.')) return
    try {
      const res = await fetch('/api/facturacion/cancel', {
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
  const [cfgCuit, setCfgCuit] = useState('')
  const [cfgRazonSocial, setCfgRazonSocial] = useState('')
  const [cfgPuntoVenta, setCfgPuntoVenta] = useState('1')
  const [cfgCondicionIva, setCfgCondicionIva] = useState('Responsable Inscripto')
  const [configuring, setConfiguring] = useState(false)

  const pendingConfigSub = subscriptions.find(s => s.status === 'pending_config')

  const handleConfigure = async (subId: string) => {
    if (!cfgCuit || !cfgRazonSocial || !cfgPuntoVenta) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setConfiguring(true)
    try {
      const res = await fetch('/api/facturacion/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subId,
          cuit: cfgCuit,
          razonSocial: cfgRazonSocial,
          puntoVenta: cfgPuntoVenta,
          condicionIva: cfgCondicionIva,
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
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Facturacion Electronica</h1>
        <p className="text-surface-500 mt-1">Emiti facturas electronicas con CAE automatico. Integrado con ARCA (ex-AFIP).</p>
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
                <h3 className="font-semibold text-surface-900 text-sm">Configurar Facturacion Electronica</h3>
                <p className="text-xs text-surface-500">
                  Plan {pendingConfigSub.plan} — Completa los datos para activar el servicio.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">CUIT *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={cfgCuit}
                    onChange={e => setCfgCuit(e.target.value)}
                    placeholder="20-12345678-9"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Razon Social *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={cfgRazonSocial}
                    onChange={e => setCfgRazonSocial(e.target.value)}
                    placeholder="Estudio Juridico Garcia & Asociados"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cfg-pv" className="block text-sm font-medium text-surface-700 mb-1">Punto de Venta *</label>
                  <input
                    id="cfg-pv"
                    type="number"
                    value={cfgPuntoVenta}
                    onChange={e => setCfgPuntoVenta(e.target.value)}
                    min="1"
                    max="99999"
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-iva" className="block text-sm font-medium text-surface-700 mb-1">Condicion IVA</label>
                  <select
                    id="cfg-iva"
                    value={cfgCondicionIva}
                    onChange={e => setCfgCondicionIva(e.target.value)}
                    title="Condicion ante el IVA"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  >
                    {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Button
                onClick={() => handleConfigure(pendingConfigSub.id)}
                disabled={configuring || !cfgCuit || !cfgRazonSocial || !cfgPuntoVenta}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {configuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activar Facturacion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing subscriptions */}
      {!loadingSubs && subscriptions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              const isActive = sub.status === 'active'
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">
                          {sub.razonSocial} — CUIT {sub.cuit}
                        </p>
                        <p className="text-xs text-surface-400">
                          Plan {sub.plan} — PV {sub.puntoVenta} — desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                  <div className="border-t border-surface-50 px-4 py-3 bg-surface-50/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Notificaciones: <span className="text-surface-700 font-medium">{sub.notificationEmail}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Facturacion: <span className="text-surface-700 font-medium">{sub.payerEmail}</span></span>
                    </div>
                    {sub.coupon && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupon {sub.coupon.code} ({sub.coupon.discount}% off)</span>
                      </div>
                    )}
                  </div>
                  {/* Action buttons */}
                  {(isActive || sub.status === 'provisioning') && (
                    <div className="border-t border-surface-50 px-4 py-3 flex items-center gap-3">
                      {isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenFacturacion(sub)}
                          disabled={ssoLoading}
                          className="gap-1.5"
                        >
                          {ssoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          Ir a Facturacion
                        </Button>
                      )}
                      {sub.status === 'provisioning' && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Configurando tu cuenta de facturacion...
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => handleCancel(sub.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wizard — only show if no active subscription or returning from MP */}
      {!loadingSubs && (
        <AnimatePresence mode="wait">
          {/* Step 1: Plan selection */}
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-semibold text-surface-800 mb-4">Elegir plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan.id); setStep('datos') }}
                    className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:border-emerald-400 hover:shadow-lg ${
                      selectedPlan === plan.id ? 'border-emerald-500 shadow-lg' : 'border-surface-100'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Popular
                      </span>
                    )}
                    <p className="text-lg font-bold text-surface-900">{plan.name}</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      ${plan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-surface-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-emerald-600 text-sm font-medium">
                      Elegir <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Business data */}
          {step === 'datos' && (
            <motion.div key="datos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-semibold text-surface-800 mb-4">Datos de facturacion</h2>
              <div className="max-w-lg mx-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">CUIT</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={cuit}
                      onChange={e => setCuit(e.target.value)}
                      placeholder="20-12345678-9"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Razon Social</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={e => setRazonSocial(e.target.value)}
                      placeholder="Estudio Juridico Garcia & Asociados"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Punto de Venta</label>
                    <input
                      type="number"
                      value={puntoVenta}
                      onChange={e => setPuntoVenta(e.target.value)}
                      min="1"
                      max="99999"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Condicion IVA</label>
                    <select
                      value={condicionIva}
                      onChange={e => setCondicionIva(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    >
                      {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Email de notificaciones</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Email de facturacion (MercadoPago)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-medium">Certificado digital ARCA</p>
                    <p>Una vez activada tu cuenta, vas a poder subir tu certificado digital (.crt y .key) desde el panel de facturacion. Esto es necesario para emitir comprobantes reales.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep('plan')} className="gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </Button>
                  <Button
                    onClick={() => setStep('coupon')}
                    disabled={!cuit || !razonSocial || !puntoVenta || !notificationEmail || !payerEmail}
                    className="gap-1.5 ml-auto"
                  >
                    Continuar <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Coupon */}
          {step === 'coupon' && (
            <motion.div key="coupon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <h2 className="text-lg font-semibold text-surface-800 mb-4">Cupon de descuento</h2>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                      placeholder="Codigo de cupon (opcional)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm uppercase"
                    />
                  </div>
                  <Button onClick={validateCoupon} disabled={loading || !couponCode.trim()} size="sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                  </Button>
                </div>
                {couponValid?.valid && (
                  <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Descuento del {couponValid.discount}% aplicado</span>
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-2xl border border-surface-100 p-5 mb-6">
                  <h3 className="font-medium text-surface-800 mb-3">Resumen</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Plan</span>
                      <span className="font-medium">{planConfig?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">CUIT</span>
                      <span className="font-medium">{cuit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Razon Social</span>
                      <span className="font-medium">{razonSocial}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Punto de Venta</span>
                      <span className="font-medium">{puntoVenta}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Descuento</span>
                        <span className="font-medium">-{discount}%</span>
                      </div>
                    )}
                    <div className="border-t border-surface-100 pt-2 flex justify-between">
                      <span className="font-semibold text-surface-800">Total mensual</span>
                      <span className="font-bold text-lg text-emerald-600">${finalPrice.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setStep('datos')} className="gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="gap-1.5 ml-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Pagar con MercadoPago
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Done (return from MP) */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Pago procesado</h2>
                <p className="text-surface-500 text-sm mb-6">
                  Tu suscripcion de facturacion electronica esta siendo activada.
                  Vas a recibir un email de confirmacion. El acceso estara disponible en minutos.
                </p>
                <Button onClick={() => setStep('plan')} variant="ghost">
                  Volver al inicio
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
