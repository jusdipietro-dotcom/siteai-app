'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import {
  Search, Mail, Tag, Loader2, CheckCircle2,
  BarChart3, FileSpreadsheet, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

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
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function LeadsPage() {
  const { data: session } = useSession()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (session === null) {
      signIn(undefined, { callbackUrl: '/leads' })
    }
  }, [session])

  const fetchSubscriptions = useCallback(() => {
    setLoadingSubs(true)
    fetch('/api/leads/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }, [])
  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  const scrollToWhatsAppCta = () => {
    document.getElementById('whatsapp-cta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Configurando', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    provision_failed: { text: 'Error de activacion', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  // Show loading while session is being resolved
  if (session === undefined) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>
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
                        <Button size="sm" variant="outline" onClick={scrollToWhatsAppCta}>
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
                        <Button size="sm" onClick={scrollToWhatsAppCta}>
                          Elegir plan
                        </Button>
                      </div>
                    </div>
                  )}
                  {isActive && (
                    <div className="border-t border-surface-100 px-4 py-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={cancellingId === sub.id}
                          onClick={async () => {
                            if (!confirm('Seguro que queres cancelar esta suscripcion? Se dejaran de generar leads automaticamente.')) return
                            setCancellingId(sub.id)
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

      {/* Manual sign-up via WhatsApp — this product is implemented per-client, not sold via self-checkout */}
      <div id="whatsapp-cta">
        <WhatsAppServiceCTA slug="leads" showHeading={false} />
      </div>
    </div>
  )
}
