'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Mail, CheckCircle2,
  Activity, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Señales',
    price: 20000,
    features: [
      '18 pares seleccionados — 60% win rate verificado',
      '7 indicadores técnicos + 3 macro (Fear & Greed, Funding, BTC Dom)',
      'Stop Loss y Take Profit automáticos',
      'Filtros de calidad: ADX, patrones de velas, volatilidad',
      'Alertas instantáneas en Telegram (~3-5/día)',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 35000,
    popular: true,
    features: [
      'Todo lo del plan Señales (18 pares, 60% win rate)',
      'Pares personalizados adicionales',
      'Reportes semanales con métricas (Profit Factor, Sharpe)',
      'Análisis macro diario (Fear & Greed, Funding Rate)',
      'Soporte prioritario',
      'Canal VIP con análisis avanzado',
    ],
  },
]

type Step = 'plan' | 'details' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  symbols: string
  timeframe: string
  telegramChatId: string
  signalsSent: number
  notificationEmail: string
  payerEmail: string
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function CryptoPageWrapper() {
  return (
    <Suspense>
      <CryptoPage />
    </Suspense>
  )
}

function CryptoPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const mpStatus = searchParams.get('status')
  const mpSubId = searchParams.get('sub')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const paymentOk = mpStatus === 'approved' || mpStatus === 'pending'
  const [selectedPlan, setSelectedPlan] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (session === null) {
      signIn(undefined, { callbackUrl: '/crypto' })
    }
  }, [session])

  const fetchSubscriptions = () => {
    fetch('/api/trading/status')
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
      const res = await fetch('/api/trading/validate-coupon', {
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
      const subRes = await fetch('/api/trading/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
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
      const mpRes = await fetch('/api/mp/create-trading-subscription', {
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
    provisioning: { text: 'Configurando', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Señales Crypto IA</h1>
        <p className="text-surface-500 mt-1">Recibí señales de trading con análisis técnico profesional directo en tu Telegram.</p>
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
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">Plan {sub.plan}</p>
                        <p className="text-xs text-surface-400">
                          {sub.symbols?.split(',').length ?? 0} pares — {sub.timeframe ?? 'multi-timeframe'}
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
                      <Activity className="w-3.5 h-3.5" />
                      <span>Telegram: <span className="text-surface-700 font-medium">{sub.telegramChatId || 'Pendiente'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Señales enviadas: <span className="text-surface-700 font-medium">{sub.signalsSent ?? 0}</span></span>
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
                    <div className="border-t border-surface-100 px-4 py-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('¿Seguro que querés cancelar esta suscripción? Se dejarán de enviar señales de trading.')) return
                            try {
                              const res = await fetch('/api/trading/cancel', {
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wizard */}
      <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="flex border-b border-surface-100">
          {(['plan', 'details', 'coupon', 'payment'] as Step[]).map((s, i) => {
            const steps: Step[] = ['plan', 'details', 'coupon', 'payment']
            const currentIdx = steps.indexOf(step === 'done' ? 'payment' : step)
            const isDone = i < currentIdx
            const isCurrent = i === currentIdx
            return (
              <div key={s} className="flex-1 relative">
                <div className={`h-1 ${isDone ? 'bg-amber-500' : isCurrent ? 'bg-amber-300' : 'bg-surface-100'}`} />
                <p className={`text-[10px] text-center py-2 font-medium ${isCurrent ? 'text-amber-600' : isDone ? 'text-emerald-600' : 'text-surface-400'}`}>
                  {['Plan', 'Datos', 'Cupón', 'Pago'][i]}
                </p>
              </div>
            )
          })}
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Plan */}
            {step === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Elegí tu plan</h2>
                <p className="text-sm text-surface-500 mb-6">Señales de trading con análisis técnico automatizado directo en tu Telegram.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.id); setStep('details') }}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                        selectedPlan === plan.id ? 'border-amber-500 bg-amber-50' : 'border-surface-100 hover:border-surface-200'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-surface-900 text-lg mb-1">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-amber-600 mb-3">
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

            {/* Step 2: Details */}
            {step === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Tus datos</h2>
                <p className="text-sm text-surface-500 mb-6">Ingresá tu email para recibir notificaciones y facturación.</p>

                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Email de notificaciones
                    </label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                    <p className="text-[11px] text-surface-400 mt-1">Te avisamos sobre el estado de tu suscripción y novedades.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Email de facturación
                    </label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      placeholder="facturacion@email.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!notificationEmail.includes('@') || !payerEmail.includes('@')}
                    onClick={() => setStep('coupon')}
                    className="gap-2"
                  >
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Coupon */}
            {step === 'coupon' && (
              <motion.div key="coupon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">¿Tenés un cupón de descuento?</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenés un código promocional, ingresalo acá. Si no, podés continuar.</p>
                <div className="flex gap-2 max-w-sm mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="CODIGO2026"
                    className="flex-1 h-10 px-3 rounded-xl border border-surface-200 text-sm uppercase focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <Button variant="outline" onClick={validateCoupon} disabled={loading || !couponCode.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                  </Button>
                </div>
                {couponValid && (
                  <div className={`flex items-center gap-2 text-sm mb-4 ${couponValid.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {couponValid.valid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {couponValid.valid ? `${couponValid.discount}% de descuento aplicado` : 'Cupón inválido'}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('details')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </Button>
                  <Button variant="gradient" onClick={() => setStep('payment')} className="gap-2">
                    Siguiente <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Payment summary */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Resumen y pago</h2>
                <p className="text-sm text-surface-500 mb-6">Revisá los datos antes de continuar al pago.</p>

                <div className="bg-surface-50 rounded-2xl p-5 max-w-lg space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Plan</span>
                    <span className="font-medium text-surface-900">{planConfig?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Notificaciones</span>
                    <span className="font-medium text-surface-900">{notificationEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Facturación</span>
                    <span className="font-medium text-surface-900">{payerEmail}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="border-t border-surface-200 pt-3 flex justify-between text-sm">
                        <span className="text-surface-500">Precio original</span>
                        <span className="text-surface-400 line-through">${planConfig?.price.toLocaleString('es-AR')}/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Descuento</span>
                        <span className="text-emerald-600 font-medium">-{discount}%</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-surface-200 pt-3 flex justify-between">
                    <span className="font-bold text-surface-900">Total mensual</span>
                    <span className="font-extrabold text-xl text-amber-600">${finalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 max-w-lg">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    Una vez confirmado el pago, activamos tu suscripción y te enviamos las instrucciones para conectar Telegram.
                    Empezás a recibir señales en minutos.
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
                      <>Pagar con MercadoPago <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center py-8 max-w-md mx-auto">
                  {paymentOk ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-bold text-surface-900 mb-2">Pago procesado</h2>
                      <p className="text-sm text-surface-500 mb-6">Tu suscripción está siendo activada.</p>
                      <div className="space-y-3 text-left bg-surface-50 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-surface-700">{mpStatus === 'approved' ? 'Pago confirmado' : 'Pago pendiente de acreditación'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Activity className="w-5 h-5 text-amber-500 shrink-0" />
                          <span className="text-surface-700">Te enviamos las instrucciones para conectar Telegram</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-5 h-5 text-surface-400 shrink-0" />
                          <span className="text-surface-700">Revisá tu email para los próximos pasos</span>
                        </div>
                      </div>

                      {mpSubId && (
                        <div className="mb-6">
                          <p className="text-sm text-surface-600 mb-3">
                            Para recibir las señales, conectá tu Telegram haciendo click en el botón:
                          </p>
                          <a
                            href={`https://t.me/ClaudecodeLAB_bot?start=${mpSubId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                          >
                            Conectar Telegram
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h2 className="text-xl font-bold text-surface-900 mb-2">Pago no completado</h2>
                      <p className="text-sm text-surface-500 mb-6">El pago no se procesó correctamente. Podés intentar nuevamente.</p>
                    </>
                  )}
                  <Button
                    variant="gradient"
                    onClick={() => {
                      setStep('plan')
                      fetchSubscriptions()
                    }}
                    className="gap-2"
                  >
                    Volver al panel <ArrowRight className="w-4 h-4" />
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
