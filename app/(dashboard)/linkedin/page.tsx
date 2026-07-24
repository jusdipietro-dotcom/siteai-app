'use client'

import { useState, useEffect } from 'react'
import { Linkedin, Send, TrendingUp, PenTool, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

const TELEGRAM_BOT_URL = 'https://t.me/LinkedinLab_bot'

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
  trialEndsAt?: string | null
  freeAccount?: boolean
}

export default function LinkedInPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

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

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_payment: { text: 'Pendiente de pago', color: 'bg-surface-100 text-surface-600' },
    active: { text: 'Activo', color: 'bg-emerald-100 text-emerald-700' },
    provisioning: { text: 'Activando...', color: 'bg-amber-100 text-amber-700' },
    suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-700' },
    cancelled: { text: 'Cancelado', color: 'bg-surface-100 text-surface-600' },
    trial: { text: 'Trial activo', color: 'bg-blue-100 text-blue-700' },
    trial_expired: { text: 'Trial finalizado', color: 'bg-orange-100 text-orange-700' },
  }

  const activeSubs = subscriptions.filter(s => ['active', 'provisioning', 'pending_payment', 'trial', 'trial_expired'].includes(s.status))

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
                    <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded-full ${(statusLabel[sub.status] ?? statusLabel.pending_payment).color}`}>
                      {(statusLabel[sub.status] ?? statusLabel.pending_payment).text}
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
                  {['active', 'provisioning', 'pending_payment', 'trial', 'trial_expired'].includes(sub.status) && (
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
              {/* Trial banners */}
              {sub.status === 'trial' && sub.trialEndsAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-blue-800">Trial gratuito activo</p>
                  <p className="text-xs text-blue-600">
                    Vence: {new Date(sub.trialEndsAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
              {sub.status === 'trial_expired' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-orange-800">Tu trial ha finalizado</p>
                  <p className="text-xs text-orange-600">Escribinos por WhatsApp para seguir usando el servicio.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Personalised implementation / WhatsApp request */}
      <WhatsAppServiceCTA slug="linkedin" showHeading={false} />

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
