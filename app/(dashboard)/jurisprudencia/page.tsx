'use client'

import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { WhatsAppServiceCTA } from '@/components/shared/WhatsAppServiceCTA'

export default function JurisprudenciaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-blue-600" />
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full mb-4">
          <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
        </span>

        <h1 className="text-3xl font-bold text-surface-900 mb-6">Jurisprudencia IA</h1>

        <div className="grid sm:grid-cols-3 gap-4 text-left">
          {[
            { title: '+285.000 fallos', desc: 'SAIJ, JUBA, SCBA y Corte Suprema con texto completo, actualizado a diario.' },
            { title: 'Búsqueda avanzada', desc: 'Operadores booleanos, filtros por jurisdicción, materia y tribunal, favoritos.' },
            { title: 'Exportá y citá', desc: 'Exportación a PDF y cita automática lista para pegar en tus escritos.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-surface-100 bg-white p-5">
              <h3 className="font-semibold text-surface-800 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-surface-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Implementación personalizada por WhatsApp (misma fuente que la landing) */}
      <WhatsAppServiceCTA slug="jurisprudencia" showHeading={false} />

      {/* Suite Jurídica upsell */}
      <div className="mt-8 text-center">
        <p className="text-xs text-surface-400 mb-2">También incluido en la Suite Jurídica.</p>
        <Link href="/suite-juridica">
          <Button variant="outline" size="sm">
            Ver Suite Jurídica <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
