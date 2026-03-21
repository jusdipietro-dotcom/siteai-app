'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, Shield, Bell, FileText, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Zap, Mail, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: 19000,
    cuils: 1,
    features: ['1 CUIT monitoreado', 'Alertas cada 2 horas (L-V)', 'Email con texto completo del PDF', 'Deduplicación inteligente'],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 35000,
    cuils: 3,
    popular: true,
    features: ['Hasta 3 CUITs', 'Alertas cada 2 horas (L-V)', 'Email con texto completo del PDF', 'Deduplicación inteligente', 'Soporte prioritario'],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 75000,
    cuils: 8,
    features: ['Hasta 8 CUITs', 'Alertas cada 2 horas (L-V)', 'Email con texto completo del PDF', 'Deduplicación inteligente', 'Soporte prioritario', 'Dashboard de causas'],
  },
]

const PORTALS = [
  { id: 'PJN', name: 'PJN', desc: 'Poder Judicial de la Nación' },
  { id: 'SCBA', name: 'SCBA', desc: 'Suprema Corte de Buenos Aires' },
  { id: 'AMBOS', name: 'Ambos', desc: 'PJN + SCBA' },
]

type Step = 'plan' | 'portal' | 'credentials' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  portal: string
  cuil: string
  notificationEmail: string
  payerEmail: string
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function MonitoreoPageWrapper() {
  return (
    <Suspense>
      <MonitoreoPage />
    </Suspense>
  )
}

function MonitoreoPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedPortal, setSelectedPortal] = useState('')
  const [cuil, setCuil] = useState('')
  const [pjnUser, setPjnUser] = useState('')
  const [pjnPass, setPjnPass] = useState('')
  const [scbaUser, setScbaUser] = useState('')
  const [scbaPass, setScbaPass] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Pre-fill emails from session
  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  // Fetch existing subscriptions (refetch when returning from MP payment)
  const fetchSubscriptions = () => {
    fetch('/api/monitoreo/status')
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
      const res = await fetch('/api/monitoreo/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = await res.json()
      setCouponValid(data)
      if (data.valid) {
        toast.success(`Cupón válido: ${data.discount}% de descuento`)
      } else {
        toast.error(data.error ?? 'Cupón inválido')
      }
    } catch {
      toast.error('Error al validar cupón')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Step 1: Create subscription
      const subRes = await fetch('/api/monitoreo/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          portal: selectedPortal,
          cuil,
          pjnUser: (selectedPortal === 'PJN' || selectedPortal === 'AMBOS') ? pjnUser : undefined,
          pjnPass: (selectedPortal === 'PJN' || selectedPortal === 'AMBOS') ? pjnPass : undefined,
          scbaUser: (selectedPortal === 'SCBA' || selectedPortal === 'AMBOS') ? scbaUser : undefined,
          scbaPass: (selectedPortal === 'SCBA' || selectedPortal === 'AMBOS') ? scbaPass : undefined,
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
      const mpRes = await fetch('/api/mp/create-monitoring-subscription', {
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

  const planConfig = PLANS.find(p => p.id === selectedPlan)
  const discount = couponValid?.valid ? couponValid.discount : 0
  const finalPrice = planConfig ? Math.round(planConfig.price * (1 - discount / 100)) : 0

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando (hasta 48hs)', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Monitoreo Judicial</h1>
        <p className="text-surface-500 mt-1">Recibí alertas automáticas de notificaciones judiciales por email.</p>
      </div>

      {/* Existing subscriptions */}
      {!loadingSubs && subscriptions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              const isActive = sub.status === 'active' || sub.status === 'provisioning'
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">
                          {sub.portal} — CUIT {sub.cuil}
                        </p>
                        <p className="text-xs text-surface-400">
                          Plan {sub.plan} — desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
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
                      <span>Alertas a: <span className="text-surface-700 font-medium">{sub.notificationEmail}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Facturación: <span className="text-surface-700 font-medium">{sub.payerEmail}</span></span>
                    </div>
                    {sub.coupon && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupón {sub.coupon.code} ({sub.coupon.discount}% off)</span>
                      </div>
                    )}
                    {sub.provisionedAt && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Activo desde {new Date(sub.provisionedAt).toLocaleDateString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="border-t border-surface-100 px-4 py-2 flex justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('¿Seguro que querés cancelar esta suscripción? Se desactivará el monitoreo para este CUIT.')) return
                          try {
                            const res = await fetch(`/api/monitoreo/cancel`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ subscriptionId: sub.id }),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              toast.success('Suscripción cancelada')
                              fetchSubscriptions()
                            } else {
                              toast.error(data.error ?? 'Error al cancelar')
                            }
                          } catch {
                            toast.error('Error al cancelar la suscripción')
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Cancelar suscripción
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Onboarding wizard */}
      <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="flex border-b border-surface-100">
          {(['plan', 'portal', 'credentials', 'coupon', 'payment'] as Step[]).map((s, i) => {
            const steps: Step[] = ['plan', 'portal', 'credentials', 'coupon', 'payment']
            const currentIdx = steps.indexOf(step)
            const isDone = i < currentIdx
            const isCurrent = i === currentIdx
            return (
              <div key={s} className="flex-1 relative">
                <div className={`h-1 ${isDone ? 'bg-brand-500' : isCurrent ? 'bg-brand-300' : 'bg-surface-100'}`} />
                <p className={`text-[10px] text-center py-2 font-medium ${isCurrent ? 'text-brand-600' : isDone ? 'text-emerald-600' : 'text-surface-400'}`}>
                  {['Plan', 'Portal', 'Credenciales', 'Cupón', 'Pago'][i]}
                </p>
              </div>
            )
          })}
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Plan selection */}
            {step === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Elegí tu plan</h2>
                <p className="text-sm text-surface-500 mb-6">Cada plan incluye monitoreo automático con alertas por email.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.id); setStep('portal') }}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                        selectedPlan === plan.id ? 'border-brand-500 bg-brand-50' : 'border-surface-100 hover:border-surface-200'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-surface-900 text-lg mb-1">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-brand-600 mb-3">
                        ${plan.price.toLocaleString('es-AR')}<span className="text-sm font-medium text-surface-400">/mes</span>
                      </p>
                      <ul className="space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-surface-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Portal */}
            {step === 'portal' && (
              <motion.div key="portal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Elegí el portal judicial</h2>
                <p className="text-sm text-surface-500 mb-6">Seleccioná el portal donde querés recibir alertas.</p>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {PORTALS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPortal(p.id)
                        if (p.id === 'PJN') { setScbaUser(''); setScbaPass('') }
                        if (p.id === 'SCBA') { setPjnUser(''); setPjnPass('') }
                      }}
                      className={`text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                        selectedPortal === p.id ? 'border-violet-500 bg-violet-50' : 'border-surface-100 hover:border-surface-200'
                      }`}
                    >
                      <Scale className="w-6 h-6 text-violet-500 mb-2" />
                      <p className="font-bold text-surface-900">{p.name}</p>
                      <p className="text-xs text-surface-500 mt-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!selectedPortal}
                    onClick={() => setStep('credentials')}
                    className="gap-2"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Credentials */}
            {step === 'credentials' && (
              <motion.div key="creds" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Datos de acceso al portal</h2>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    Tus credenciales se encriptan con AES-256-GCM y nunca se almacenan en texto plano.
                    Solo se usan para acceder al portal judicial en tu nombre.
                  </p>
                </div>

                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">CUIT a monitorear</label>
                    <input
                      type="text"
                      value={cuil}
                      onChange={e => setCuil(e.target.value)}
                      placeholder="20-12345678-9"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Email donde recibir las alertas judiciales
                    </label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      placeholder="alertas@estudio.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                    <p className="text-xs text-surface-400 mt-1">Acá vas a recibir cada nueva notificación judicial.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Email de facturación</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      placeholder="facturacion@estudio.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>

                  {/* PJN Credentials */}
                  {(selectedPortal === 'PJN' || selectedPortal === 'AMBOS') && (
                    <div className="rounded-2xl border border-surface-100 p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">PJN</span>
                        <span className="text-xs text-surface-400">Poder Judicial de la Nación</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Usuario PJN</label>
                        <input
                          type="text"
                          value={pjnUser}
                          onChange={e => setPjnUser(e.target.value)}
                          placeholder="CUIT sin guiones (ej: 20345678901)"
                          className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Contraseña PJN</label>
                        <input
                          type="password"
                          value={pjnPass}
                          onChange={e => setPjnPass(e.target.value)}
                          placeholder="Contraseña del portal PJN"
                          className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* SCBA Credentials */}
                  {(selectedPortal === 'SCBA' || selectedPortal === 'AMBOS') && (
                    <div className="rounded-2xl border border-surface-100 p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">SCBA</span>
                        <span className="text-xs text-surface-400">Suprema Corte de Buenos Aires</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Usuario SCBA</label>
                        <input
                          type="text"
                          value={scbaUser}
                          onChange={e => setScbaUser(e.target.value)}
                          placeholder="CUIT@notificaciones.scba.gov.ar"
                          className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Contraseña SCBA</label>
                        <input
                          type="password"
                          value={scbaPass}
                          onChange={e => setScbaPass(e.target.value)}
                          placeholder="Contraseña del portal SCBA"
                          className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('portal')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={
                      !cuil || !notificationEmail || !notificationEmail.includes('@') || !payerEmail || !payerEmail.includes('@') ||
                      ((selectedPortal === 'PJN' || selectedPortal === 'AMBOS') && (!pjnUser || !pjnPass)) ||
                      ((selectedPortal === 'SCBA' || selectedPortal === 'AMBOS') && (!scbaUser || !scbaPass))
                    }
                    onClick={() => setStep('coupon')}
                    className="gap-2"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Coupon */}
            {step === 'coupon' && (
              <motion.div key="coupon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Cupón de descuento</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenés un código de descuento, ingresalo acá. Si no, podés continuar directamente.</p>

                <div className="flex gap-3 max-w-md mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                    placeholder="CODIGO123"
                    className="flex-1 h-10 px-3 rounded-xl border border-surface-200 text-sm font-mono uppercase focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  />
                  <Button
                    variant="outline"
                    onClick={validateCoupon}
                    disabled={!couponCode.trim() || loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                    Validar
                  </Button>
                </div>

                {couponValid?.valid && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 max-w-md mb-4">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-800 font-medium">{couponValid.discount}% de descuento aplicado</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('credentials')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button variant="gradient" onClick={() => setStep('payment')} className="gap-2">
                    Continuar al pago <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Payment summary */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Resumen y pago</h2>
                <p className="text-sm text-surface-500 mb-6">Revisá los datos antes de proceder al pago con MercadoPago.</p>

                <div className="bg-surface-50 rounded-2xl p-5 max-w-md space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Plan</span>
                    <span className="font-medium text-surface-900">{planConfig?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Portal</span>
                    <span className="font-medium text-surface-900">{selectedPortal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">CUIT</span>
                    <span className="font-medium text-surface-900">{cuil}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Alertas a</span>
                    <span className="font-medium text-surface-900">{notificationEmail}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Precio original</span>
                        <span className="text-surface-400 line-through">${planConfig?.price.toLocaleString('es-AR')}/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Descuento</span>
                        <span className="font-medium text-emerald-600">-{discount}%</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm pt-3 border-t border-surface-200">
                    <span className="font-semibold text-surface-900">Total mensual</span>
                    <span className="font-bold text-xl text-brand-600">${finalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 max-w-md mb-6">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Una vez confirmado el pago, tu monitoreo se activa automáticamente dentro de las 48 horas hábiles.
                    Recibirás un email de confirmación.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('coupon')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                    ) : (
                      <><Zap className="w-4 h-4" /> Pagar con MercadoPago</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step: Done (post-payment return) */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-surface-900 mb-2">Pago registrado</h2>
                  <p className="text-sm text-surface-500 max-w-md mx-auto mb-6">
                    Tu suscripción de monitoreo judicial está siendo procesada.
                    Recibirás un email de confirmación cuando el servicio esté activo (dentro de las 48 horas hábiles).
                  </p>
                  <div className="bg-surface-50 rounded-2xl p-5 max-w-sm mx-auto space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-surface-700">Pago con MercadoPago procesado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-surface-700">Activación en curso (hasta 48hs)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="w-4 h-4 text-blue-500" />
                      <span className="text-surface-700">Te avisamos por email cuando esté listo</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setStep('plan'); fetchSubscriptions(); window.history.replaceState({}, '', '/monitoreo') }}
                    className="gap-2"
                  >
                    Volver al panel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
