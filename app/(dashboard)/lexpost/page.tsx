'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  FileText, Check, Loader2, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

const PLAN_INFO: Record<string, { name: string; features: string[] }> = {
  basico: {
    name: 'Basico',
    features: [
      '1 cuenta de Instagram',
      '10 publicaciones/mes',
      'Censura automatica con OCR',
      'Caratula con branding',
      'Copy con IA',
    ],
  },
  profesional: {
    name: 'Profesional',
    features: [
      '1 cuenta de Instagram',
      'Publicaciones ilimitadas',
      'Censura automatica con OCR',
      'Caratula con branding personalizado',
      'Copy con IA',
      'Notificaciones Telegram',
      'Soporte prioritario',
    ],
  },
  estudio: {
    name: 'Estudio',
    features: [
      'Hasta 3 cuentas de Instagram',
      'Publicaciones ilimitadas',
      'Censura automatica con OCR',
      'Branding personalizado por cuenta',
      'Copy con IA',
      'Notificaciones Telegram',
      'Soporte prioritario',
      'Onboarding personalizado',
    ],
  },
}

type Subscription = {
  id: string
  status: string
  plan: string
  igUsername: string | null
  publicationsUsed: number
  publicationsLimit: number
  notificationEmail: string
  createdAt: string
  provisionedAt: string | null
  trialEndsAt: string | null
  coupon?: { code: string; discount: number } | null
  freeAccount?: boolean
}

export default function LexPostPage() {
  const { data: session } = useSession()
  const [existingSub, setExistingSub] = useState<Subscription | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/lexpost/status')
        .then(r => r.json())
        .then(data => {
          if (data.subscription) {
            setExistingSub(data.subscription)
          }
        })
        .catch(() => {})
        .finally(() => setCheckingStatus(false))
    } else {
      setCheckingStatus(false)
    }
  }, [session])

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
      </div>
    )
  }

  // Active subscription view
  if (existingSub && ['active', 'trial', 'provisioning'].includes(existingSub.status)) {
    const plan = PLAN_INFO[existingSub.plan]
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LexPost Legal</h1>
            <p className="text-surface-500 text-sm">Publicacion legal profesional para Instagram</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-green-700">Servicio activo</span>
              </div>
              <p className="text-sm text-surface-500 mt-1">Plan {plan?.name || existingSub.plan}</p>
            </div>
            {existingSub.igUsername && (
              <div className="text-right">
                <p className="text-xs text-surface-400">Instagram</p>
                <p className="text-sm font-medium">@{existingSub.igUsername}</p>
              </div>
            )}
          </div>

          {existingSub.publicationsLimit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-surface-500">Publicaciones este mes</span>
                <span className="font-medium">{existingSub.publicationsUsed} / {existingSub.publicationsLimit}</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (existingSub.publicationsUsed / existingSub.publicationsLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <a
              href="https://lexpost.automaticialab.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-800 hover:from-indigo-700 hover:to-blue-900" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir LexPost
              </Button>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-sm mb-3">Tu plan incluye</h3>
          <div className="space-y-2">
            {plan?.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // No active subscription: personalised WhatsApp implementation flow
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">LexPost Legal</h1>
        <p className="text-surface-500 mt-2 max-w-lg mx-auto">
          Publica resoluciones judiciales en Instagram de forma profesional.
          Censura automatica, caratula con tu branding y publicacion directa.
        </p>
      </div>

      <WhatsAppServiceCTA slug="lexpost" showHeading={false} />
    </div>
  )
}
