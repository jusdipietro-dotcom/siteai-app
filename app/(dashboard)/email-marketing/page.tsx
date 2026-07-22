'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, Clock, Mail, CheckCircle2,
  BarChart3, Users, Zap, Shield, Crown, ArrowUpRight, Upload, FileSpreadsheet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type PlanInfo = {
  id: string
  name: string
  monthly: number
  maxCampaigns: number
  maxContacts: number
  emailsPerDay: number
  maxSenders: number
  customTemplates: boolean
  prioritySupport: boolean
  senderType: string
}

type UsageInfo = {
  activeCampaigns: number
  totalContacts: number
  distinctSenders: number
  senderEmails: string[]
}

type LimitsInfo = {
  plan: string
  planName: string
  maxCampaigns: number
  maxContacts: number
  emailsPerDay: number
  maxSenders: number
  customTemplates: boolean
  prioritySupport: boolean
  onboardingAssisted: boolean
  senderType: string
}

type Subscription = {
  id: string
  status: string
  plan: string
  businessName: string
  contactCount: number
  senderEmail: string
  notificationEmail: string
  payerEmail: string
  provisionedAt: string | null
  n8nWorkflowId: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
  trialEndsAt?: string | null
  freeAccount?: boolean
}

type Step = 'plan' | 'details' | 'coupon' | 'payment' | 'done'

export default function EmailMarketingPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <EmailMarketingDashboard />
    </Suspense>
  )
}

