'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale, Shield, Bell, FileText, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Zap,
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
  provisionedAt: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
}

export default function MonitoreoPage() {
  const { data: session } = useSession()
  const [step, setStep] = useState<Step>('plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedPortal, setSelectedPortal] = useState('')
  const [cuil, setCuil] = useState('')
  const [portalUser, setPortalUser] = useState('')
  const [portalPass, setPortalPass] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Fetch existing subscriptions
  useEffect(() => {
    fetch('/api/monitoreo/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => {})
      .finally(() => setLoadingSubs(false))
  }, [])

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
          portalUser,
          portalPass,
          payerEmail: session?.user?.email,
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
          payerEmail: session?.user?.email,
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
          <div className="space-y-3">
            {subscriptions.map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              return (
                <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl border border-surface-100 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Scale className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 text-sm">
                        {sub.portal} — CUIT {sub.cuil}
                      </p>
                      <p className="text-xs text-surface-400">
                        Plan {sub.plan} — {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        {sub.coupon && ` — Cupón ${sub.coupon.code} (${sub.coupon.discount}%)`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                    {st.text}
                  </span>
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
                      onClick={() => setSelectedPortal(p.id)}
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

                <div className="space-y-4 max-w-md">
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
                      Usuario del portal {selectedPortal === 'AMBOS' ? '(PJN/SCBA)' : `(${selectedPortal})`}
                    </label>
                    <input
                      type="text"
                      value={portalUser}
                      onChange={e => setPortalUser(e.target.value)}
                      placeholder="usuario@notificaciones..."
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Contraseña del portal</label>
                    <input
                      type="password"
                      value={portalPass}
                      onChange={e => setPortalPass(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('portal')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!cuil || !portalUser || !portalPass}
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
