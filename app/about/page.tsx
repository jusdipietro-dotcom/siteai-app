import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description: 'Automatic IA Lab es una plataforma argentina de automatizacion con inteligencia artificial. Conoce al equipo, nuestra mision y por que existimos.',
  alternates: { canonical: 'https://automaticialab.com/about' },
  openGraph: {
    title: 'Sobre nosotros — Automatic IA Lab',
    description: 'Plataforma argentina de automatizacion con IA. Conoce nuestra mision, equipo y valores.',
    url: 'https://automaticialab.com/about',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Automatic IA Lab' }],
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-surface-950 mb-6">
            Sobre nosotros
          </h1>

          <p className="text-lg text-surface-600 leading-relaxed mb-8">
            Automatic IA Lab nacio con una mision clara: democratizar el acceso a la tecnologia para
            negocios locales en Argentina y Latinoamerica. Creemos que cada emprendedor, profesional
            independiente y pyme merece herramientas digitales de calidad, sin necesidad de ser experto
            en tecnologia ni invertir fortunas en desarrollo.
          </p>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Nuestra mision</h2>
          <p className="text-surface-600 leading-relaxed mb-8">
            Automatizar lo repetitivo para que los negocios se enfoquen en lo importante: atender
            a sus clientes, crecer y generar valor. Con nuestras herramientas armas tu sitio web
            profesional en minutos, monitoreamos notificaciones judiciales de forma automatica y
            construimos flujos de trabajo con inteligencia artificial que ahorran horas de trabajo
            manual cada semana. Nuestro objetivo es que la tecnologia trabaje para vos, no al reves.
          </p>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Que hacemos</h2>
          <div className="space-y-4 text-surface-600 leading-relaxed mb-8">
            <p>
              <strong className="text-surface-900">Sitios web autogestionados:</strong> Arma tu pagina web
              profesional en minutos. Completas un asistente guiado con los datos de tu negocio y montamos
              un sitio sobre una plantilla profesional, optimizado para Google, adaptado a celulares y listo
              para recibir consultas.
            </p>
            <p>
              <strong className="text-surface-900">Monitoreo judicial automatico:</strong> Para
              abogados y estudios juridicos. Monitoreamos las notificaciones del PJN y SCBA en tiempo
              real, y te avisamos por email cuando hay novedades en tus causas. Sin entrar manualmente
              a cada portal, sin perder plazos.
            </p>
            <p>
              <strong className="text-surface-900">LinkedIn Optimizer IA:</strong> Optimiza tu perfil de
              LinkedIn y genera publicaciones profesionales de alto impacto con inteligencia artificial.
              La IA analiza tu perfil, genera recomendaciones y crea posts virales que se publican
              automaticamente en tu cuenta despues de tu confirmacion. Todo desde Telegram.
            </p>
            <p>
              <strong className="text-surface-900">Automatizaciones a medida:</strong> Diseñamos flujos
              de trabajo personalizados que conectan tus herramientas, eliminan tareas repetitivas y
              permiten que tu equipo se concentre en lo que realmente importa.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Nuestros valores</h2>
          <ul className="space-y-3 text-surface-600 leading-relaxed mb-8">
            <li><strong className="text-surface-900">Simplicidad:</strong> La tecnologia debe ser facil de usar. Si es complicado, lo estamos haciendo mal.</li>
            <li><strong className="text-surface-900">Transparencia:</strong> Precios claros, sin letra chica, sin sorpresas. Lo que ves es lo que pagas.</li>
            <li><strong className="text-surface-900">Resultado real:</strong> No vendemos humo. Cada producto esta diseñado para generar impacto medible en tu negocio.</li>
            <li><strong className="text-surface-900">Soporte humano:</strong> Detras de la IA hay personas reales que te ayudan cuando lo necesitas.</li>
          </ul>

          <h2 className="text-2xl font-bold text-surface-950 mb-4">Donde estamos</h2>
          <p className="text-surface-600 leading-relaxed mb-8">
            Operamos desde Buenos Aires, Argentina. Nuestro equipo trabaja de forma remota atendiendo
            clientes en todo el pais. Podes contactarnos por email a{' '}
            <a href="mailto:automaticialab@gmail.com" className="text-brand-600 hover:text-brand-700 underline">
              automaticialab@gmail.com
            </a>{' '}
            o por WhatsApp en cualquier momento.
          </p>

          <div className="flex gap-4 pt-8 border-t border-surface-200">
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
            >
              Contactanos
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded-xl transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
