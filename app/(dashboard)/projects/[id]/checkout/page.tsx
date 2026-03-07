'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Check, Lock, Shield, Sparkles,
  Star, Zap, Mail, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types'

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS: {
  id: Plan
  name: string
  price: string
  period: string
  description: string
  icon: typeof Zap
  popular?: boolean
  features: string[]
}[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 'ARS $12.000',
    period: '/mes',
    description: 'Publicá tu sitio y empezá a crecer',
    icon: Zap,
    features: [
      'Publicación en subdominio gratuito',
      '1 proyecto activo',
      'Certificado SSL incluido',
      'Actualizaciones ilimitadas de contenido',
      'Soporte por email',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 'ARS $29.000',
    period: '/mes',
    description: 'Todo lo que necesitás para destacarte',
    icon: Star,
    popular: true,
    features: [
      'Todo lo de Essential',
      'Dominio personalizado',
      'Proyectos ilimitados',
      'Analíticas avanzadas',
      'Soporte prioritario 24/7',
      'Sin marca de agua SiteAI',
    ],
  },
]

// ─── Inner component (useSearchParams requires Suspense wrapper) ──────────────

function CheckoutContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { projects, setProjectPlan } = useProjectStore()
  const project = projects.find((p) => p.id === id)

  const [selectedPlan, setSelectedPlan] = useState<Plan>('essential')
  const [step, setStep] = useState<'plan' | 'payment' | 'verifying' | 'success'>('plan')
  const [processing, setProcessing] = useState(false)
  const [payerEmail, setPayerEmail] = useState('')

  // Si ya tiene plan pago, redirigir directo a publicar
  useEffect(() => {
    if (project?.hasPaid && step === 'plan') {
      router.replace(`/projects/${id}/publish`)
    }
  }, [project?.hasPaid, id, step, router])

  // Detectar retorno desde MercadoPago
  useEffect(() => {
    const mpReturn = searchParams.get('mp_return')
    const preapprovalId = searchParams.get('preapproval_id')

    if (mpReturn !== 'true') return

    if (preapprovalId) {
      setStep('verifying')
      verifyPayment(preapprovalId)
    } else {
      toast.error('El pago no se completó. Podés intentar de nuevo.')
      setStep('payment')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verifyPayment = async (preapprovalId: string) => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/mp/check-subscription?id=${preapprovalId}`)
      const data = await res.json()

      if (data.status === 'authorized') {
        const [, planFromRef] = (data.external_reference ?? '').split(':')
        const activePlan = (planFromRef as Plan) || selectedPlan
        setSelectedPlan(activePlan)
        setProjectPlan(id, activePlan)
        setStep('success')
        toast.success('¡Suscripción activada correctamente!')
      } else if (data.status === 'pending') {
        setStep('payment')
        toast('Tu suscripción está pendiente. MP te notificará por email cuando se confirme.', {
          icon: '⏳',
          duration: 7000,
        })
      } else {
        setStep('payment')
        toast.error('El pago no fue aprobado. Intentá con otro medio de pago en MercadoPago.')
      }
    } catch {
      setStep('payment')
      toast.error('Error verificando el pago. Contactá soporte si el problema persiste.')
    } finally {
      setProcessing(false)
    }
  }

  const handleMPPayment = async () => {
    if (!payerEmail || !payerEmail.includes('@')) {
      toast.error('Ingresá un email válido para continuar')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/mp/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, projectId: id, payerEmail }),
      })
      const data = await res.json()

      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        toast.error(data.error ?? 'Error al iniciar el pago. Intentá de nuevo.')
        setProcessing(false)
      }
    } catch {
      toast.error('Error de conexión con MercadoPago')
      setProcessing(false)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-surface-500">
        Proyecto no encontrado
      </div>
    )
  }

  const plan = PLANS.find((p) => p.id === selectedPlan)!

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Topbar */}
      <div className="bg-white border-b border-surface-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {step !== 'success' && step !== 'verifying' && (
            <button
              type="button"
              onClick={() => (step === 'payment' ? setStep('plan') : router.back())}
              className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-surface-900">
              {step === 'plan'
                ? 'Elegí tu plan'
                : step === 'payment'
                ? 'Confirmar suscripción'
                : step === 'verifying'
                ? 'Verificando pago...'
                : '¡Suscripción activada!'}
            </h1>
            <p className="text-sm text-surface-500">{project.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-surface-400">
            <Lock className="w-3.5 h-3.5" />
            Pago seguro · MercadoPago
          </div>
        </div>

        {(step === 'plan' || step === 'payment') && (
          <div className="max-w-4xl mx-auto mt-4 flex items-center gap-2">
            {[
              { key: 'plan', label: 'Plan' },
              { key: 'payment', label: 'Pago' },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    step === s.key || (step === 'payment' && s.key === 'plan')
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-200 text-surface-500'
                  )}
                >
                  {step === 'payment' && s.key === 'plan' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    step === s.key ? 'text-surface-900' : 'text-surface-400'
                  )}
                >
                  {s.label}
                </span>
                {i < 1 && <div className="w-12 h-px bg-surface-200 mx-1" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">

          {/* ─── Step 1: Plan selection ─── */}
          {step === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-surface-500 text-center mb-8">
                La vista previa es gratuita. Para publicar tu sitio, elegí el plan que mejor se adapta.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {PLANS.map((p) => {
                  const Icon = p.icon
                  const isSelected = selectedPlan === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={cn(
                        'relative text-left bg-white rounded-2xl border-2 p-6 transition-all',
                        isSelected
                          ? 'border-brand-500 shadow-md ring-2 ring-brand-500/15'
                          : 'border-surface-200 hover:border-surface-300 hover:shadow-sm'
                      )}
                    >
                      {p.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-brand">
                          MÁS POPULAR
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-brand-500" />
                            <span className="font-bold text-surface-900">{p.name}</span>
                          </div>
                          <p className="text-xs text-surface-500">{p.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="text-xl font-extrabold text-surface-900">{p.price}</span>
                          <span className="text-xs text-surface-400 block">{p.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-surface-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-5 h-5 gradient-brand rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2 shadow-brand"
                onClick={() => setStep('payment')}
              >
                Continuar con {plan.name} — {plan.price}/mes
              </Button>
              <p className="text-xs text-center text-surface-400 mt-4">
                Podés cancelar en cualquier momento desde tu cuenta de MercadoPago. Sin permanencia mínima.
              </p>
            </motion.div>
          )}

          {/* ─── Step 2: MercadoPago payment ─── */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6"
            >
              <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
                <h2 className="font-semibold text-surface-900">Completar suscripción</h2>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">
                    Tu email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="tunombre@email.com"
                      className="field-input pl-9"
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">
                    MercadoPago envía el comprobante y gestiona tu suscripción a este email.
                  </p>
                </div>

                {/* Cómo funciona */}
                <div className="bg-surface-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-surface-700 mb-2">¿Qué va a pasar?</p>
                  <ol className="space-y-1.5 text-xs text-surface-500">
                    {[
                      'Te redirigimos al checkout seguro de MercadoPago',
                      'Elegís tu tarjeta, cuenta MP o cualquier medio de pago',
                      `MP te cobra ${plan.price} hoy y luego automáticamente cada mes`,
                      'Volvés aquí con tu suscripción activa y el sitio listo para publicar',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="font-bold text-brand-500 shrink-0">{i + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* MP Button */}
                <button
                  type="button"
                  onClick={handleMPPayment}
                  disabled={processing || !payerEmail.includes('@')}
                  className={cn(
                    'w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all text-sm',
                    processing || !payerEmail.includes('@')
                      ? 'bg-[#009ee3]/40 cursor-not-allowed'
                      : 'bg-[#009ee3] hover:bg-[#0088cc] active:scale-[0.98] shadow-md'
                  )}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Conectando con MercadoPago...
                    </span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <circle cx="24" cy="24" r="24" fill="white" />
                        <path d="M10 24C10 16.268 16.268 10 24 10C27.866 10 31.366 11.567 33.9 14.1L37.8 10.2C34.267 6.933 29.383 5 24 5C13.507 5 5 13.507 5 24C5 34.493 13.507 43 24 43C34.493 43 43 34.493 43 24H37.5C37.5 31.456 31.456 37.5 24 37.5C16.544 37.5 10.5 31.456 10.5 24H10Z" fill="#009EE3" />
                      </svg>
                      Suscribirse con MercadoPago — {plan.price}/mes
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-xs text-surface-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Pago procesado por MercadoPago. No almacenamos datos de tarjeta.
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-surface-100 p-5">
                  <h3 className="font-semibold text-surface-900 mb-4 text-sm">Resumen</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600">Plan {plan.name}</span>
                      <span className="font-semibold">{plan.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600">Proyecto</span>
                      <span className="text-surface-500 text-xs truncate max-w-[130px] text-right">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600">Frecuencia</span>
                      <span className="text-surface-500 text-xs">Mensual · automático</span>
                    </div>
                    <div className="border-t border-surface-100 pt-3 flex justify-between font-bold">
                      <span className="text-surface-900">Total hoy</span>
                      <span className="text-brand-600">{plan.price}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Garantía 30 días
                  </p>
                  <p className="text-xs text-emerald-700">
                    Si no estás conforme, cancelás y te devolvemos el dinero.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-surface-100 p-4">
                  <p className="text-xs font-semibold text-surface-700 mb-2">Incluye:</p>
                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-surface-500">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Verifying ─── */}
          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md mx-auto text-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-6"
              />
              <h2 className="text-lg font-bold text-surface-900 mb-2">Verificando tu suscripción...</h2>
              <p className="text-sm text-surface-500">
                Confirmando el pago con MercadoPago. Un momento.
              </p>
            </motion.div>
          )}

          {/* ─── Step 3: Success ─── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-12"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-24 h-24 gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-brand"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-2xl font-extrabold text-surface-900 mb-2">¡Suscripción activa!</h2>
              <p className="text-surface-500 text-sm mb-2">
                Plan <strong className="text-surface-700">{plan.name}</strong> activado para{' '}
                <strong className="text-surface-700">{project.name}</strong>.
              </p>
              <p className="text-surface-400 text-xs mb-8">
                MercadoPago debitará {plan.price} automáticamente cada mes.
                Podés gestionar o cancelar desde tu cuenta MP.
              </p>

              <div className="flex flex-col gap-3">
                <Link href={`/projects/${id}/publish`}>
                  <Button variant="gradient" size="lg" className="w-full shadow-brand gap-2">
                    Publicar mi sitio →
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="w-full">
                    Ir al dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Wrapper con Suspense (requerido por useSearchParams en Next.js 14) ───────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-50">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
