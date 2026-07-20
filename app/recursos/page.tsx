import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Download, FileText, BookOpen, Video, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Recursos Gratis para tu Negocio Online',
  description: 'Descargá guías, checklists y recursos gratuitos para llevar tu negocio a internet. Aprendé a crear tu sitio web, mejorar tu SEO y conseguir más clientes.',
  keywords: [
    'recursos gratis negocio online',
    'guía crear sitio web',
    'checklist negocio online Argentina',
    'cómo tener presencia online',
  ],
  openGraph: {
    title: 'Recursos Gratis para tu Negocio — Automatic IA Lab',
    description: 'Guías, checklists y recursos gratuitos para llevar tu negocio a internet.',
    url: 'https://automaticialab.com/recursos',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Recursos Gratis — Automatic IA Lab' }],
  },
  alternates: { canonical: 'https://automaticialab.com/recursos' },
}

const resources = [
  {
    icon: CheckCircle2,
    badge: 'PDF Descargable',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    title: 'Checklist: ¿Tu negocio está listo para tener su sitio web?',
    description: '10 preguntas clave para saber si tu negocio necesita presencia online. Si respondés SÍ a 3 o más, necesitás un sitio web ya.',
    cta: 'Hacer el checklist gratis',
    href: '/gratis',
    featured: true,
  },
  {
    icon: BookOpen,
    badge: 'Artículo',
    badgeColor: 'bg-brand-100 text-brand-700',
    title: '¿Por qué tu negocio necesita un sitio web en 2026?',
    description: 'El 80% de los consumidores buscan online antes de visitar un negocio. Descubrí por qué no estar en internet te está costando clientes.',
    cta: 'Leer artículo',
    href: '/blog/por-que-tu-negocio-necesita-un-sitio-web-en-2026',
    featured: false,
  },
  {
    icon: FileText,
    badge: 'Tutorial',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Cómo crear un sitio web gratis sin saber programar',
    description: 'Guía paso a paso para tener tu sitio web profesional en minutos. Sin conocimientos técnicos, sin diseñadores, sin complicaciones.',
    cta: 'Leer tutorial',
    href: '/blog/como-crear-sitio-web-gratis-sin-programar',
    featured: false,
  },
  {
    icon: FileText,
    badge: 'Consejos',
    badgeColor: 'bg-amber-100 text-amber-700',
    title: '5 errores comunes en sitios web de negocios locales',
    description: 'Evitá los errores que cometen el 90% de los negocios locales con su sitio web. Descubrí cómo solucionarlos automáticamente.',
    cta: 'Leer artículo',
    href: '/blog/5-errores-comunes-sitios-web-negocios-locales',
    featured: false,
  },
]

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-sm font-medium text-brand-300">Recursos gratuitos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Recursos para hacer crecer{' '}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-300 bg-clip-text text-transparent">
              tu negocio
            </span>
          </h1>
          <p className="mt-5 text-lg text-surface-300 max-w-2xl mx-auto">
            Guías, checklists y artículos gratuitos para que tu negocio tenga la presencia online que se merece.
          </p>
        </div>
      </section>

      {/* Resources grid */}
      <section className="py-16 sm:py-24 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Featured resource */}
          {resources.filter(r => r.featured).map((r) => (
            <div key={r.title} className="mb-12 bg-gradient-to-br from-surface-900 to-surface-950 rounded-2xl p-8 sm:p-10 border border-surface-800">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <r.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${r.badgeColor} mb-3`}>
                    {r.badge}
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-3">{r.title}</h2>
                  <p className="text-surface-300 mb-6">{r.description}</p>
                  <Link
                    href={r.href}
                    className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {r.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Other resources */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.filter(r => !r.featured).map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="group bg-white rounded-2xl p-6 border border-surface-100 hover:border-brand-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-100 text-surface-600 group-hover:bg-brand-100 group-hover:text-brand-600 flex items-center justify-center transition-colors">
                    <r.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.badgeColor}`}>
                    {r.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {r.title}
                </h3>
                <p className="text-sm text-surface-600 mb-4">{r.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {r.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why these resources */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-6 text-center">
            ¿Por qué creamos estos recursos?
          </h2>
          <div className="prose prose-surface max-w-none text-surface-600 space-y-4">
            <p>
              Sabemos que dar el primer paso hacia la presencia digital puede ser abrumador.
              Hay demasiada información, muchas herramientas y poco tiempo. Por eso creamos
              esta biblioteca de recursos gratuitos: para que puedas avanzar a tu ritmo, con
              guías claras y accionables, sin necesidad de conocimientos técnicos.
            </p>
            <p>
              Cada recurso fue diseñado pensando en negocios locales de Argentina y Latinoamérica.
              Desde profesionales independientes hasta comercios con local a la calle, nuestro
              objetivo es que cualquier emprendedor pueda entender qué necesita para estar
              online y cómo lograrlo de forma simple.
            </p>
            <p>
              Los artículos cubren temas esenciales como la creación de sitios web sin programar,
              los errores más frecuentes que cometen los negocios con su presencia digital, y
              estrategias comprobadas para atraer más clientes desde internet. Además, actualizamos
              el contenido regularmente para que siempre tengas información vigente y relevante.
            </p>
            <p>
              Si después de explorar estos recursos querés ir más allá, nuestra plataforma te
              permite crear tu sitio web profesional en menos de 60 segundos con inteligencia
              artificial. Sin diseñadores, sin código, sin complicaciones.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-surface-900 mb-4">
            ¿Listo para crecer tu negocio?
          </h2>
          <p className="text-lg text-surface-600 mb-8">
            Dejá de leer y empezá a hacer. Pedinos un diagnóstico técnico y armamos una propuesta a medida.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-500/25"
          >
            Pedir cotización
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
