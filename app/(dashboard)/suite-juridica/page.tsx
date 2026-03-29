'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, Check, ArrowRight, ArrowLeft, Loader2, Tag, AlertCircle,
  CheckCircle2, Shield, Receipt, CalendarDays, FileSearch, Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

const PLANS = [
  {
    id: 'abogado',
    name: 'Abogado',
    price: 39000,
    individualTotal: 56000,
    savings: 30,
    features: [
      'Notificaciones Judiciales (PJN + SCBA)',
      'Facturacion Electronica ARCA (1 PV, Facturas B)',
      'Dashboard de Causas MEV (30 causas, sync diaria)',
      'Turnos Online (1 profesional, L-V, 1 area)',
      '30% de ahorro vs planes individuales',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 69000,
    individualTotal: 112000,
    savings: 38,
    popular: true,
    features: [
      'Notificaciones Judiciales (PJN + SCBA, alertas prioritarias)',
      'Facturacion Electronica ARCA (Facturas A+B, NC/ND)',
      'Dashboard de Causas MEV (100 causas, sync c/6hs, alertas)',
      'Turnos Online (L-S, 5 areas, colores + logo)',
      'Jurisprudencia IA (acceso cuando se lance)',
      '38% de ahorro vs planes individuales',
    ],
  },
  {
    id: 'estudio',
    name: 'Estudio Juridico',
    price: 149000,
    individualTotal: 230000,
    savings: 35,
    features: [
      'Notificaciones Judiciales (PJN + SCBA, ilimitado)',
      'Facturacion Electronica ARCA (3 PV, todo comprobante)',
      'Dashboard de Causas MEV (ilimitadas, sync c/2hs)',
      'Turnos Online (3 prof., areas ilimitadas, subdominio)',
      'Jurisprudencia IA (acceso prioritario)',
      '35% de ahorro vs planes individuales',
      'Soporte dedicado',
    ],
  },
]

const SERVICES = [
  { icon: Scale, label: 'Notificaciones Judiciales', href: '/monitoreo', color: 'bg-blue-100 text-blue-600' },
  { icon: Receipt, label: 'Facturacion ARCA', href: '/facturacion', color: 'bg-green-100 text-green-600' },
  { icon: FileSearch, label: 'Dashboard Causas', href: '/causas', color: 'bg-purple-100 text-purple-600' },
  { icon: CalendarDays, label: 'Turnos Online', href: '/turnos', color: 'bg-indigo-100 text-indigo-600' },
]

type Step = 'plan' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  monitoringSubId: string | null
  facturacionSubId: string | null
  causasSubId: string | null
  turnosSubId: string | null
  provisionedAt: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function SuiteJuridicaPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <SuiteJuridicaPage />
    </Suspense>
  )
}

function SuiteJuridicaPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  useEffect(() => {
    if (session?.user?.email && !payerEmail) setPayerEmail(session.user.email)
  }, [session?.user?.email])

  const fetchSubscriptions = () => {
    fetch('/api/suite-juridica/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])
  useEffect(() => { if (mpReturn) fetchSubscriptions() }, [mpReturn])

  const activeSub = subscriptions.find(s => ['active', 'provisioning', 'trial', 'trial_expired'].includes(s.status))

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setLoading(true)
    try {
      // Use monitoring coupon validation (coupons are shared)
      const res = await fetch('/api/monitoreo/validate-coupon', {
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
      const subRes = await fetch('/api/suite-juridica/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
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

      if (subData.nextStep === 'trial_started' || subData.nextStep === 'done') {
        toast.success(subData.freeAccount ? 'Servicio activado!' : 'Trial de 3 dias activado!')
        fetchSubscriptions()
        setStep('plan')
        return
      }

      const mpRes = await fetch('/api/mp/create-suite-subscription', {
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
    if (!confirm('Estas seguro de cancelar la Suite Juridica? Se desactivaran los 4 servicios incluidos.')) return
    try {
      const res = await fetch('/api/suite-juridica/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suite Juridica cancelada')
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

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando...', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Suite Juridica</h1>
            <p className="text-surface-500 text-sm">4 servicios integrados con descuento exclusivo para profesionales del derecho.</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingSubs && (
        <div className="mb-10 flex items-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {/* Active suite: services dashboard */}
      {(activeSub?.status === 'active' || activeSub?.status === 'trial' || activeSub?.status === 'trial_expired') && (
        <div className="mb-10 space-y-6">
          {/* Status bar */}
          <div className="rounded-2xl border border-surface-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm">
                  Suite Juridica — Plan {activeSub.plan}
                </p>
                <p className="text-xs text-surface-400">
                  4 servicios activos desde {new Date(activeSub.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabel[activeSub.status]?.color}`}>
                {statusLabel[activeSub.status]?.text}
              </span>
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

          {/* Services grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {SERVICES.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-surface-100 bg-white p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 text-sm group-hover:text-blue-600 transition-colors">{label}</p>
                    <p className="text-xs text-surface-400">Incluido en tu suite — Ir a configurar</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* Jurisprudencia IA teaser */}
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm flex items-center gap-2">
                  Jurisprudencia IA
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    Proximamente
                  </span>
                </p>
                <p className="text-xs text-surface-400">
                  {activeSub.plan === 'estudio'
                    ? 'Acceso prioritario cuando se lance. Te notificaremos.'
                    : 'Acceso disponible cuando se lance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Trial banners */}
          {activeSub?.status === 'trial' && activeSub.trialEndsAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                  <p className="text-xs text-blue-600">
                    Vence: {new Date(activeSub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setStep('plan')}>
                  Suscribirse
                </Button>
              </div>
            </div>
          )}
          {activeSub?.status === 'trial_expired' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                  <p className="text-xs text-orange-600">Suscribite para seguir usando los servicios</p>
                </div>
                <Button size="sm" onClick={() => setStep('plan')}>
                  Elegir plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provisioning state */}
      {activeSub?.status === 'provisioning' && (
        <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-800">Activando tu Suite Juridica</h3>
          <p className="text-sm text-blue-600 mt-1">Estamos configurando tus 4 servicios. Esto puede tardar unos minutos.</p>
        </div>
      )}

      {/* Previous subscriptions */}
      {!loadingSubs && subscriptions.filter(s => s.status !== 'active' && s.status !== 'provisioning').length > 0 && !activeSub && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.filter(s => s.status !== 'active' && s.status !== 'provisioning').map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">Suite Juridica — Plan {sub.plan}</p>
                        <p className="text-xs text-surface-400">
                          Desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wizard */}
      {!loadingSubs && !activeSub && (
        <AnimatePresence mode="wait">
          {/* STEP: Plan selection */}
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Value proposition */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 mb-8">
                <h2 className="text-lg font-bold text-surface-900 mb-2">Todo lo que necesitas en un solo plan</h2>
                <p className="text-sm text-surface-600 mb-4">
                  4 servicios esenciales para estudios juridicos, con hasta un 38% de ahorro vs contratacion individual.
                </p>
                <div className="grid sm:grid-cols-4 gap-3">
                  {SERVICES.map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-surface-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="text-lg font-semibold text-surface-800 mb-4">Elegir plan</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan.id); setStep('coupon') }}
                    className={`relative rounded-2xl border p-6 text-left transition-all hover:shadow-md ${
                      selectedPlan === plan.id
                        ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
                        : 'border-surface-200 bg-white hover:border-surface-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-3 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <p className="font-semibold text-surface-900">{plan.name}</p>
                    <p className="text-2xl font-bold text-surface-900 mt-2">
                      ${plan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span>
                    </p>
                    <p className="text-xs text-surface-400 line-through mt-0.5">
                      ${plan.individualTotal.toLocaleString('es-AR')}/mes individual
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      Ahorra {plan.savings}%
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
                      <span className="w-full inline-flex justify-center py-2 rounded-xl text-sm font-medium bg-amber-500 text-white">
                        Elegir plan
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Comparison table */}
              <div className="mt-8 rounded-2xl border border-surface-100 bg-white p-6">
                <h3 className="font-semibold text-surface-800 mb-4">Comparacion detallada</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-100">
                        <th className="text-left py-2 text-surface-500 font-medium">Servicio</th>
                        <th className="text-center py-2 text-surface-500 font-medium">Abogado</th>
                        <th className="text-center py-2 text-surface-500 font-medium">Profesional</th>
                        <th className="text-center py-2 text-surface-500 font-medium">Estudio</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-surface-50">
                        <td className="py-2.5 text-surface-700">Notificaciones (PJN+SCBA)</td>
                        <td className="py-2.5 text-center text-surface-600">Basico</td>
                        <td className="py-2.5 text-center text-surface-600">Profesional</td>
                        <td className="py-2.5 text-center text-surface-600">Estudio</td>
                      </tr>
                      <tr className="border-b border-surface-50">
                        <td className="py-2.5 text-surface-700">Facturacion ARCA</td>
                        <td className="py-2.5 text-center text-surface-600">1 PV, Fact B</td>
                        <td className="py-2.5 text-center text-surface-600">1 PV, A+B+NC/ND</td>
                        <td className="py-2.5 text-center text-surface-600">3 PV, Todo</td>
                      </tr>
                      <tr className="border-b border-surface-50">
                        <td className="py-2.5 text-surface-700">Dashboard Causas</td>
                        <td className="py-2.5 text-center text-surface-600">30 causas, 24h</td>
                        <td className="py-2.5 text-center text-surface-600">100 causas, 6h</td>
                        <td className="py-2.5 text-center text-surface-600">Ilimitado, 2h</td>
                      </tr>
                      <tr className="border-b border-surface-50">
                        <td className="py-2.5 text-surface-700">Turnos Online</td>
                        <td className="py-2.5 text-center text-surface-600">1 prof, L-V</td>
                        <td className="py-2.5 text-center text-surface-600">1 prof, L-S, 5 areas</td>
                        <td className="py-2.5 text-center text-surface-600">3 prof, ilimitado</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-surface-700">Jurisprudencia IA</td>
                        <td className="py-2.5 text-center text-surface-400">—</td>
                        <td className="py-2.5 text-center text-amber-600 font-medium">Al lanzar</td>
                        <td className="py-2.5 text-center text-amber-600 font-medium">Prioritario</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Cupon */}
          {step === 'coupon' && (
            <motion.div key="coupon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('plan')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver a planes
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Cupon de descuento</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenes un cupon, ingresalo. Si no, saltea este paso.</p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                        placeholder="CODIGO"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none uppercase font-mono tracking-wide"
                      />
                    </div>
                    <Button variant="outline" onClick={validateCoupon} disabled={loading || !couponCode.trim()}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                    </Button>
                  </div>
                  {couponValid?.valid && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Descuento de {couponValid.discount}% aplicado
                    </div>
                  )}
                  {couponValid && !couponValid.valid && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> Cupon invalido o expirado
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => setStep('payment')}>
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('coupon')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Confirmar y pagar</h2>
                <p className="text-sm text-surface-500 mb-6">Revisa el resumen y procede al pago con MercadoPago.</p>

                <div className="rounded-2xl border border-surface-100 bg-white p-6 space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Plan</span>
                    <span className="font-medium text-surface-900">Suite Juridica — {planConfig?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Servicios incluidos</span>
                    <span className="font-medium text-surface-900">4 servicios</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Precio original</span>
                        <span className="text-surface-400 line-through">${planConfig?.price.toLocaleString('es-AR')}/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Descuento cupon</span>
                        <span className="text-emerald-600 font-medium">-{discount}%</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-surface-100 pt-4 flex justify-between">
                    <span className="font-semibold text-surface-900">Total mensual</span>
                    <span className="text-xl font-bold text-surface-900">${finalPrice.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span></span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium text-center">
                    Ahorro de ${((planConfig?.individualTotal ?? 0) - finalPrice).toLocaleString('es-AR')}/mes vs planes individuales
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Email de facturacion *</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-6 text-base bg-amber-500 hover:bg-amber-600"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
                  ) : (
                    <>Pagar con MercadoPago <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto text-center py-12">
                {activeSub ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Suite Juridica activa</h2>
                    <p className="text-surface-500 mb-6">Tus 4 servicios estan listos. Configura cada uno desde tu dashboard.</p>
                    <Button onClick={() => { setStep('plan'); fetchSubscriptions() }}>
                      Ver mis servicios
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Procesando pago</h2>
                    <p className="text-surface-500 mb-6">Estamos verificando tu pago. Puede tardar unos minutos.</p>
                    <Button variant="outline" onClick={fetchSubscriptions}>
                      <Loader2 className="w-4 h-4 mr-2" /> Verificar estado
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
