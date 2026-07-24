'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight, Loader2, Shield, Receipt, CalendarDays, FileSearch, Briefcase, Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'
import { getProduct, whatsappHrefFor } from '@/data/product-catalog'

const SERVICES = [
  { icon: Scale, label: 'Notificaciones Judiciales', href: '/monitoreo', color: 'bg-blue-100 text-blue-600' },
  { icon: Receipt, label: 'Facturacion ARCA', href: '/facturacion', color: 'bg-green-100 text-green-600' },
  { icon: FileSearch, label: 'Dashboard Causas', href: '/causas', color: 'bg-purple-100 text-purple-600' },
  { icon: CalendarDays, label: 'Turnos Online', href: '/turnos', color: 'bg-indigo-100 text-indigo-600' },
]

type Subscription = {
  id: string
  status: string
  plan: string
  monitoringSubId: string | null
  facturacionSubId: string | null
  causasSubId: string | null
  turnosSubId: string | null
  provisionedAt: string | null
  createdAt: string
  coupon?: { code: string; discount: number } | null
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function SuiteJuridicaPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  const fetchSubscriptions = () => {
    fetch('/api/suite-juridica/status')
      .then(r => r.json())
      .then(data => setSubscriptions(data.subscriptions ?? []))
      .catch(() => toast.error('Error al cargar suscripciones'))
      .finally(() => setLoadingSubs(false))
  }
  useEffect(() => { fetchSubscriptions() }, [])

  const activeSub = subscriptions.find(s => ['active', 'provisioning', 'trial', 'trial_expired'].includes(s.status))

  const handleCancel = async (subId: string) => {
    if (!confirm('Estas seguro de cancelar la Suite Juridica? Se desactivaran los 4 servicios incluidos.')) return
    try {
      const res = await fetch('/api/suite-juridica/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      if (res.ok) {
        toast.success('Suite Juridica cancelada')
        fetchSubscriptions()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al cancelar')
      }
    } catch {
      toast.error('Error al cancelar')
    }
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-800' },
    provisioning: { text: 'Activando...', color: 'bg-blue-100 text-blue-800' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  const suiteProduct = getProduct('suite-juridica')
  const suiteWhatsAppHref = suiteProduct ? whatsappHrefFor(suiteProduct) : '#'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Suite Juridica</h1>
            <p className="text-surface-500 text-sm">4 servicios integrados con descuento exclusivo para profesionales del derecho.</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingSubs && (
        <div className="mb-10 flex items-center gap-3 text-surface-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      )}

      {/* Active suite: services dashboard */}
      {(activeSub?.status === 'active' || activeSub?.status === 'trial' || activeSub?.status === 'trial_expired') && (
        <div className="mb-10 space-y-6">
          {/* Status bar */}
          <div className="rounded-2xl border border-surface-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm">
                  Suite Juridica — Plan {activeSub.plan}
                </p>
                <p className="text-xs text-surface-400">
                  4 servicios activos desde {new Date(activeSub.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusLabel[activeSub.status]?.color}`}>
                {statusLabel[activeSub.status]?.text}
              </span>
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

          {/* Services grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {SERVICES.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-surface-100 bg-white p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 text-sm group-hover:text-blue-600 transition-colors">{label}</p>
                    <p className="text-xs text-surface-400">Incluido en tu suite — Ir a configurar</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* Jurisprudencia IA teaser */}
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900 text-sm flex items-center gap-2">
                  Jurisprudencia IA
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                    Proximamente
                  </span>
                </p>
                <p className="text-xs text-surface-400">
                  {activeSub.plan === 'estudio'
                    ? 'Acceso prioritario cuando se lance. Te notificaremos.'
                    : 'Acceso disponible cuando se lance.'}
                </p>
              </div>
            </div>
          </div>

          {/* Trial banners */}
          {activeSub?.status === 'trial' && activeSub.trialEndsAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                  <p className="text-xs text-blue-600">
                    Vence: {new Date(activeSub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <a
                  href={suiteWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-9 px-3 rounded-lg border border-surface-200 text-sm font-medium hover:bg-surface-50 transition-colors"
                >
                  Solicitar por WhatsApp
                </a>
              </div>
            </div>
          )}
          {activeSub?.status === 'trial_expired' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                  <p className="text-xs text-orange-600">Suscribite para seguir usando los servicios</p>
                </div>
                <a
                  href={suiteWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-9 px-3 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Solicitar por WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provisioning state */}
      {activeSub?.status === 'provisioning' && (
        <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-800">Activando tu Suite Juridica</h3>
          <p className="text-sm text-blue-600 mt-1">Estamos configurando tus 4 servicios. Esto puede tardar unos minutos.</p>
        </div>
      )}

      {/* Previous subscriptions */}
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
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 text-sm">Suite Juridica — Plan {sub.plan}</p>
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

      {/* No active subscription: request personalised implementation via WhatsApp */}
      {!loadingSubs && !activeSub && (
        <WhatsAppServiceCTA slug="suite-juridica" showHeading={false} />
      )}
    </div>
  )
}
