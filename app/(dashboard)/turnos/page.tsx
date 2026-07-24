'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDays, Check, Loader2, AlertCircle,
  Copy, ExternalLink, Settings, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sabado',
}

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
  trialEndsAt?: string | null
  freeAccount?: boolean
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

export default function TurnosPage() {
  // Data state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [config, setConfig] = useState<TurnosConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [editingConfig, setEditingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  const fetchSubscriptions = () => {
    fetch('/api/turnos/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }

  useEffect(() => { fetchSubscriptions() }, [])

  const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'provisioning')
  const pendingConfigSub = subscriptions.find(s => s.status === 'pending_config')

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

  // --- pending_config state (Suite Juridica flow) ---
  const [cfgBusinessName, setCfgBusinessName] = useState('')
  const [cfgSlug, setCfgSlug] = useState('')
  const [cfgPhone, setCfgPhone] = useState('')
  const [cfgAddress, setCfgAddress] = useState('')
  const [configuring, setConfiguring] = useState(false)

  const handleConfigure = async (subId: string) => {
    if (!cfgBusinessName || !cfgSlug) {
      toast.error('Completa al menos el nombre del negocio y el slug')
      return
    }
    setConfiguring(true)
    try {
      const res = await fetch('/api/turnos/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subId,
          businessName: cfgBusinessName,
          slug: normalizeSlug(cfgSlug),
          phone: cfgPhone,
          address: cfgAddress,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Configuracion guardada. Activando servicio...')
        fetchSubscriptions()
      } else {
        toast.error(data.error ?? 'Error al configurar')
      }
    } catch {
      toast.error('Error al configurar')
    } finally {
      setConfiguring(false)
    }
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_config: { text: 'Pendiente de configuracion', color: 'bg-orange-100 text-orange-800' },
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando...', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
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

      {/* Pending configuration (Suite Juridica flow) */}
      {!loadingSubs && pendingConfigSub && (
        <div className="mb-10">
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 overflow-hidden">
            <div className="p-4 border-b border-orange-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 text-sm">Configurar Turnos Online</h3>
                <p className="text-xs text-surface-500">
                  Plan {pendingConfigSub.plan} — Completa los datos de tu negocio para activar la pagina de turnos.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4 max-w-lg">
              <div>
                <label htmlFor="cfg-biz-name" className="block text-sm font-medium text-surface-700 mb-1">Nombre del negocio *</label>
                <input
                  id="cfg-biz-name"
                  type="text"
                  value={cfgBusinessName}
                  onChange={e => setCfgBusinessName(e.target.value)}
                  placeholder="Estudio Juridico Garcia & Asociados"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="cfg-slug" className="block text-sm font-medium text-surface-700 mb-1">Slug (URL publica) *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-400 shrink-0">turnos.automaticialab.com/</span>
                  <input
                    id="cfg-slug"
                    type="text"
                    value={cfgSlug}
                    onChange={e => setCfgSlug(e.target.value)}
                    placeholder="estudio-garcia"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                  />
                </div>
                {cfgSlug && (
                  <p className="text-xs text-surface-400 mt-1">URL final: turnos.automaticialab.com/{normalizeSlug(cfgSlug)}</p>
                )}
              </div>
              <div>
                <label htmlFor="cfg-phone" className="block text-sm font-medium text-surface-700 mb-1">Telefono</label>
                <input
                  id="cfg-phone"
                  type="text"
                  value={cfgPhone}
                  onChange={e => setCfgPhone(e.target.value)}
                  placeholder="11 1234-5678"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="cfg-address" className="block text-sm font-medium text-surface-700 mb-1">Direccion</label>
                <input
                  id="cfg-address"
                  type="text"
                  value={cfgAddress}
                  onChange={e => setCfgAddress(e.target.value)}
                  placeholder="Av. Rivadavia 1234, CABA"
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                />
              </div>
              <Button
                type="button"
                onClick={() => handleConfigure(pendingConfigSub.id)}
                disabled={configuring || !cfgBusinessName || !cfgSlug}
                className="gap-1.5"
              >
                {configuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activar Turnos Online
              </Button>
            </div>
          </div>
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
                      <p className="text-xs text-orange-600">Escribinos por WhatsApp para seguir usando el servicio.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No active subscription: request implementation via WhatsApp */}
      {!loadingSubs && !activeSub && (
        <WhatsAppServiceCTA slug="turnos" showHeading={false} />
      )}
    </div>
  )
}
