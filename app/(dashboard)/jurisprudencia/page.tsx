'use client'

import { Shield, ArrowRight, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function JurisprudenciaPage() {
  const { data: session } = useSession()
  const [subscribed, setSubscribed] = useState(false)

  const handleNotify = () => {
    setSubscribed(true)
    toast.success('Te notificaremos cuando Jurisprudencia IA este disponible.')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-amber-600" />
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-4">
          Proximamente
        </span>

        <h1 className="text-3xl font-bold text-surface-900 mb-3">Jurisprudencia IA</h1>
        <p className="text-surface-500 text-lg max-w-xl mx-auto mb-8">
          Busca jurisprudencia relevante con inteligencia artificial. Analisis de fallos, extractos automaticos y sugerencias de precedentes para tus causas.
        </p>

        {/* Features preview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { title: 'Busqueda inteligente', desc: 'Encontra fallos relevantes con lenguaje natural, sin necesidad de busquedas exactas.' },
            { title: 'Analisis automatico', desc: 'Resumenes y extractos de resoluciones clave generados por IA.' },
            { title: 'Precedentes sugeridos', desc: 'Recibis sugerencias de jurisprudencia vinculada a tus causas activas.' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-surface-100 bg-white p-5 text-left">
              <h3 className="font-semibold text-surface-800 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-surface-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 max-w-md mx-auto">
          {!subscribed ? (
            <>
              <p className="text-sm text-surface-700 mb-4">
                Dejanos tu interes y te avisamos cuando este disponible.
                {session?.user?.email && (
                  <span className="block text-xs text-surface-400 mt-1">
                    Te notificaremos a {session.user.email}
                  </span>
                )}
              </p>
              <Button onClick={handleNotify} className="bg-amber-500 hover:bg-amber-600">
                <Bell className="w-4 h-4 mr-2" /> Avisame cuando este listo
              </Button>
            </>
          ) : (
            <div className="text-sm text-amber-700 font-medium flex items-center justify-center gap-2">
              <Bell className="w-4 h-4" /> Te vamos a avisar cuando este listo.
            </div>
          )}
        </div>

        {/* Suite Juridica upsell */}
        <div className="mt-8 text-center">
          <p className="text-xs text-surface-400 mb-2">
            Los planes Profesional y Estudio de la Suite Juridica incluyen acceso anticipado.
          </p>
          <Link href="/suite-juridica">
            <Button variant="outline" size="sm">
              Ver Suite Juridica <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
