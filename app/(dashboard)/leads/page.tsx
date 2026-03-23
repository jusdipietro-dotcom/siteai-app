'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Mail, CheckCircle2,
  BarChart3, FileSpreadsheet, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Básico',
    price: 18000,
    features: [
      '45 nichos de negocio monitoreados',
      '25 ciudades de Argentina',
      '~50-150 leads verificados por día',
      'Exportación automática a Google Sheets',
      'Datos: nombre, teléfono, email, dirección',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 35000,
    popular: true,
    features: [
      'Todo lo del plan Básico',
      'Nichos personalizados a tu medida',
      'Leads ilimitados por día',
      'Reportes semanales de captación',
      'Soporte prioritario',
      'Ciudades ilimitadas',
    ],
  },
]

type Step = 'plan' | 'details' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  googleSheetUrl: string | null
  leadsGenerated: number
  nichesList: string[]
  citiesList: string[]
  notificationEmail: string
  payerEmail: string
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function LeadsPageWrapper() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  )
}

function LeadsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const mpStatus = searchParams.get('status')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const paymentOk = mpStatus === 'approved' || mpStatus === 'pending'
  const [selectedPlan, setSelectedPlan] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
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
      signIn(undefined, { callbackUrl: '/leads' })
    }
  }, [session])

  const fetchSubscriptions = () => {
    fetch('/api/leads/status')
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
      const res = await fetch('/api/leads/validate-coupon', {
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
      const subRes = await fetch('/api/leads/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          notificationEmail,
          payerEmail,
          googleSheetUrl: googleSheetUrl.trim() || undefined,
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
      const mpRes = await fetch('/api/mp/create-leads-subscription', {
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
        <h1 className="text-2xl font-bold text-surface-900">Captacion de Leads IA</h1>
        <p className="text-surface-500 mt-1">Captura leads verificados de negocios reales en toda Argentina, en piloto automatico.</p>
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
                      <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                        <Search className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">Plan {sub.plan}</p>
                        <p className="text-xs text-surface-400">
                          {sub.nichesList?.length ?? 0} nichos — {sub.citiesList?.length ?? 0} ciudades
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
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Leads generados: <span className="text-surface-700 font-medium">{sub.leadsGenerated ?? 0}</span></span>
                    </div>
                    {sub.googleSheetUrl && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <a
                          href={sub.googleSheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                        >
                          Ver Google Sheet <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {sub.coupon && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupon {sub.coupon.code} ({sub.coupon.discount}% off)</span>
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
                            if (!confirm('Seguro que queres cancelar esta suscripcion? Se dejaran de generar leads automaticamente.')) return
                            try {
                              const res = await fetch('/api/leads/cancel', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ subscriptionId: sub.id }),
                              })
                              const data = await res.json()
                              if (res.ok) {
                                toast.success('Suscripcion cancelada')
                                fetchSubscriptions()
                              } else {
                                toast.error(data.error ?? 'Error al cancelar')
                              }
                            } catch {
                              toast.error('Error al cancelar la suscripcion')
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Cancelar suscripcion
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
                <div className={`h-1 ${isDone ? 'bg-rose-500' : isCurrent ? 'bg-rose-300' : 'bg-surface-100'}`} />
                <p className={`text-[10px] text-center py-2 font-medium ${isCurrent ? 'text-rose-600' : isDone ? 'text-emerald-600' : 'text-surface-400'}`}>
                  {['Plan', 'Datos', 'Cupon', 'Pago'][i]}
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
                <h2 className="text-xl font-bold text-surface-900 mb-2">Elegi tu plan</h2>
                <p className="text-sm text-surface-500 mb-6">Leads verificados de negocios reales depositados automaticamente en tu Google Sheets.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.id); setStep('details') }}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                        selectedPlan === plan.id ? 'border-rose-500 bg-rose-50' : 'border-surface-100 hover:border-surface-200'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-surface-900 text-lg mb-1">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-rose-600 mb-3">
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
                <p className="text-sm text-surface-500 mb-6">Ingresa tu email y, opcionalmente, la URL de tu Google Sheet para recibir los leads.</p>

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
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                    <p className="text-[11px] text-surface-400 mt-1">Te avisamos sobre el estado de tu suscripcion y novedades.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Email de facturacion
                    </label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      placeholder="facturacion@email.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      URL de Google Sheet <span className="text-surface-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={e => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                    <p className="text-[11px] text-surface-400 mt-1">Si lo dejas vacio, creamos uno automaticamente y te compartimos el enlace.</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
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
                <h2 className="text-xl font-bold text-surface-900 mb-2">Tenes un cupon de descuento?</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenes un codigo promocional, ingresalo aca. Si no, podes continuar.</p>
                <div className="flex gap-2 max-w-sm mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="CODIGO2026"
                    className="flex-1 h-10 px-3 rounded-xl border border-surface-200 text-sm uppercase focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  <Button variant="outline" onClick={validateCoupon} disabled={loading || !couponCode.trim()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                  </Button>
                </div>
                {couponValid && (
                  <div className={`flex items-center gap-2 text-sm mb-4 ${couponValid.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {couponValid.valid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {couponValid.valid ? `${couponValid.discount}% de descuento aplicado` : 'Cupon invalido'}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('details')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
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
                <p className="text-sm text-surface-500 mb-6">Revisa los datos antes de continuar al pago.</p>

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
                    <span className="text-surface-500">Facturacion</span>
                    <span className="font-medium text-surface-900">{payerEmail}</span>
                  </div>
                  {googleSheetUrl.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">Google Sheet</span>
                      <a
                        href={googleSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        Ver <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {!googleSheetUrl.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">Google Sheet</span>
                      <span className="font-medium text-surface-400">Se crea automaticamente</span>
                    </div>
                  )}
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
                    <span className="font-extrabold text-xl text-rose-600">${finalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 max-w-lg">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    Una vez confirmado el pago, activamos tu sistema de captacion. Los leads se depositan automaticamente en tu Google Sheets.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('coupon')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
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
                      <p className="text-sm text-surface-500 mb-6">Tu sistema de captacion de leads esta siendo activado.</p>
                      <div className="space-y-3 text-left bg-surface-50 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-surface-700">{mpStatus === 'approved' ? 'Pago confirmado' : 'Pago pendiente de acreditacion'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Search className="w-5 h-5 text-rose-500 shrink-0" />
                          <span className="text-surface-700">Activando captacion de leads</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-5 h-5 text-surface-400 shrink-0" />
                          <span className="text-surface-700">Revisa tu email</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h2 className="text-xl font-bold text-surface-900 mb-2">Pago no completado</h2>
                      <p className="text-sm text-surface-500 mb-6">El pago no se proceso correctamente. Podes intentar nuevamente.</p>
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
