'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Mail, CheckCircle2,
  BarChart3, FileSpreadsheet, ExternalLink, Globe, Briefcase, MapPin,
  Palette, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PROSPECCION_PLANS_LIST, type ProspeccionPlanConfig } from '@/lib/prospeccion-plans'

type Step = 'plan' | 'details' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  businessName: string
  senderName: string
  senderEmail: string
  website: string
  nichesList: string[]
  citiesList: string[]
  serviciosDesc: string
  colorPrimario: string
  notificationEmail: string
  payerEmail: string
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
}

export default function ProspeccionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <ProspeccionPage />
    </Suspense>
  )
}

function ProspeccionPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const mpStatus = searchParams.get('status')
  const initialPlan = searchParams.get('plan') ?? ''
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const paymentOk = mpStatus === 'approved' || mpStatus === 'pending'
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [businessName, setBusinessName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [nichesList, setNichesList] = useState('')
  const [citiesList, setCitiesList] = useState('')
  const [serviciosDesc, setServiciosDesc] = useState('')
  const [colorPrimario, setColorPrimario] = useState('#2563eb')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  useEffect(() => {
    if (session === null) {
      signIn(undefined, { callbackUrl: '/prospeccion' })
    }
  }, [session])

  const fetchSubscriptions = useCallback(() => {
    setLoadingSubs(true)
    fetch('/api/prospeccion/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }, [])
  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])
  useEffect(() => {
    if (mpReturn) fetchSubscriptions()
  }, [mpReturn, fetchSubscriptions])

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setValidatingCoupon(true)
    try {
      const res = await fetch('/api/prospeccion/validate-coupon', {
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
      setValidatingCoupon(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const subRes = await fetch('/api/prospeccion/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          businessName,
          senderName,
          senderEmail,
          website: website.trim() || undefined,
          nichesList: nichesList.split(',').map(s => s.trim()).filter(Boolean),
          citiesList: citiesList.split(',').map(s => s.trim()).filter(Boolean),
          serviciosDesc,
          colorPrimario,
          notificationEmail,
          payerEmail,
          couponCode: couponValid?.valid ? couponCode : undefined,
        }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) {
        toast.error(subData.error)
        setSubmitting(false)
        return
      }

      const mpRes = await fetch('/api/mp/create-prospeccion-subscription', {
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
        setSubmitting(false)
        return
      }

      window.location.href = mpData.init_point
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const planConfig = PROSPECCION_PLANS_LIST.find(p => p.id === selectedPlan)
  const discount = couponValid?.valid ? couponValid.discount : 0
  const finalPrice = planConfig ? Math.round(planConfig.monthly * (1 - discount / 100)) : 0

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Configurando', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    provision_failed: { text: 'Error de activacion', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
  }

  if (session === undefined) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Prospeccion B2B con IA</h1>
        <p className="text-surface-500 mt-1">LeadGen + Icebreaker: capta leads y envia emails personalizados con IA, todo automatico.</p>
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
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">Plan {sub.plan} — {sub.businessName}</p>
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
                      <span>Sender: <span className="text-surface-700 font-medium">{sub.senderEmail}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web: <span className="text-surface-700 font-medium">{sub.website || '-'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Notificaciones: <span className="text-surface-700 font-medium">{sub.notificationEmail}</span></span>
                    </div>
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
                          disabled={cancellingId === sub.id}
                          onClick={async () => {
                            if (!confirm('Seguro que queres cancelar esta suscripcion? Se dejara de prospectar automaticamente.')) return
                            setCancellingId(sub.id)
                            try {
                              const res = await fetch('/api/prospeccion/cancel', {
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
                            } finally {
                              setCancellingId(null)
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                        >
                          {cancellingId === sub.id ? 'Cancelando...' : 'Cancelar suscripcion'}
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
          {([
            { key: 'plan' as Step, label: 'Plan' },
            { key: 'details' as Step, label: 'Datos' },
            { key: 'coupon' as Step, label: 'Cupon' },
            { key: 'payment' as Step, label: 'Pago' },
          ]).map(({ key, label }, i, arr) => {
            const currentIdx = arr.findIndex(s => s.key === (step === 'done' ? 'payment' : step))
            const isDone = i < currentIdx
            const isCurrent = i === currentIdx
            return (
              <div key={key} className="flex-1 relative">
                <div className={`h-1 ${isDone ? 'bg-orange-500' : isCurrent ? 'bg-orange-300' : 'bg-surface-100'}`} />
                <p className={`text-[10px] text-center py-2 font-medium ${isCurrent ? 'text-orange-600' : isDone ? 'text-emerald-600' : 'text-surface-400'}`}>
                  {label}
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
                <p className="text-sm text-surface-500 mb-6">Prospeccion automatica: captacion de leads + emails personalizados con IA.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {PROSPECCION_PLANS_LIST.map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => { setSelectedPlan(plan.id); setStep('details') }}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                        selectedPlan === plan.id ? 'border-orange-500 bg-orange-50' : 'border-surface-100 hover:border-surface-200'
                      }`}
                    >
                      {plan.id === 'profesional' && (
                        <span className="absolute -top-2.5 left-4 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      <p className="font-bold text-surface-900 text-lg mb-1">{plan.name}</p>
                      <p className="text-2xl font-extrabold text-orange-600 mb-3">
                        ${plan.monthly.toLocaleString('es-AR')}<span className="text-sm font-medium text-surface-400">/mes</span>
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
                <h2 className="text-xl font-bold text-surface-900 mb-2">Configura tu prospeccion</h2>
                <p className="text-sm text-surface-500 mb-6">Completa los datos de tu negocio para personalizar la captacion y los emails.</p>

                <div className="space-y-5">
                  {/* Business name */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Briefcase className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Nombre del negocio
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="Mi Empresa S.A."
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* Sender name + email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Nombre del sender
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Juan"
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">
                        <Mail className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Email de envio
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        placeholder="juan@miempresa.com"
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Globe className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Dominio / Website
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="miempresa.com"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* Nichos */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Briefcase className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Nichos de prospeccion <span className="text-surface-400 font-normal">(separados por coma)</span>
                    </label>
                    <input
                      type="text"
                      value={nichesList}
                      onChange={e => setNichesList(e.target.value)}
                      placeholder="restaurantes, hoteles, gimnasios"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <p className="text-[11px] text-surface-400 mt-1">Industrias o rubros donde queres captar prospectos.</p>
                  </div>

                  {/* Ciudades */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Ciudades <span className="text-surface-400 font-normal">(separadas por coma)</span>
                    </label>
                    <input
                      type="text"
                      value={citiesList}
                      onChange={e => setCitiesList(e.target.value)}
                      placeholder="Buenos Aires, Rosario, Cordoba"
                      className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* Servicios description */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Descripcion de tus servicios
                    </label>
                    <textarea
                      value={serviciosDesc}
                      onChange={e => setServiciosDesc(e.target.value)}
                      placeholder="Describimos brevemente que ofreces para que la IA personalice los emails de prospeccion..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
                    />
                  </div>

                  {/* Color primario */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      <Palette className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                      Color primario de marca
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={colorPrimario}
                        onChange={e => setColorPrimario(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-surface-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colorPrimario}
                        onChange={e => setColorPrimario(e.target.value)}
                        placeholder="#2563eb"
                        className="w-32 h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Notification + payer emails */}
                  <div className="grid sm:grid-cols-2 gap-4">
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
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
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
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </Button>
                  <Button
                    variant="gradient"
                    disabled={
                      !businessName.trim() ||
                      !senderName.trim() ||
                      !isValidEmail(senderEmail) ||
                      !nichesList.trim() ||
                      !citiesList.trim() ||
                      !serviciosDesc.trim() ||
                      !isValidEmail(notificationEmail) ||
                      !isValidEmail(payerEmail)
                    }
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
                    className="flex-1 h-10 px-3 rounded-xl border border-surface-200 text-sm uppercase focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                  <Button variant="outline" onClick={validateCoupon} disabled={validatingCoupon || !couponCode.trim()}>
                    {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
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
                    <span className="text-surface-500">Negocio</span>
                    <span className="font-medium text-surface-900">{businessName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Sender</span>
                    <span className="font-medium text-surface-900">{senderName} ({senderEmail})</span>
                  </div>
                  {website.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">Website</span>
                      <span className="font-medium text-surface-900">{website}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-surface-500">Nichos</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nichesList.split(',').map(s => s.trim()).filter(Boolean).map(n => (
                        <span key={n} className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-medium">{n}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-surface-500">Ciudades</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {citiesList.split(',').map(s => s.trim()).filter(Boolean).map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Notificaciones</span>
                    <span className="font-medium text-surface-900">{notificationEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Facturacion</span>
                    <span className="font-medium text-surface-900">{payerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-surface-500">Color</span>
                    <span className="w-5 h-5 rounded border border-surface-200" style={{ backgroundColor: colorPrimario }} />
                    <span className="font-mono text-surface-700 text-xs">{colorPrimario}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="border-t border-surface-200 pt-3 flex justify-between text-sm">
                        <span className="text-surface-500">Precio original</span>
                        <span className="text-surface-400 line-through">${planConfig?.monthly.toLocaleString('es-AR')}/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Descuento</span>
                        <span className="text-emerald-600 font-medium">-{discount}%</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-surface-200 pt-3 flex justify-between">
                    <span className="font-bold text-surface-900">Total mensual</span>
                    <span className="font-extrabold text-xl text-orange-600">${finalPrice.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 max-w-lg">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800">
                    Una vez confirmado el pago, activamos tu sistema de prospeccion. Los leads se captan automaticamente y los emails se envian con IA.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('coupon')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Atras
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-2"
                  >
                    {submitting ? (
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
                      <p className="text-sm text-surface-500 mb-6">Tu sistema de prospeccion esta siendo activado.</p>
                      <div className="space-y-3 text-left bg-surface-50 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span className="text-surface-700">{mpStatus === 'approved' ? 'Pago confirmado' : 'Pago pendiente de acreditacion'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Target className="w-5 h-5 text-orange-500 shrink-0" />
                          <span className="text-surface-700">Activando prospeccion automatica</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-5 h-5 text-surface-400 shrink-0" />
                          <span className="text-surface-700">Revisa tu email para mas detalles</span>
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
                      setSelectedPlan('')
                      setBusinessName('')
                      setSenderName('')
                      setSenderEmail('')
                      setWebsite('')
                      setNichesList('')
                      setCitiesList('')
                      setServiciosDesc('')
                      setColorPrimario('#2563eb')
                      setCouponCode('')
                      setCouponValid(null)
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
