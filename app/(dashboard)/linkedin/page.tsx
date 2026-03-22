'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Linkedin, Shield, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Zap, Mail, CheckCircle2,
  TrendingUp, PenTool, Users, Send, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    price: 12000,
    profiles: 1,
    postsPerMonth: 20,
    features: ['1 perfil de LinkedIn', 'Optimizacion de perfil con IA', 'Hasta 20 posts/mes', 'Publicacion automatica'],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 20000,
    profiles: 3,
    postsPerMonth: 60,
    popular: true,
    features: ['Hasta 3 perfiles', 'Optimizacion de perfil con IA', 'Hasta 60 posts/mes', 'Publicacion automatica', 'Plan de contenido semanal', 'Soporte prioritario'],
  },
  {
    id: 'agencia',
    name: 'Agencia',
    price: 45000,
    profiles: 10,
    postsPerMonth: 200,
    features: ['Hasta 10 perfiles', 'Optimizacion de perfil con IA', 'Hasta 200 posts/mes', 'Publicacion automatica', 'Plan de contenido semanal', 'Soporte prioritario', 'Reportes de engagement'],
  },
]

const TELEGRAM_BOT_URL = 'https://t.me/LinkedinLab_bot'

type Step = 'plan' | 'profile' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  linkedinName: string | null
  industry: string
  audience: string
  notificationEmail: string
  payerEmail: string
  postsGenerated: number
  postsPublished: number
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function LinkedInPageWrapper() {
  return (
    <Suspense>
      <LinkedInPage />
    </Suspense>
  )
}

function LinkedInPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [linkedinName, setLinkedinName] = useState('')
  const [industry, setIndustry] = useState('')
  const [audience, setAudience] = useState('')
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

  const fetchSubscriptions = () => {
    fetch('/api/linkedin/status')
      .then(r => r.json())
      .then(data => {
        setSubscriptions(data.subscriptions || [])
        setLoadingSubs(false)
      })
      .catch(() => setLoadingSubs(false))
  }

  useEffect(() => { fetchSubscriptions() }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // Step 1: Create subscription record
      const res = await fetch('/api/linkedin/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          linkedinName: linkedinName.trim() || undefined,
          industry,
          audience,
          notificationEmail,
          payerEmail,
          couponCode: couponValid?.valid ? couponCode : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al suscribirse')
        setLoading(false)
        return
      }

      // Step 2: Create MercadoPago preapproval and redirect to checkout
      const mpRes = await fetch('/api/mp/create-linkedin-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionId,
          payerEmail,
        }),
      })
      const mpData = await mpRes.json()
      if (!mpRes.ok) {
        toast.error(mpData.error || 'Error al generar el pago')
        setLoading(false)
        return
      }

      // Redirect to MercadoPago checkout
      if (mpData.init_point) {
        window.location.href = mpData.init_point
        return
      }

      toast.success('Suscripcion creada')
      setStep('done')
      fetchSubscriptions()
    } catch {
      toast.error('Error de conexion')
    }
    setLoading(false)
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const res = await fetch('/api/monitoreo/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
      const data = await res.json()
      setCouponValid({ valid: data.valid, discount: data.discount || 0 })
      if (data.valid) toast.success(`Cupon aplicado: ${data.discount}% de descuento`)
      else toast.error('Cupon invalido')
    } catch {
      toast.error('Error validando cupon')
    }
  }

  // Handle MP return — check payment status
  useEffect(() => {
    if (mpReturn) {
      const preapprovalId = searchParams.get('preapproval_id')
      if (preapprovalId) {
        fetch(`/api/mp/check-subscription?preapproval_id=${preapprovalId}`)
          .then(r => r.json())
          .then(data => {
            if (data.status === 'authorized') {
              toast.success('Pago confirmado! Tu suscripcion esta activa.')
            } else {
              toast.info('El pago esta siendo procesado. Te notificaremos por email.')
            }
            fetchSubscriptions()
          })
          .catch(() => {})
      }
      setStep('done')
    }
  }, [mpReturn])

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar esta suscripcion?')) return
    try {
      const res = await fetch('/api/linkedin/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suscripcion cancelada')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al cancelar')
      }
    } catch {
      toast.error('Error de conexion')
    }
  }

  const activeSubs = subscriptions.filter(s => ['active', 'provisioning', 'pending_payment'].includes(s.status))

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">LinkedIn Optimizer IA</h1>
            <p className="text-sm text-surface-500">Optimiza tu perfil y genera publicaciones de alto impacto</p>
          </div>
        </div>
      </div>

      {/* Active subscriptions */}
      {!loadingSubs && activeSubs.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-surface-800">Tus suscripciones activas</h2>
          {activeSubs.map(sub => (
            <div key={sub.id} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                      sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      sub.status === 'provisioning' ? 'bg-amber-100 text-amber-700' :
                      'bg-surface-100 text-surface-600'
                    }`}>
                      {sub.status === 'active' ? 'Activo' : sub.status === 'provisioning' ? 'Activando...' : 'Pendiente de pago'}
                    </span>
                    <span className="text-sm text-surface-500">Plan {sub.plan}</span>
                  </div>
                  <p className="text-sm text-surface-600">
                    {sub.linkedinName || 'Perfil sin nombre'} &middot; {sub.industry}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {sub.postsGenerated} posts generados &middot; {sub.postsPublished} publicados
                  </p>
                </div>
                <div className="flex gap-2">
                  {sub.status === 'active' && (
                    <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Send className="w-4 h-4" /> Abrir bot en Telegram
                      </Button>
                    </a>
                  )}
                  {['active', 'provisioning', 'pending_payment'].includes(sub.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:border-red-300"
                      onClick={() => handleCancel(sub.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding wizard */}
      <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="flex border-b border-surface-100">
          {['Plan', 'Perfil', 'Cupon', 'Pago'].map((label, i) => {
            const steps: Step[] = ['plan', 'profile', 'coupon', 'payment']
            const currentIdx = steps.indexOf(step)
            const isActive = i <= currentIdx && step !== 'done'
            return (
              <div key={label} className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-surface-400'
              }`}>
                {label}
              </div>
            )
          })}
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Plan selection */}
            {step === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Elegi tu plan</h2>
                <p className="text-sm text-surface-500 mb-6">Todos los planes incluyen IA para optimizacion de perfil y generacion de posts.</p>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50/50 shadow-md'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-surface-900 mb-1">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-surface-900">${plan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span></p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-surface-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <Button
                  variant="gradient"
                  disabled={!selectedPlan}
                  onClick={() => setStep('profile')}
                  className="gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Profile info */}
            {step === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Datos de tu perfil</h2>
                <p className="text-sm text-surface-500 mb-6">Estos datos ayudan a la IA a personalizar las recomendaciones y posts.</p>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Nombre en LinkedIn (opcional)</label>
                    <input
                      type="text"
                      value={linkedinName}
                      onChange={e => setLinkedinName(e.target.value)}
                      placeholder="Ej: Juan Perez"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Industria / Nicho *</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      placeholder="Ej: Marketing digital, Derecho laboral, Tecnologia..."
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Publico objetivo *</label>
                    <input
                      type="text"
                      value={audience}
                      onChange={e => setAudience(e.target.value)}
                      placeholder="Ej: CTOs de startups, reclutadores IT, emprendedores..."
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Email para notificaciones *</label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Email de facturacion *</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      placeholder="facturacion@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={!industry.trim() || !audience.trim() || !notificationEmail.includes('@') || !payerEmail.includes('@')}
                    onClick={() => setStep('coupon')}
                    className="gap-2"
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Coupon */}
            {step === 'coupon' && (
              <motion.div key="coupon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Cupon de descuento</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenes un codigo de descuento, ingresalo aca. Si no, podes continuar.</p>
                <div className="flex gap-3 max-w-sm mb-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                    placeholder="CODIGO"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <Button variant="outline" onClick={validateCoupon} disabled={!couponCode.trim()}>
                    <Tag className="w-4 h-4 mr-1" /> Validar
                  </Button>
                </div>
                {couponValid && (
                  <p className={`text-sm mb-4 flex items-center gap-1 ${couponValid.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {couponValid.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {couponValid.valid ? `${couponValid.discount}% de descuento aplicado` : 'Cupon invalido o expirado'}
                  </p>
                )}
                <div className="bg-surface-50 rounded-xl p-4 mb-6 max-w-sm">
                  <p className="text-sm font-medium text-surface-700">Resumen</p>
                  <p className="text-sm text-surface-500">Plan {selectedPlan}</p>
                  <p className="text-lg font-bold text-surface-900 mt-1">
                    ${(
                      (PLANS.find(p => p.id === selectedPlan)?.price || 0) *
                      (1 - (couponValid?.valid ? couponValid.discount : 0) / 100)
                    ).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-surface-400">/mes</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('profile')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Suscribirme
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-surface-900 mb-2">Suscripcion creada</h2>
                  <p className="text-surface-500 mb-6 max-w-md mx-auto">
                    Tu cuenta esta siendo activada. Recibirás las instrucciones por email.
                    Mientras tanto, podes empezar a usar el bot de Telegram:
                  </p>
                  <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
                    <Button variant="gradient" className="gap-2">
                      <Send className="w-4 h-4" /> Abrir bot en Telegram
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <div className="mt-8 bg-surface-50 rounded-xl p-6 max-w-md mx-auto text-left">
                    <h3 className="font-semibold text-surface-800 mb-3">Como empezar</h3>
                    <ol className="space-y-2 text-sm text-surface-600">
                      <li className="flex gap-2"><span className="font-bold text-blue-600">1.</span> Abri el bot en Telegram</li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">2.</span> Envia /start para comenzar</li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">3.</span> Usa /optimizar para analizar tu perfil</li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">4.</span> Usa /conectar para vincular tu LinkedIn</li>
                      <li className="flex gap-2"><span className="font-bold text-blue-600">5.</span> Usa /publicar para generar y publicar posts</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Features section */}
      <div className="mt-12 grid sm:grid-cols-3 gap-6">
        <div className="bg-white border border-surface-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-surface-900 mb-1">Perfil optimizado</h3>
          <p className="text-sm text-surface-500">La IA analiza tu headline, about, experiencia y genera recomendaciones listas para copiar.</p>
        </div>
        <div className="bg-white border border-surface-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <PenTool className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-surface-900 mb-1">Posts de alto impacto</h3>
          <p className="text-sm text-surface-500">8 tipos de contenido con rotacion inteligente. Storytelling, datos, frameworks, predicciones y mas.</p>
        </div>
        <div className="bg-white border border-surface-200 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-surface-900 mb-1">Human-in-the-loop</h3>
          <p className="text-sm text-surface-500">Vos confirmas o pedis cambios antes de publicar. La IA ajusta hasta que estes conforme.</p>
        </div>
      </div>
    </div>
  )
}
