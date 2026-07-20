import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft, Mail, Clock } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Suscripcion confirmada · AlertaJudicial',
  description:
    'Tu suscripcion a AlertaJudicial fue procesada. Los primeros 60 dias son gratis. El primer cargo se realiza el dia 61.',
  alternates: {
    canonical: 'https://automaticialab.com/alertajudicial/gracias',
  },
  robots: 'noindex, follow',
}

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <section className="flex-1 flex items-center justify-center py-24 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-xl w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-violet-700" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
            Suscripcion confirmada
          </h1>

          <p className="text-lg text-surface-600 mb-8 leading-relaxed">
            Tu suscripcion a AlertaJudicial fue procesada correctamente.
            Recibiras un email con los proximos pasos en los proximos minutos.
          </p>

          <div className="bg-white rounded-2xl border border-violet-100 p-6 mb-8 text-left shadow-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="font-bold text-surface-900 mb-1">
                  60 dias gratis
                </p>
                <p className="text-sm text-surface-500 leading-relaxed">
                  Los primeros 60 dias son sin cargo. El primer debito a tu
                  tarjeta se realiza recien el dia 61, automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="font-bold text-surface-900 mb-1">
                  Proximo paso
                </p>
                <p className="text-sm text-surface-500 leading-relaxed">
                  Nuestro equipo te va a contactar en menos de 24 horas para
                  pedirte tus credenciales del portal y dejarte el sistema
                  funcionando.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-surface-500 mb-6">
            Cualquier consulta:{' '}
            <a
              href="mailto:contacto@automaticialab.com"
              className="text-violet-700 font-medium hover:underline"
            >
              contacto@automaticialab.com
            </a>
          </p>

          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
