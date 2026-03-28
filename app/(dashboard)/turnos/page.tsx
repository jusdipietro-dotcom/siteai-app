'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Check, ArrowRight, ArrowLeft,
  Loader2, Tag, AlertCircle, CheckCircle2,
  Copy, ExternalLink, Settings, Plus, X, Clock, Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'basico',
    name: 'Basico',
    price: 12000,
    features: [
      '1 profesional',
      'Lunes a viernes',
      '1 area de practica',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina de reservas publica',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 25000,
    popular: true,
    features: [
      '1 profesional',
      'Lunes a sabado',
      'Hasta 5 areas de practica',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina personalizada (colores + logo)',
      'Soporte prioritario',
    ],
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 50000,
    features: [
      'Hasta 3 profesionales',
      'Lunes a sabado',
      'Areas ilimitadas',
      'Google Calendar integrado',
      'Confirmacion por email',
      'Pagina personalizada (colores + logo)',
      'Subdominio propio',
      'Soporte dedicado',
    ],
  },
]

const DEFAULT_AREAS = [
  'Civil', 'Penal', 'Laboral', 'Familia', 'Sucesiones',
  'Accidentes de trabajo', 'Despidos', 'Comercial', 'Administrativo',
]

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado',
}

type Step = 'plan' | 'negocio' | 'horarios' | 'apariencia' | 'coupon' | 'payment' | 'done'

type Subscription = {
  id: string
  status: string
  plan: string
  slug: string
  businessName: string
  businessType: string
  notificationEmail: string
  provisionedAt: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
}

type TurnosConfig = {
  id: string
  slug: string
  businessName: string
  businessType: string
  colorPrimary: string
  colorAccent: string
  scheduleDays: number[]
  scheduleSlots: Record<string, string[]>
  slotDuration: number
  practiceAreas: string[]
  holidays: string[]
  phone: string
  address: string
  notificationEmail: string
  publicUrl: string
}

export default function TurnosPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
      <TurnosPage />
    </Suspense>
  )
}

function TurnosPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const mpReturn = searchParams.get('mp_return')
  const [step, setStep] = useState<Step>(mpReturn ? 'done' : 'plan')

  // Wizard state
  const [selectedPlan, setSelectedPlan] = useState('')
  const [slug, setSlug] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('Estudio Juridico')
  const [practiceAreas, setPracticeAreas] = useState<string[]>(['Civil'])
  const [newArea, setNewArea] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [slotDuration, setSlotDuration] = useState(30)
  const [colorPrimary, setColorPrimary] = useState('#1a365d')
  const [colorAccent, setColorAccent] = useState('#c9a84c')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null)
  const [loading, setLoading] = useState(false)

  // Data state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [config, setConfig] = useState<TurnosConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [editingConfig, setEditingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      if (!notificationEmail) setNotificationEmail(session.user.email)
      if (!payerEmail) setPayerEmail(session.user.email)
    }
  }, [session?.user?.email])

  const fetchSubscriptions = () => {
    fetch('/api/turnos/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }

  useEffect(() => { fetchSubscriptions() }, [])
  useEffect(() => {
    if (mpReturn) fetchSubscriptions()
  }, [mpReturn])

  const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'provisioning')

  // Load config when active subscription exists
  useEffect(() => {
    if (activeSub?.status === 'active') {
      setLoadingConfig(true)
      fetch('/api/turnos/config')
        .then(r => r.json())
        .then(data => {
          if (!data.error) setConfig(data)
        })
        .catch(() => toast.error('Error al cargar configuracion'))
        .finally(() => setLoadingConfig(false))
    }
  }, [activeSub?.id, activeSub?.status])

  const normalizeSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const validateCoupon = async () => {
    if (!couponCode.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/turnos/validate-coupon', {
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

  // Build scheduleSlots from days + time range
  const buildScheduleSlots = () => {
    const slots: Record<string, string[]> = {}
    for (const day of selectedDays) {
      const daySlots: string[] = []
      let [h, m] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      while (h < eh || (h === eh && m < em)) {
        daySlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
        m += slotDuration
        if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
      }
      slots[String(day)] = daySlots
    }
    return slots
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const scheduleSlots = buildScheduleSlots()
      const subRes = await fetch('/api/turnos/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          slug: normalizeSlug(slug),
          businessName,
          businessType,
          practiceAreas,
          scheduleDays: selectedDays,
          scheduleSlots,
          slotDuration,
          colorPrimary,
          colorAccent,
          phone,
          address,
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

      const mpRes = await fetch('/api/mp/create-turnos-subscription', {
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

      window.location.href = mpData.init_point
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar? Se desactivara tu pagina de turnos y ya no recibiras reservas.')) return
    try {
      const res = await fetch('/api/turnos/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suscripcion cancelada')
        fetchSubscriptions()
        setConfig(null)
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al cancelar')
      }
    } catch {
      toast.error('Error al cancelar')
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setSavingConfig(true)
    try {
      const res = await fetch('/api/turnos/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleDays: config.scheduleDays,
          scheduleSlots: config.scheduleSlots,
          slotDuration: config.slotDuration,
          practiceAreas: config.practiceAreas,
          holidays: config.holidays,
          colorPrimary: config.colorPrimary,
          colorAccent: config.colorAccent,
          phone: config.phone,
          address: config.address,
          businessName: config.businessName,
        }),
      })
      if (res.ok) {
        toast.success('Configuracion guardada')
        setEditingConfig(false)
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar configuracion')
    } finally {
      setSavingConfig(false)
    }
  }

  const copyPublicUrl = () => {
    if (config?.publicUrl) {
      navigator.clipboard.writeText(config.publicUrl)
      toast.success('URL copiada al portapapeles')
    }
  }

  const planConfig = PLANS.find(p => p.id === selectedPlan)
  const discount = couponValid?.valid ? couponValid.discount : 0
  const finalPrice = planConfig ? Math.round(planConfig.price * (1 - discount / 100)) : 0
  const maxDays = selectedPlan === 'basico' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]
  const planMaxAreas = selectedPlan === 'basico' ? 1 : selectedPlan === 'profesional' ? 5 : 999

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando...', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Turnos Online</h1>
        <p className="text-surface-500 mt-1">Gestioná turnos online con pagina de reservas publica, integrada con Google Calendar.</p>
      </div>

      {/* Loading */}
      {loadingSubs && (
        <div className="mb-10 flex items-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando suscripciones...</span>
        </div>
      )}

      {/* Active subscription: Config panel */}
      {activeSub?.status === 'active' && (
        <div className="mb-10">
          {/* Status bar */}
          <div className="rounded-2xl border border-surface-100 bg-white p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm">
                  Plan {activeSub.plan} — {config?.businessName || activeSub.businessName}
                </p>
                <p className="text-xs text-surface-400">
                  Slug: {config?.slug || activeSub.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config?.publicUrl && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={copyPublicUrl}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar URL
                  </Button>
                  <a href={config.publicUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver pagina
                    </Button>
                  </a>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCancel(activeSub.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Config panel */}
          {loadingConfig ? (
            <div className="flex items-center gap-3 text-surface-500 py-10 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando configuracion...</span>
            </div>
          ) : config ? (
            <div className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-surface-100">
                <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Configuracion
                </h3>
                <Button
                  size="sm"
                  variant={editingConfig ? 'default' : 'outline'}
                  onClick={() => editingConfig ? handleSaveConfig() : setEditingConfig(true)}
                  disabled={savingConfig}
                >
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {editingConfig ? 'Guardar cambios' : 'Editar'}
                </Button>
              </div>
              <div className="p-4 space-y-6">
                {/* Business info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Nombre del negocio</label>
                    {editingConfig ? (
                      <input
                        type="text"
                        value={config.businessName}
                        onChange={e => setConfig({ ...config, businessName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="text-sm text-surface-900">{config.businessName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Telefono</label>
                    {editingConfig ? (
                      <input
                        type="text"
                        value={config.phone}
                        onChange={e => setConfig({ ...config, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="text-sm text-surface-900">{config.phone || '—'}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Direccion</label>
                    {editingConfig ? (
                      <input
                        type="text"
                        value={config.address}
                        onChange={e => setConfig({ ...config, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    ) : (
                      <p className="text-sm text-surface-900">{config.address || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Schedule */}
                <div>
                  <label className="text-xs font-medium text-surface-500 mb-2 block">Dias disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(DAY_NAMES).map(([num, name]) => {
                      const day = Number(num)
                      const isSelected = config.scheduleDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={!editingConfig}
                          onClick={() => {
                            if (!editingConfig) return
                            const newDays = isSelected
                              ? config.scheduleDays.filter(d => d !== day)
                              : [...config.scheduleDays, day].sort()
                            setConfig({ ...config, scheduleDays: newDays })
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-surface-50 text-surface-400 border border-surface-200'
                          } ${editingConfig ? 'cursor-pointer hover:opacity-80' : ''}`}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Practice areas */}
                <div>
                  <label className="text-xs font-medium text-surface-500 mb-2 block">Areas de practica</label>
                  <div className="flex flex-wrap gap-2">
                    {config.practiceAreas.map(area => (
                      <span key={area} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-50 text-surface-700 text-xs border border-surface-200">
                        {area}
                        {editingConfig && (
                          <button
                            type="button"
                            onClick={() => setConfig({ ...config, practiceAreas: config.practiceAreas.filter(a => a !== area) })}
                            className="text-surface-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Color primario</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-surface-200" style={{ backgroundColor: config.colorPrimary }} />
                      {editingConfig ? (
                        <input
                          type="color"
                          value={config.colorPrimary}
                          onChange={e => setConfig({ ...config, colorPrimary: e.target.value })}
                          className="w-10 h-8 cursor-pointer"
                        />
                      ) : (
                        <span className="text-xs text-surface-500 font-mono">{config.colorPrimary}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-500 mb-1 block">Color acento</label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border border-surface-200" style={{ backgroundColor: config.colorAccent }} />
                      {editingConfig ? (
                        <input
                          type="color"
                          value={config.colorAccent}
                          onChange={e => setConfig({ ...config, colorAccent: e.target.value })}
                          className="w-10 h-8 cursor-pointer"
                        />
                      ) : (
                        <span className="text-xs text-surface-500 font-mono">{config.colorAccent}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Public URL */}
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                  <p className="text-xs font-medium text-indigo-800 mb-1">Pagina publica de reservas</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-indigo-600 break-all flex-1">{config.publicUrl}</code>
                    <button onClick={copyPublicUrl} className="text-indigo-500 hover:text-indigo-700">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Provisioning state */}
      {activeSub?.status === 'provisioning' && (
        <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-800">Activando tu servicio</h3>
          <p className="text-sm text-blue-600 mt-1">Estamos configurando tu pagina de turnos. Esto puede tardar unos minutos.</p>
        </div>
      )}

      {/* Existing subscriptions list (non-active) */}
      {!loadingSubs && subscriptions.filter(s => s.status !== 'active' && s.status !== 'provisioning').length > 0 && !activeSub && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.filter(s => s.status !== 'active' && s.status !== 'provisioning').map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">
                          Plan {sub.plan} — {sub.businessName}
                        </p>
                        <p className="text-xs text-surface-400">
                          Desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wizard: only show if no active subscription */}
      {!loadingSubs && !activeSub && (
        <AnimatePresence mode="wait">
          {/* STEP: Plan selection */}
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h2 className="text-lg font-semibold text-surface-800 mb-4">Elegir plan</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan.id)
                      if (plan.id === 'basico') setSelectedDays([1, 2, 3, 4, 5])
                      setStep('negocio')
                    }}
                    className={`relative rounded-2xl border p-6 text-left transition-all hover:shadow-md ${
                      selectedPlan === plan.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                        : 'border-surface-200 bg-white hover:border-surface-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-3 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <p className="font-semibold text-surface-900">{plan.name}</p>
                    <p className="text-2xl font-bold text-surface-900 mt-2">
                      ${plan.price.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span>
                    </p>
                    {plan.id === 'basico' && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">3 dias de prueba gratis</p>
                    )}
                    <ul className="mt-4 space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-surface-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <span className="w-full inline-flex justify-center py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white">
                        Elegir plan
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: Negocio */}
          {step === 'negocio' && (
            <motion.div key="negocio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('plan')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver a planes
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Datos del negocio</h2>
                <p className="text-sm text-surface-500 mb-6">Configura la informacion basica de tu estudio o negocio.</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Nombre del estudio / negocio *</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={e => {
                        setBusinessName(e.target.value)
                        if (!slug || slug === normalizeSlug(businessName)) {
                          setSlug(normalizeSlug(e.target.value))
                        }
                      }}
                      placeholder="Ej: Estudio Juridico Garcia & Asociados"
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">URL de tu pagina de turnos *</label>
                    <div className="flex items-center gap-0">
                      <span className="text-sm text-surface-400 bg-surface-50 border border-r-0 border-surface-200 px-3 py-3 rounded-l-xl whitespace-nowrap">
                        automaticialab.com/turnos/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={e => setSlug(normalizeSlug(e.target.value))}
                        placeholder="mi-estudio"
                        className="w-full px-3 py-3 rounded-r-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-surface-400 mt-1">Solo letras, numeros y guiones. Min 3 caracteres.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Tipo de negocio</label>
                    <select
                      value={businessType}
                      onChange={e => setBusinessType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option>Estudio Juridico</option>
                      <option>Consultorio Medico</option>
                      <option>Consultorio Odontologico</option>
                      <option>Consultorio Psicologico</option>
                      <option>Contador Publico</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">
                      Areas de practica {planMaxAreas < 999 ? `(max ${planMaxAreas})` : ''}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {practiceAreas.map(area => (
                        <span key={area} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs border border-indigo-200">
                          {area}
                          <button type="button" onClick={() => setPracticeAreas(practiceAreas.filter(a => a !== area))} className="text-indigo-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {practiceAreas.length < planMaxAreas && (
                      <div className="flex gap-2">
                        <select
                          value={newArea}
                          onChange={e => {
                            const val = e.target.value
                            if (val && !practiceAreas.includes(val)) {
                              setPracticeAreas([...practiceAreas, val])
                            }
                            setNewArea('')
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white outline-none"
                        >
                          <option value="">Agregar area...</option>
                          {DEFAULT_AREAS.filter(a => !practiceAreas.includes(a)).map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-1 block">Telefono</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Ej: 11-5555-0000"
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-1 block">Direccion</label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Ej: Av. Mitre 500, Quilmes"
                        className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!businessName.trim() || businessName.trim().length < 3) { toast.error('Nombre del negocio muy corto'); return }
                      if (!slug || slug.length < 3) { toast.error('El slug debe tener al menos 3 caracteres'); return }
                      if (practiceAreas.length === 0) { toast.error('Agrega al menos un area de practica'); return }
                      setStep('horarios')
                    }}
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Horarios */}
          {step === 'horarios' && (
            <motion.div key="horarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('negocio')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Horarios de atencion</h2>
                <p className="text-sm text-surface-500 mb-6">Configura los dias y horarios disponibles para turnos.</p>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-2 block">Dias de atencion</label>
                    <div className="flex flex-wrap gap-2">
                      {maxDays.map(day => {
                        const isSelected = selectedDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setSelectedDays(isSelected
                                ? selectedDays.filter(d => d !== day)
                                : [...selectedDays, day].sort()
                              )
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                              isSelected
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : 'bg-white text-surface-500 border-surface-200 hover:border-surface-300'
                            }`}
                          >
                            {DAY_NAMES[day]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-1 block">Hora de inicio</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                          type="time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-1 block">Hora de fin</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                          type="time"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Duracion de turno</label>
                    <select
                      value={slotDuration}
                      onChange={e => setSlotDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl bg-surface-50 border border-surface-200 p-4">
                    <p className="text-xs font-medium text-surface-500 mb-2">Vista previa de horarios</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const slots: string[] = []
                        let [h, m] = startTime.split(':').map(Number)
                        const [eh, em] = endTime.split(':').map(Number)
                        while (h < eh || (h === eh && m < em)) {
                          slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                          m += slotDuration
                          if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
                        }
                        return slots.slice(0, 12).map(s => (
                          <span key={s} className="px-2 py-1 rounded-lg bg-white text-xs text-surface-600 border border-surface-200">{s}</span>
                        ))
                      })()}
                      {(() => {
                        let count = 0
                        let [h, m] = startTime.split(':').map(Number)
                        const [eh, em] = endTime.split(':').map(Number)
                        while (h < eh || (h === eh && m < em)) { count++; m += slotDuration; if (m >= 60) { h += Math.floor(m / 60); m = m % 60 } }
                        return count > 12 ? <span className="px-2 py-1 text-xs text-surface-400">+{count - 12} mas</span> : null
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={() => {
                      if (selectedDays.length === 0) { toast.error('Selecciona al menos un dia'); return }
                      const planAllowsCustom = selectedPlan !== 'basico'
                      if (planAllowsCustom) {
                        setStep('apariencia')
                      } else {
                        setStep('coupon')
                      }
                    }}
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Apariencia (only for profesional/estudio) */}
          {step === 'apariencia' && (
            <motion.div key="apariencia" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('horarios')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Apariencia de tu pagina</h2>
                <p className="text-sm text-surface-500 mb-6">Personaliza los colores de tu pagina de reservas.</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-2 block">Color primario</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colorPrimary}
                          onChange={e => setColorPrimary(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border border-surface-200"
                        />
                        <input
                          type="text"
                          value={colorPrimary}
                          onChange={e => setColorPrimary(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-surface-700 mb-2 block">Color acento</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colorAccent}
                          onChange={e => setColorAccent(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border border-surface-200"
                        />
                        <input
                          type="text"
                          value={colorAccent}
                          onChange={e => setColorAccent(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview card */}
                  <div className="rounded-xl border border-surface-200 overflow-hidden">
                    <div className="p-4" style={{ backgroundColor: colorPrimary }}>
                      <p className="text-white font-semibold text-sm">{businessName || 'Mi Estudio'}</p>
                      <p className="text-white/70 text-xs">{businessType}</p>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-xs text-surface-500 mb-2">Vista previa del boton:</p>
                      <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: colorAccent }}>
                        Reservar turno
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => setStep('coupon')}>
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Cupon */}
          {step === 'coupon' && (
            <motion.div key="coupon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => selectedPlan === 'basico' ? setStep('horarios') : setStep('apariencia')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Cupon de descuento</h2>
                <p className="text-sm text-surface-500 mb-6">Si tenes un cupon, ingresalo a continuacion. Si no, podes saltar este paso.</p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponValid(null) }}
                        placeholder="CODIGO"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none uppercase font-mono tracking-wide"
                      />
                    </div>
                    <Button variant="outline" onClick={validateCoupon} disabled={loading || !couponCode.trim()}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                    </Button>
                  </div>
                  {couponValid?.valid && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Descuento de {couponValid.discount}% aplicado
                    </div>
                  )}
                  {couponValid && !couponValid.valid && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" /> Cupon invalido o expirado
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <Button onClick={() => setStep('payment')}>
                    Continuar <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: Payment */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto">
                <button onClick={() => setStep('coupon')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <h2 className="text-lg font-semibold text-surface-800 mb-1">Confirmar y pagar</h2>
                <p className="text-sm text-surface-500 mb-6">Revisa el resumen y procede al pago con MercadoPago.</p>

                {/* Summary */}
                <div className="rounded-2xl border border-surface-100 bg-white p-6 space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Plan</span>
                    <span className="font-medium text-surface-900">{planConfig?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Negocio</span>
                    <span className="font-medium text-surface-900">{businessName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">URL</span>
                    <span className="font-mono text-xs text-indigo-600">/turnos/{normalizeSlug(slug)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Areas</span>
                    <span className="font-medium text-surface-900">{practiceAreas.join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Horario</span>
                    <span className="font-medium text-surface-900">
                      {selectedDays.map(d => DAY_NAMES[d]?.slice(0, 3)).join(', ')} {startTime}-{endTime}
                    </span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Precio original</span>
                        <span className="text-surface-400 line-through">${planConfig?.price.toLocaleString('es-AR')}/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-surface-500">Descuento</span>
                        <span className="text-emerald-600 font-medium">-{discount}%</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-surface-100 pt-4 flex justify-between">
                    <span className="font-semibold text-surface-900">Total</span>
                    <span className="text-xl font-bold text-surface-900">${finalPrice.toLocaleString('es-AR')}<span className="text-sm font-normal text-surface-400">/mes</span></span>
                  </div>
                  {selectedPlan === 'basico' && (
                    <p className="text-xs text-emerald-600 font-medium text-center">Los primeros 3 dias son gratis</p>
                  )}
                </div>

                {/* Emails */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Email para notificaciones de turnos *</label>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={e => setNotificationEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-700 mb-1 block">Email de facturacion *</label>
                    <input
                      type="email"
                      value={payerEmail}
                      onChange={e => setPayerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-6 text-base"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Procesando...</>
                  ) : (
                    <>Pagar con MercadoPago <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: Done (return from MP) */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="max-w-lg mx-auto text-center py-12">
                {activeSub ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Suscripcion activa</h2>
                    <p className="text-surface-500 mb-6">Tu pagina de turnos esta configurada y lista para recibir reservas.</p>
                    <Button onClick={() => { setStep('plan'); fetchSubscriptions() }}>
                      Ver mi configuracion
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Procesando pago</h2>
                    <p className="text-surface-500 mb-6">Estamos verificando tu pago. Puede tardar unos minutos.</p>
                    <Button variant="outline" onClick={fetchSubscriptions}>
                      <Loader2 className="w-4 h-4 mr-2" /> Verificar estado
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
