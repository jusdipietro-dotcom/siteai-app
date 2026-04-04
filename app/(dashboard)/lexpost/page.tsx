'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Shield, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Zap, Camera,
  CheckCircle2, ExternalLink, Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    price: 15000,
    features: [
      '1 cuenta de Instagram',
      '10 publicaciones/mes',
      'Censura automatica con OCR',
      'Caratula con branding',
      'Copy con IA',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 25000,
    popular: true,
    features: [
      '1 cuenta de Instagram',
      'Publicaciones ilimitadas',
      'Censura automatica con OCR',
      'Caratula con branding personalizado',
      'Copy con IA',
      'Notificaciones Telegram',
      'Soporte prioritario',
    ],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 45000,
    features: [
      'Hasta 3 cuentas de Instagram',
      'Publicaciones ilimitadas',
      'Censura automatica con OCR',
      'Branding personalizado por cuenta',
      'Copy con IA',
      'Notificaciones Telegram',
      'Soporte prioritario',
      'Onboarding personalizado',
    ],
  },
]

type Step = 'plan' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  igUsername: string | null
  publicationsUsed: number
  publicationsLimit: number
  notificationEmail: string
  createdAt: string
  provisionedAt: string | null
  trialEndsAt: string | null
  coupon?: { code: string; discount: number } | null
  freeAccount?: boolean
}

export default function LexPostPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <LexPostPage />
    </Suspense>
  )
}

function LexPostPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount: number; message: string } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [email, setEmail] = useState('')
  const [igUser, setIgUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingSub, setExistingSub] = useState<Subscription | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email)
      fetch('/api/lexpost/status')
        .then(r => r.json())
        .then(data => {
          if (data.subscription) {
            setExistingSub(data.subscription)
          }
        })
        .catch(() => {})
        .finally(() => setCheckingStatus(false))
    } else {
      setCheckingStatus(false)
    }
  }, [session])

  async function handleValidateCoupon() {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    try {
      const res = await fetch('/api/lexpost/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, discount: 0, message: 'Error validando cupon' })
    } finally {
      setValidatingCoupon(false)
    }
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch('/api/lexpost/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          notificationEmail: email,
          payerEmail: email,
          igUsername: igUser,
          couponCode: couponResult?.valid ? couponCode : undefined,
        }),
      })
      const data = await res.json()
      if (data.freeActivation) {
        toast.success('Servicio activado gratuitamente')
        setExistingSub(data.subscription)
        setStep('done')
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.error || 'Error al procesar')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
      </div>
    )
  }

  // Active subscription view
  if (existingSub && ['active', 'trial', 'provisioning'].includes(existingSub.status)) {
    const plan = PLANS.find(p => p.id === existingSub.plan)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LexPost Legal</h1>
            <p className="text-surface-500 text-sm">Publicacion legal profesional para Instagram</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-green-700">Servicio activo</span>
              </div>
              <p className="text-sm text-surface-500 mt-1">Plan {plan?.name || existingSub.plan}</p>
            </div>
            {existingSub.igUsername && (
              <div className="text-right">
                <p className="text-xs text-surface-400">Instagram</p>
                <p className="text-sm font-medium">@{existingSub.igUsername}</p>
              </div>
            )}
          </div>

          {existingSub.publicationsLimit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-500">Publicaciones este mes</span>
                <span className="font-medium">{existingSub.publicationsUsed} / {existingSub.publicationsLimit}</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (existingSub.publicationsUsed / existingSub.publicationsLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <a
              href="https://lexpost.automaticialab.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-800 hover:from-indigo-700 hover:to-blue-900" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir LexPost
              </Button>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm mb-3">Tu plan incluye</h3>
          <div className="space-y-2">
            {plan?.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Subscription wizard
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">LexPost Legal</h1>
        <p className="text-surface-500 mt-2 max-w-lg mx-auto">
          Publica resoluciones judiciales en Instagram de forma profesional.
          Censura automatica, caratula con tu branding y publicacion directa.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {(['plan', 'coupon', 'payment'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-surface-200" />}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step === s ? 'bg-indigo-600 text-white' :
              (['plan', 'coupon', 'payment'].indexOf(step) > i) ? 'bg-green-500 text-white' :
              'bg-surface-100 text-surface-400'
            }`}>
              {(['plan', 'coupon', 'payment'].indexOf(step) > i) ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={step === s ? 'text-surface-900 font-medium' : 'text-surface-400'}>
              {s === 'plan' ? 'Plan' : s === 'coupon' ? 'Cupon' : 'Pago'}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Plan selection */}
        {step === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    selectedPlan === plan.id ? 'border-indigo-600 shadow-lg' : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">
                      Mas popular
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price.toLocaleString('es-AR')}</span>
                    <span className="text-surface-400 text-sm">/mes</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email de notificaciones</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuario de Instagram</label>
                  <input
                    type="text"
                    value={igUser}
                    onChange={e => setIgUser(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="tu.usuario"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('coupon')}
                  disabled={!selectedPlan || !email}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Coupon */}
        {step === 'coupon' && (
          <motion.div key="coupon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border p-6 max-w-md mx-auto space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold">Cupon de descuento</h2>
              </div>
              <p className="text-sm text-surface-500">Si tenes un cupon, ingresalo aca. Si no, podes continuar directamente.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                  placeholder="CODIGO"
                />
                <Button
                  variant="outline"
                  onClick={handleValidateCoupon}
                  disabled={!couponCode.trim() || validatingCoupon}
                >
                  {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                </Button>
              </div>
              {couponResult && (
                <div className={`text-sm px-3 py-2 rounded-lg ${couponResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {couponResult.message}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep('plan')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Atras
                </Button>
                <Button onClick={() => setStep('payment')} className="bg-indigo-600 hover:bg-indigo-700">
                  Continuar al pago <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-xl border p-6 max-w-md mx-auto space-y-4">
              <h2 className="font-semibold text-lg">Confirmar suscripcion</h2>
              <div className="bg-surface-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Plan</span>
                  <span className="font-medium">{PLANS.find(p => p.id === selectedPlan)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Precio</span>
                  <span className="font-medium">
                    ${PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString('es-AR')}/mes
                  </span>
                </div>
                {couponResult?.valid && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({couponResult.discount}%)</span>
                    <span>-${Math.round((PLANS.find(p => p.id === selectedPlan)?.price || 0) * couponResult.discount / 100).toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-surface-500">Instagram</span>
                  <span>@{igUser || 'sin configurar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Email</span>
                  <span>{email}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep('coupon')}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Atras
                </Button>
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-blue-800"
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                  ) : (
                    <>Suscribirme con Mercado Pago</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Done */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Suscripcion procesada</h2>
              <p className="text-surface-500 max-w-md mx-auto">
                Tu suscripcion a LexPost esta siendo procesada. En breve recibiras un email de confirmacion y podras acceder a la plataforma.
              </p>
              <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
                Ver estado de mi suscripcion
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
