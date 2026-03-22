import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { CheckCircle2, ArrowRight, Zap, Globe, Smartphone, Search, MessageCircle, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sitio Web Gratis con IA',
  description: 'Genera un sitio web profesional para tu negocio en 60 segundos. Sin programar, sin diseñadores, sin tarjeta de credito. Proba gratis ahora.',
  keywords: [
    'crear sitio web gratis',
    'sitio web gratis Argentina',
    'generador sitio web IA',
    'pagina web gratis para negocio',
    'crear pagina web sin programar',
  ],
  openGraph: {
    title: 'Sitio Web Gratis con IA | Automatic IA Lab',
    description: 'Generá un sitio web profesional para tu negocio en 60 segundos. Sin programar, sin diseñadores, sin tarjeta de crédito.',
    url: 'https://automaticialab.com/gratis',
    type: 'website',
    images: [{ url: 'https://automaticialab.com/logo.png', width: 512, height: 341, alt: 'Automatic IA Lab' }],
  },
  alternates: {
    canonical: 'https://automaticialab.com/gratis',
  },
}

const benefits = [
  { icon: Zap, title: 'Listo en 60 segundos', desc: 'Nuestra IA genera contenido, diseño y estructura al instante.' },
  { icon: Globe, title: 'Publicación automática', desc: 'Tu sitio queda online con URL propia de inmediato.' },
  { icon: Smartphone, title: '100% responsive', desc: 'Se ve perfecto en celular, tablet y computadora.' },
  { icon: Search, title: 'SEO incluido', desc: 'Metadatos optimizados para que Google te encuentre.' },
  { icon: MessageCircle, title: 'WhatsApp integrado', desc: 'Botón de contacto directo para tus clientes.' },
  { icon: Shield, title: 'HTTPS siempre', desc: 'Certificado SSL incluido. Tu sitio siempre seguro.' },
]

const steps = [
  { num: '01', title: 'Completás el formulario', desc: 'Nombre, rubro, servicios, colores. En 5 minutos tenés todo listo.' },
  { num: '02', title: 'La IA genera tu sitio', desc: 'Contenido profesional, diseño personalizado y estructura optimizada.' },
  { num: '03', title: 'Tu sitio se publica', desc: 'URL propia, SSL incluido. Compartilo y empezá a recibir consultas.' },
]

const faqs = [
  { q: '¿Es realmente gratis?', a: 'Sí. El plan Free te permite generar tu sitio, verlo completo y editarlo. No necesitás tarjeta de crédito.' },
  { q: '¿Necesito saber programar?', a: 'Para nada. Completás un formulario simple y la IA se encarga de todo: textos, diseño, estructura y publicación.' },
  { q: '¿Puedo usar mi propio dominio?', a: 'Sí, con el plan Professional podés configurar tu dominio personalizado.' },
  { q: '¿Qué rubros soporta?', a: 'Restaurantes, abogados, médicos, gimnasios, peluquerías, inmobiliarias, contadores, fotógrafos, y muchos más.' },
]

export default function GratisLandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-sm font-medium text-brand-300">Plan gratuito — Sin tarjeta de crédito</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            Creá tu sitio web<br />
            <span className="bg-gradient-to-r from-brand-400 to-cyan-300 bg-clip-text text-transparent">
              gratis con IA
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Generá un sitio web profesional para tu negocio en menos de 60 segundos.
            Sin programar, sin diseñadores, sin complicaciones.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-500/25"
            >
              Crear mi sitio gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors border border-white/10"
            >
              Ver demo en vivo
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-surface-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> Sin tarjeta
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> Listo en 60s
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> +500 negocios
            </span>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 sm:py-28 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">Así de fácil</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">Tres pasos. Menos de 5 minutos.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative bg-white rounded-2xl p-8 shadow-sm border border-surface-100">
                <span className="text-5xl font-black text-brand-100">{step.num}</span>
                <h3 className="mt-4 text-lg font-semibold text-surface-900">{step.title}</h3>
                <p className="mt-2 text-surface-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">Todo incluido</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">¿Qué incluye el plan gratuito?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex gap-4 p-6 rounded-xl bg-surface-50 hover:bg-brand-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900">{b.title}</h3>
                  <p className="mt-1 text-sm text-surface-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-3xl font-bold text-white">+500</p>
              <p className="text-sm text-surface-400 mt-1">negocios creados</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">58s</p>
              <p className="text-sm text-surface-400 mt-1">tiempo promedio</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">12+</p>
              <p className="text-sm text-surface-400 mt-1">rubros disponibles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">4.9/5</p>
              <p className="text-sm text-surface-400 mt-1">calificación</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 border border-surface-100">
                <h3 className="font-semibold text-surface-900">{faq.q}</h3>
                <p className="mt-2 text-surface-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-surface-950 to-surface-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white">
            Tu negocio merece estar en internet.
          </h2>
          <p className="mt-4 text-lg text-surface-300">
            Creá tu primer sitio en minutos. Sin código, sin diseñadores, sin excusas.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-500/25"
          >
            Empezar gratis ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-surface-500">
            Sin tarjeta de credito. Plan gratuito disponible para siempre.
          </p>
        </div>
      </section>

      {/* Comparativa */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">¿Por que elegir Automatic IA Lab?</h2>
          <p className="text-surface-600 text-center max-w-2xl mx-auto mb-8">
            Comparado con contratar un diseñador web o usar herramientas complicadas, nuestra plataforma
            te permite tener un sitio profesional en minutos, no semanas. Con contenido generado por
            inteligencia artificial adaptado a tu rubro, optimizacion SEO automatica y publicacion
            instantanea. Miles de negocios en Argentina ya confian en nosotros para su presencia online.
          </p>
        </div>
      </section>

      <Footer />

      {/* JSON-LD for this landing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Crear Sitio Web Gratis con IA',
            description: 'Generá un sitio web profesional para tu negocio en 60 segundos con inteligencia artificial.',
            url: 'https://automaticialab.com/gratis',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Automatic IA Lab',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'ARS',
                description: 'Plan gratuito — generá tu sitio web con IA sin costo',
              },
            },
          }),
        }}
      />
    </main>
  )
}
