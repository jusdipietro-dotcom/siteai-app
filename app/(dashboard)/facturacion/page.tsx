'use client'

import { useState, useEffect } from 'react'
import {
  Receipt, Check, Loader2, Tag, AlertCircle, Mail, ExternalLink,
  Building2, Hash, CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

const IVA_CONDITIONS = [
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
  'No Responsable',
]

type Subscription = {
  id: string
  status: string
  plan: string
  cuit: string
  razonSocial: string
  puntoVenta: number
  condicionIva: string
  notificationEmail: string
  payerEmail: string
  flaskTenantId: number | null
  provisionedAt: string | null
  createdAt: string
  updatedAt: string
  coupon?: { code: string; discount: number } | null
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function FacturacionPage() {
  const [ssoLoading, setSsoLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Fetch existing subscriptions
  const fetchSubscriptions = () => {
    fetch('/api/facturacion/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])

  const handleOpenFacturacion = async (sub: Subscription) => {
    setSsoLoading(true)
    try {
      const res = await fetch('/api/facturacion/sso-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: sub.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al generar acceso')
        return
      }
      // Open Flask backend with SSO token
      const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'https://facturacion.automaticialab.com'
      window.open(`${flaskUrl}/auth/portal-login?token=${data.ssoToken}`, '_blank')
    } catch {
      toast.error('Error al acceder a facturacion')
    } finally {
      setSsoLoading(false)
    }
  }

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar esta suscripcion? Se desactivara tu acceso a facturacion.')) return
    try {
      const res = await fetch('/api/facturacion/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suscripcion cancelada')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al cancelar')
      }
    } catch {
      toast.error('Error al cancelar')
    }
  }

  // --- pending_config state (Suite Juridica flow) ---
  const [cfgCuit, setCfgCuit] = useState('')
  const [cfgRazonSocial, setCfgRazonSocial] = useState('')
  const [cfgPuntoVenta, setCfgPuntoVenta] = useState('1')
  const [cfgCondicionIva, setCfgCondicionIva] = useState('Responsable Inscripto')
  const [configuring, setConfiguring] = useState(false)

  const pendingConfigSub = subscriptions.find(s => s.status === 'pending_config')

  const handleConfigure = async (subId: string) => {
    if (!cfgCuit || !cfgRazonSocial || !cfgPuntoVenta) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setConfiguring(true)
    try {
      const res = await fetch('/api/facturacion/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subId,
          cuit: cfgCuit,
          razonSocial: cfgRazonSocial,
          puntoVenta: cfgPuntoVenta,
          condicionIva: cfgCondicionIva,
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
    provisioning: { text: 'Activando (hasta 24hs)', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Facturacion Electronica</h1>
        <p className="text-surface-500 mt-1">Emiti facturas electronicas con CAE automatico. Integrado con ARCA (ex-AFIP).</p>
      </div>

      {/* Loading subscriptions */}
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
                <h3 className="font-semibold text-surface-900 text-sm">Configurar Facturacion Electronica</h3>
                <p className="text-xs text-surface-500">
                  Plan {pendingConfigSub.plan} — Completa los datos para activar el servicio.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">CUIT *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={cfgCuit}
                    onChange={e => setCfgCuit(e.target.value)}
                    placeholder="20-12345678-9"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Razon Social *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={cfgRazonSocial}
                    onChange={e => setCfgRazonSocial(e.target.value)}
                    placeholder="Estudio Juridico Garcia & Asociados"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cfg-pv" className="block text-sm font-medium text-surface-700 mb-1">Punto de Venta *</label>
                  <input
                    id="cfg-pv"
                    type="number"
                    value={cfgPuntoVenta}
                    onChange={e => setCfgPuntoVenta(e.target.value)}
                    min="1"
                    max="99999"
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-iva" className="block text-sm font-medium text-surface-700 mb-1">Condicion IVA</label>
                  <select
                    id="cfg-iva"
                    value={cfgCondicionIva}
                    onChange={e => setCfgCondicionIva(e.target.value)}
                    title="Condicion ante el IVA"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-sm"
                  >
                    {IVA_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Button
                onClick={() => handleConfigure(pendingConfigSub.id)}
                disabled={configuring || !cfgCuit || !cfgRazonSocial || !cfgPuntoVenta}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {configuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activar Facturacion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing subscriptions */}
      {!loadingSubs && subscriptions.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-surface-800 mb-4">Mis suscripciones</h2>
          <div className="space-y-4">
            {subscriptions.map(sub => {
              const st = statusLabel[sub.status] ?? statusLabel.cancelled
              const isActive = sub.status === 'active'
              return (
                <div key={sub.id} className="rounded-2xl border border-surface-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">
                          {sub.razonSocial} — CUIT {sub.cuit}
                        </p>
                        <p className="text-xs text-surface-400">
                          Plan {sub.plan} — PV {sub.puntoVenta} — desde {new Date(sub.createdAt).toLocaleDateString('es-AR')}
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
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Facturacion: <span className="text-surface-700 font-medium">{sub.payerEmail}</span></span>
                    </div>
                    {sub.coupon && (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupon {sub.coupon.code} ({sub.coupon.discount}% off)</span>
                      </div>
                    )}
                  </div>
                  {/* Trial banners */}
                  {sub.status === 'trial' && sub.trialEndsAt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                        <p className="text-xs text-blue-600">
                          Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                  {sub.status === 'trial_expired' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 mx-4 mt-3">
                      <div>
                        <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                        <p className="text-xs text-orange-600">Escribinos por WhatsApp para seguir usando el servicio</p>
                      </div>
                    </div>
                  )}
                  {/* Action buttons */}
                  {(isActive || sub.status === 'provisioning') && (
                    <div className="border-t border-surface-50 px-4 py-3 flex items-center gap-3">
                      {isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenFacturacion(sub)}
                          disabled={ssoLoading}
                          className="gap-1.5"
                        >
                          {ssoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          Ir a Facturacion
                        </Button>
                      )}
                      {sub.status === 'provisioning' && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Configurando tu cuenta de facturacion...
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => handleCancel(sub.id)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Implementacion personalizada por WhatsApp — reemplaza el checkout de MercadoPago */}
      {!loadingSubs && (
        <WhatsAppServiceCTA slug="facturacion" showHeading={false} />
      )}
    </div>
  )
}
