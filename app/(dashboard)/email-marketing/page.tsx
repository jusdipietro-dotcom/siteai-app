'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import {
  Send, Loader2, AlertCircle, Clock, Mail, CheckCircle2,
  BarChart3, Users, Zap, Shield, Crown, Upload, FileSpreadsheet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

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

export default function EmailMarketingDashboard() {
  const { data: session } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [limits, setLimits] = useState<LimitsInfo | null>(null)

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

  // Explicit null checks so this stays a real boolean: `limits && usage && …`
  // evaluates to `null` while the status request is still in flight (or when the
  // user has no active plan and the API returns `limits: null`). "Not loaded
  // yet" is not "at the limit", so false is the honest answer.
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
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-surface-800">Plan {limits.planName}</h2>
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
                      <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                      <p className="text-xs text-blue-600">
                        Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {sub.status === 'trial_expired' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                      <p className="text-xs text-orange-600">Escribinos por WhatsApp para seguir usando el servicio</p>
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

      {/* ── Campaign limit reached banner ── */}
      {campaignsAtLimit && (
        <div className="mb-6 rounded-xl p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-sm text-amber-800">
                Alcanzaste el limite de {fmtLimit(limits!.maxCampaigns)} campana{limits!.maxCampaigns > 1 ? 's' : ''} del plan {limits!.planName}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Para agregar mas campanas, escribinos por WhatsApp y te pasamos a un plan superior.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Personalised implementation via WhatsApp (replaces self-checkout) ── */}
      <WhatsAppServiceCTA slug="email-marketing" showHeading={false} />
    </div>
  )
}

/* ── Helper components ── */

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