function EmailMarketingDashboard() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const mpStatus = searchParams.get('status')
  const initialPlan = searchParams.get('plan') ?? ''
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')
  const paymentOk = mpStatus === 'approved' || mpStatus === 'pending'
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [businessName, setBusinessName] = useState('')
  const [contactCount, setContactCount] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [limits, setLimits] = useState<LimitsInfo | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  useEffect(() => {
    if (session === null) {
      signIn(undefined, { callbackUrl: '/email-marketing' })
    }
  }, [session])

  const fetchSubscriptions = useCallback(() => {
    setLoadingSubs(true)
    fetch('/api/email-marketing/status')
      .then(r => r.json())
      .then(data => {
        setSubscriptions(data.subscriptions ?? [])
        setPlans(data.plans ?? [])
        setUsage(data.usage ?? null)
        setLimits(data.limits ?? null)
      })
      .catch(() => {})
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
      const res = await fetch('/api/coupons/validate', {
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
      const subRes = await fetch('/api/email-marketing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          businessName,
          contactCount: parseInt(contactCount, 10) || 0,
          senderName,
          senderEmail,
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

      if (subData.nextStep === 'trial_started' || subData.nextStep === 'done') {
        toast.success(subData.freeAccount ? 'Servicio activado!' : 'Trial de 3 dias activado!')
        fetchSubscriptions()
        setStep('plan')
        return
      }

      const mpRes = await fetch('/api/mp/create-email-marketing-subscription', {
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
  const planConfig = plans.find(p => p.id === selectedPlan)
  const discount = couponValid?.valid ? couponValid.discount : 0
  const finalPrice = planConfig ? Math.round(planConfig.monthly * (1 - discount / 100)) : 0

  // Client-side validations based on selected plan
  const parsedContacts = parseInt(contactCount, 10) || 0
  const contactsExceedsPlan = planConfig ? parsedContacts > planConfig.maxContacts : false
  const senderDomain = senderEmail.split('@')[1]?.toLowerCase() ?? ''
  const senderTypeInvalid = planConfig?.senderType === 'gmail' && senderDomain !== '' && senderDomain !== 'gmail.com'

  // Check if user can create a new campaign
  const canCreateCampaign = !limits || (usage && usage.activeCampaigns < limits.maxCampaigns)
  // Explicit null checks so this stays a real boolean: `limits && usage && …`
  // evaluates to `null` while the status request is still in flight (or when the
  // user has no active plan and the API returns `limits: null`), and that null
  // leaked into <Button disabled={…}>, which only accepts boolean | undefined.
  // "Not loaded yet" is not "at the limit", so false is the honest answer.
  const campaignsAtLimit = limits !== null && usage !== null && usage.activeCampaigns >= limits.maxCampaigns

  const [uploadingSub, setUploadingSub] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<{ headers: string[]; rows: string[][]; total: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ contactCount: number; duplicatesRemoved: number; invalidSkipped: number } | null>(null)

  const handleFileSelect = async (file: File) => {
    setUploadFile(file)
    setUploadError(null)
    setUploadResult(null)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (data.length < 2) {
        setUploadError('El archivo necesita al menos una fila de encabezado y una de datos')
        setUploadPreview(null)
        return
      }
      setUploadPreview({
        headers: data[0].map(h => String(h)),
        rows: data.slice(1, 6).map(r => r.map(c => String(c))),
        total: data.length - 1,
      })
    } catch {
      setUploadError('No se pudo leer el archivo')
      setUploadPreview(null)
    }
  }

  const handleUpload = async (subscriptionId: string) => {
    if (!uploadFile) return
    setUploadingSub(subscriptionId)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('subscriptionId', subscriptionId)
      const res = await fetch('/api/email-marketing/upload-contacts', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Error al subir contactos')
        return
      }
      setUploadResult(data)
      setUploadFile(null)
      setUploadPreview(null)
      toast.success(`${data.contactCount.toLocaleString('es-AR')} contactos cargados correctamente`)
      fetchSubscriptions()
    } catch {
      setUploadError('Error al subir el archivo')
    } finally {
      setUploadingSub(null)
    }
  }

  const statusLabel: Record<string, { text: string; color: string; icon: typeof CheckCircle2 }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    awaiting_contacts: { text: 'Subir contactos', color: 'bg-purple-100 text-purple-800', icon: Upload },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
    provisioning: { text: 'Configurando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600', icon: AlertCircle },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  }

  const fmtLimit = (n: number) => n >= 99 ? 'Ilimitado' : String(n)
  const fmtContacts = (n: number) => n.toLocaleString('es-AR')

  if (session === undefined) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Email Marketing Automatizado</h1>
        <p className="text-surface-500 mt-1">Envia emails profesionales a toda tu base de contactos, de forma automatica.</p>
      </div>

      {/* ── Usage & Limits Panel (only when user has active subs) ── */}
      {limits && usage && (
        <div className="mb-8 rounded-2xl border border-surface-100 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-surface-800">Plan {limits.planName}</h2>
            </div>
            {limits.plan !== 'premium' && (
              <button
                onClick={() => { setSelectedPlan(limits.plan === 'basico' ? 'profesional' : 'premium'); setStep('plan') }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                Upgrade <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <UsageMeter
              icon={<BarChart3 className="w-4 h-4" />}
              label="Campanas"
              used={usage.activeCampaigns}
              max={limits.maxCampaigns}
              formatMax={fmtLimit}
            />
            <UsageMeter
              icon={<Users className="w-4 h-4" />}
              label="Contactos"
              used={usage.totalContacts}
              max={limits.maxContacts}
              formatMax={fmtContacts}
            />
            <UsageMeter
              icon={<Mail className="w-4 h-4" />}
              label="Remitentes"
              used={usage.distinctSenders}
              max={limits.maxSenders}
              formatMax={fmtLimit}
            />
            <UsageMeter
              icon={<Zap className="w-4 h-4" />}
              label="Envios/dia"
              used={0}
              max={limits.emailsPerDay}
              formatMax={fmtContacts}
              hideBar
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {limits.customTemplates && <PlanBadge text="Templates personalizados" active />}
            {!limits.customTemplates && <PlanBadge text="Template estandar" />}
            {limits.prioritySupport && <PlanBadge text="Soporte prioritario" active />}
            {limits.onboardingAssisted && <PlanBadge text="Onboarding asistido" active />}
            <PlanBadge
              text={limits.senderType === 'gmail' ? 'Solo Gmail' : limits.senderType === 'workspace' ? 'Gmail + Workspace' : 'Cualquier remitente'}
              active={limits.senderType !== 'gmail'}
            />
          </div>
        </div>
      )}

      {/* ── Existing subscriptions ── */}
      {!loadingSubs && subscriptions.filter(s => s.status !== 'cancelled').length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis campanas</h2>
          <div className="space-y-4">
            {subscriptions.filter(s => s.status !== 'cancelled').map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              const StatusIcon = st.icon
              const subPlan = plans.find(p => p.id === sub.plan)
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Send className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">{sub.businessName}</p>
                        <p className="text-xs text-surface-400">
                          Plan {sub.plan} — {sub.contactCount.toLocaleString('es-AR')} contactos
                          {subPlan && <span className="text-surface-300"> / {fmtContacts(subPlan.maxContacts)} max</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${st.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {st.text}
                    </span>
                  </div>
                  <div className="border-t border-surface-50 px-4 py-3 bg-surface-50/50 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Remitente: <span className="text-surface-700 font-medium">{sub.senderEmail}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-surface-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Creado: <span className="text-surface-700 font-medium">{new Date(sub.createdAt).toLocaleDateString('es-AR')}</span></span>
                    </div>
                    {subPlan && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Hasta <span className="text-surface-700 font-medium">{fmtContacts(subPlan.emailsPerDay)}</span> envios/dia</span>
                      </div>
                    )}
                  </div>

                  {/* Trial banners */}
                  {sub.status === 'trial' && sub.trialEndsAt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                          <p className="text-xs text-blue-600">
                            Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setStep('plan')}>
                          Suscribirse
                        </Button>
                      </div>
                    </div>
                  )}
                  {sub.status === 'trial_expired' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                          <p className="text-xs text-orange-600">Suscribite para seguir usando el servicio</p>
                        </div>
                        <Button size="sm" onClick={() => setStep('plan')}>
                          Elegir plan
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* ── Upload contacts card for awaiting_contacts ── */}
                  {sub.status === 'awaiting_contacts' && (
                    <div className="border-t border-purple-100 bg-purple-50/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-medium text-purple-900">Subi tu base de contactos</p>
                      </div>
                      <p className="text-xs text-purple-700 mb-3">
                        Subi un archivo .csv o .xlsx con las columnas <strong>Email</strong> y <strong>Nombre</strong> (opcional).
                        {subPlan && <span> Tu plan permite hasta <strong>{fmtContacts(subPlan.maxContacts)}</strong> contactos.</span>}
                      </p>

                      {/* File input */}
                      {!uploadFile && !uploadResult && (
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                          <Upload className="w-6 h-6 text-purple-400 mb-1" />
                          <span className="text-xs text-purple-600 font-medium">Seleccionar archivo</span>
                          <span className="text-[10px] text-purple-400">.csv, .xlsx o .xls — max 10 MB</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) handleFileSelect(f)
                            }}
                          />
                        </label>
                      )}

                      {/* Preview */}
                      {uploadFile && uploadPreview && !uploadResult && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                              <span className="text-xs font-medium text-surface-700">{uploadFile.name}</span>
                              <span className="text-[10px] text-surface-400">({uploadPreview.total.toLocaleString('es-AR')} filas)</span>
                            </div>
                            <button
                              type="button"
                              title="Quitar archivo"
                              onClick={() => { setUploadFile(null); setUploadPreview(null); setUploadError(null) }}
                              className="p-1 rounded hover:bg-purple-100 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-surface-400" />
                            </button>
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-purple-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-purple-100/50">
                                  {uploadPreview.headers.map((h, i) => (
                                    <th key={i} className="px-2 py-1.5 text-left font-medium text-purple-800">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {uploadPreview.rows.map((row, ri) => (
                                  <tr key={ri} className="border-t border-purple-50">
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="px-2 py-1 text-surface-600 truncate max-w-[160px]">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {uploadPreview.total > 5 && (
                            <p className="text-[10px] text-surface-400 text-center">
                              Mostrando 5 de {uploadPreview.total.toLocaleString('es-AR')} filas
                            </p>
                          )}
                          <Button
                            variant="gradient"
                            onClick={() => handleUpload(sub.id)}
                            disabled={uploadingSub === sub.id}
                            className="w-full gap-2"
                          >
                            {uploadingSub === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploadingSub === sub.id ? 'Subiendo contactos...' : `Subir ${uploadPreview.total.toLocaleString('es-AR')} contactos`}
                          </Button>
                        </div>
                      )}

                      {/* Upload result */}
                      {uploadResult && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-800">Contactos cargados</span>
                          </div>
                          <div className="text-xs text-emerald-700 space-y-0.5">
                            <p>{uploadResult.contactCount.toLocaleString('es-AR')} contactos validos</p>
                            {uploadResult.duplicatesRemoved > 0 && <p>{uploadResult.duplicatesRemoved} duplicados eliminados</p>}
                            {uploadResult.invalidSkipped > 0 && <p>{uploadResult.invalidSkipped} filas invalidas omitidas</p>}
                          </div>
                          <p className="text-[10px] text-emerald-600 mt-2">Tu campana esta siendo configurada. Te notificaremos cuando este lista.</p>
                        </div>
                      )}

                      {/* Error */}
                      {uploadError && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── MP return status ── */}
      {mpReturn && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 rounded-xl p-4 ${paymentOk ? 'bg-emerald-50 border border-emerald-200' : 'bg-yellow-50 border border-yellow-200'}`}
        >
          <div className="flex items-center gap-3">
            {paymentOk ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-yellow-600" />}
            <div>
              <p className={`font-medium text-sm ${paymentOk ? 'text-emerald-800' : 'text-yellow-800'}`}>
                {paymentOk ? 'Pago procesado correctamente' : 'Pago pendiente de confirmacion'}
              </p>
              <p className={`text-xs ${paymentOk ? 'text-emerald-600' : 'text-yellow-600'}`}>
                {paymentOk
                  ? 'Tu suscripcion esta siendo configurada. En breve recibiras un email con los detalles.'
                  : 'Estamos esperando la confirmacion de MercadoPago. Puede tardar unos minutos.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Campaign limit reached banner ── */}
      {campaignsAtLimit && !mpReturn && (
        <div className="mb-6 rounded-xl p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-sm text-amber-800">
                Alcanzaste el limite de {fmtLimit(limits!.maxCampaigns)} campana{limits!.maxCampaigns > 1 ? 's' : ''} del plan {limits!.planName}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Para agregar mas campanas, hacele upgrade a un plan superior.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout flow ── */}
      {!mpReturn && (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          {/* Step indicator */}
          <div className="flex border-b border-surface-100">
            {['Plan', 'Datos', 'Cupon', 'Pagar'].map((label, i) => {
              const stepKeys: Step[] = ['plan', 'details', 'coupon', 'payment']
              const currentIdx = stepKeys.indexOf(step)
              const isActive = i === currentIdx
              const isDone = i < currentIdx
              return (
                <div key={label} className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${isActive ? 'border-rose-500 text-rose-600' : isDone ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-surface-400'}`}>
                  {isDone ? <Check className="w-3.5 h-3.5 inline mr-1" /> : null}
                  {label}
                </div>
              )
            })}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Plan selection ── */}
              {step === 'plan' && (
                <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-surface-900 mb-4">Elegi tu plan</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {plans.map(p => {
                      const isSelected = selectedPlan === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPlan(p.id)}
                          className={`relative text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-rose-500 bg-rose-50/50' : 'border-surface-100 hover:border-surface-200'}`}
                        >
                          {p.id === 'profesional' && (
                            <span className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Popular</span>
                          )}
                          <p className="font-bold text-surface-900">{p.name}</p>
                          <p className="text-xl font-extrabold text-surface-900 mt-1">
                            ${p.monthly.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span>
                          </p>
                          <ul className="mt-3 space-y-1.5">
                            <PlanFeature text={`${p.maxCampaigns >= 99 ? 'Ilimitadas' : p.maxCampaigns} campana${p.maxCampaigns !== 1 ? 's' : ''}`} />
                            <PlanFeature text={`Hasta ${fmtContacts(p.maxContacts)} contactos`} />
                            <PlanFeature text={`${fmtContacts(p.emailsPerDay)} envios/dia`} />
                            <PlanFeature text={`${p.maxSenders >= 99 ? 'Ilimitados' : p.maxSenders} remitente${p.maxSenders !== 1 ? 's' : ''}`} />
                            <PlanFeature text={p.senderType === 'gmail' ? 'Solo Gmail' : p.senderType === 'workspace' ? 'Gmail + Workspace' : 'Cualquier email'} />
                            <PlanFeature text={p.customTemplates ? 'Templates personalizados' : 'Template estandar'} />
                            <PlanFeature text={p.prioritySupport ? 'Soporte prioritario' : 'Soporte por email'} />
                          </ul>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="gradient"
                      disabled={!selectedPlan || (campaignsAtLimit && selectedPlan === limits?.plan)}
                      onClick={() => setStep('details')}
                      className="gap-2"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Business details ── */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-surface-900 mb-1">Datos de tu negocio</h2>
                  {planConfig && (
                    <p className="text-xs text-surface-400 mb-4">
                      Plan {planConfig.name} — hasta {fmtContacts(planConfig.maxContacts)} contactos, {fmtContacts(planConfig.emailsPerDay)} envios/dia
                    </p>
                  )}
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Nombre del negocio / marca</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="Ej: Mi Tienda Online"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">
                        Cantidad de contactos (aprox.)
                        {planConfig && <span className="text-surface-400 font-normal"> — max {fmtContacts(planConfig.maxContacts)}</span>}
                      </label>
                      <input
                        type="number"
                        value={contactCount}
                        onChange={e => setContactCount(e.target.value)}
                        placeholder="Ej: 2000"
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-rose-500/20 outline-none ${contactsExceedsPlan ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-rose-500'}`}
                      />
                      {contactsExceedsPlan && planConfig && (
                        <p className="mt-1 text-xs text-red-500">
                          El plan {planConfig.name} permite hasta {fmtContacts(planConfig.maxContacts)} contactos. Necesitas un plan superior.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Nombre del remitente</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Ej: Equipo Mi Tienda"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">
                        Email de envio
                        {planConfig && (
                          <span className="text-surface-400 font-normal">
                            {planConfig.senderType === 'gmail' ? ' — solo @gmail.com' : planConfig.senderType === 'workspace' ? ' — Gmail o Workspace' : ' — cualquier email'}
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        placeholder={planConfig?.senderType === 'gmail' ? 'tunegocio@gmail.com' : 'contacto@mitienda.com'}
                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-rose-500/20 outline-none ${senderTypeInvalid ? 'border-red-400 focus:border-red-500' : 'border-surface-200 focus:border-rose-500'}`}
                      />
                      {senderTypeInvalid && (
                        <p className="mt-1 text-xs text-red-500">
                          El plan Basico solo permite @gmail.com. Para usar tu dominio propio, elegi el plan Profesional o Premium.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Email de notificaciones</label>
                      <input
                        type="email"
                        value={notificationEmail}
                        onChange={e => setNotificationEmail(e.target.value)}
                        placeholder="Ej: tu@email.com"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Email de facturacion</label>
                      <input
                        type="email"
                        value={payerEmail}
                        onChange={e => setPayerEmail(e.target.value)}
                        placeholder="Ej: facturacion@email.com"
                        className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('plan')} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                    <Button
                      variant="gradient"
                      disabled={
                        !businessName.trim() ||
                        !senderName.trim() ||
                        !isValidEmail(senderEmail) ||
                        !isValidEmail(notificationEmail) ||
                        !isValidEmail(payerEmail) ||
                        contactsExceedsPlan ||
                        senderTypeInvalid
                      }
                      onClick={() => setStep('coupon')}
                      className="gap-2"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Coupon ── */}
              {step === 'coupon' && (
                <motion.div key="coupon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-surface-900 mb-4">Cupon de descuento</h2>
                  <div className="max-w-md">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                          placeholder="Codigo de cupon (opcional)"
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={validateCoupon}
                        disabled={!couponCode.trim() || validatingCoupon}
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                      </Button>
                    </div>
                    {couponValid?.valid && (
                      <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> {couponValid.discount}% de descuento aplicado
                      </p>
                    )}

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-surface-50 rounded-xl">
                      <p className="text-sm font-medium text-surface-700 mb-2">Resumen</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-surface-500">Plan {planConfig?.name}</span>
                          <span className="text-surface-700">${planConfig?.monthly.toLocaleString('es-AR')}/mes</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Descuento ({discount}%)</span>
                            <span>-${((planConfig?.monthly ?? 0) - finalPrice).toLocaleString('es-AR')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-surface-900 pt-1 border-t border-surface-200">
                          <span>Total mensual</span>
                          <span>${finalPrice.toLocaleString('es-AR')}/mes</span>
                        </div>
                      </div>
                      {/* Plan limits reminder */}
                      {planConfig && (
                        <div className="mt-3 pt-3 border-t border-surface-200 space-y-1 text-xs text-surface-400">
                          <p>{planConfig.maxCampaigns >= 99 ? 'Ilimitadas' : planConfig.maxCampaigns} campana{planConfig.maxCampaigns !== 1 ? 's' : ''} — {fmtContacts(planConfig.maxContacts)} contactos — {fmtContacts(planConfig.emailsPerDay)} envios/dia</p>
                          <p>{planConfig.maxSenders >= 99 ? 'Ilimitados' : planConfig.maxSenders} remitente{planConfig.maxSenders !== 1 ? 's' : ''} — {planConfig.customTemplates ? 'Templates personalizados' : 'Template estandar'} — {planConfig.prioritySupport ? 'Soporte prioritario' : 'Soporte por email'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('details')} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={() => setStep('payment')}
                      className="gap-2"
                    >
                      Continuar al pago <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Payment ── */}
              {step === 'payment' && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-lg font-bold text-surface-900 mb-4">Confirmar y pagar</h2>
                  <div className="max-w-md">
                    <div className="p-4 bg-surface-50 rounded-xl space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-surface-500">Negocio</span><span className="text-surface-700 font-medium">{businessName}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Plan</span><span className="text-surface-700 font-medium">{planConfig?.name}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Contactos</span><span className="text-surface-700 font-medium">{parsedContacts.toLocaleString('es-AR')}</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Remitente</span><span className="text-surface-700 font-medium">{senderName} ({senderEmail})</span></div>
                      <div className="flex justify-between"><span className="text-surface-500">Envios/dia</span><span className="text-surface-700 font-medium">{planConfig ? fmtContacts(planConfig.emailsPerDay) : '-'}</span></div>
                      <div className="flex justify-between font-bold text-surface-900 pt-2 border-t border-surface-200">
                        <span>Total</span>
                        <span>${finalPrice.toLocaleString('es-AR')}/mes</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-surface-400">
                      Seras redirigido a MercadoPago para completar la suscripcion mensual. Podes cancelar en cualquier momento.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => setStep('coupon')} className="gap-2">
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {submitting ? 'Procesando...' : 'Pagar con MercadoPago'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── DONE step ── */}
              {step === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-center py-8">
                    <CheckCircle2 className={`w-12 h-12 mx-auto mb-4 ${paymentOk ? 'text-emerald-500' : 'text-yellow-500'}`} />
                    <h2 className="text-xl font-bold text-surface-900 mb-2">
                      {paymentOk ? 'Suscripcion activada' : 'Pago pendiente'}
                    </h2>
                    <p className="text-surface-500 text-sm max-w-md mx-auto">
                      {paymentOk
                        ? 'Tu servicio de email marketing esta siendo configurado. Te enviaremos un email con los proximos pasos.'
                        : 'Estamos esperando la confirmacion de tu pago. Te notificaremos por email cuando se acredite.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helper components ── */

function PlanFeature({ text }: { text: string }) {
  return (
    <li className="text-xs text-surface-500 flex items-start gap-1.5">
      <Check className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" /> {text}
    </li>
  )
}

function PlanBadge({ text, active }: { text: string; active?: boolean }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${active ? 'bg-rose-100 text-rose-700' : 'bg-surface-100 text-surface-500'}`}>
      {text}
    </span>
  )
}

function UsageMeter({
  icon, label, used, max, formatMax, hideBar,
}: {
  icon: React.ReactNode; label: string; used: number; max: number; formatMax: (n: number) => string; hideBar?: boolean
}) {
  const pct = max >= 99 ? (used > 0 ? Math.min(used * 10, 100) : 0) : Math.min((used / max) * 100, 100)
  const isNearLimit = pct >= 80 && max < 99
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-surface-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-surface-900">
        {used.toLocaleString('es-AR')}
        <span className="text-surface-400 font-normal text-xs"> / {formatMax(max)}</span>
      </p>
      {!hideBar && (
        <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
