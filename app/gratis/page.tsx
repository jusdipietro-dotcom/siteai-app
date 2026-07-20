import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { CheckCircle2, ArrowRight, Wand2, Eye, Smartphone, Search, MessageCircle, Shield, Globe, RefreshCw } from 'lucide-react'
import { WEBSITE_PLANS, formatARS } from '@/lib/website-plans'

export const metadata: Metadata = {
  title: 'Armá tu Sitio Web Gratis',
  description: 'Arma el sitio web de tu negocio y velo terminado sin pagar nada ni cargar tarjeta. Publicarlo online requiere una suscripcion mensual.',
  keywords: [
    'crear sitio web gratis',
    'sitio web gratis Argentina',
    'generador sitio web IA',
    'pagina web gratis para negocio',
    'crear pagina web sin programar',
  ],
  openGraph: {
    title: 'Armá tu Sitio Web Gratis | Automatic IA Lab',
    description: 'Armá el sitio de tu negocio y velo terminado sin pagar nada. Publicarlo online requiere una suscripción.',
    url: 'https://automaticialab.com/gratis',
    type: 'website',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Automatic IA Lab' }],
  },
  alternates: {
    canonical: 'https://automaticialab.com/gratis',
  },
}

/** Lo que se puede hacer sin pagar ni cargar tarjeta. */
const freeIncludes = [
  { icon: Wand2, title: 'Asistente guiado', desc: 'Respondés unas preguntas sobre tu negocio y armamos la estructura, los textos y el diseño.' },
  { icon: Eye, title: 'Vista previa completa', desc: 'Ves el sitio terminado antes de decidir. La vista previa lleva una barra y marca de agua.' },
  { icon: RefreshCw, title: 'Edición ilimitada', desc: 'Cambiás textos, colores, imágenes y secciones las veces que quieras.' },
]

/** Lo que se habilita al activar la suscripcion. Ver lib/website-plans.ts. */
const paidIncludes = [
  { icon: Globe, title: 'Sitio publicado', desc: 'Tu sitio pasa a ser accesible con un subdominio propio: tunegocio.sitios.automaticialab.com' },
  { icon: Shield, title: 'SSL y hosting', desc: 'Certificado HTTPS y alojamiento incluidos en la suscripción.' },
  { icon: Search, title: 'SEO en el sitio público', desc: 'Título, descripción y metadatos para compartir y para que Google te encuentre.' },
  { icon: MessageCircle, title: 'WhatsApp integrado', desc: 'Botón de contacto directo a tu número, si lo cargás en el asistente.' },
  { icon: Smartphone, title: '100% responsive', desc: 'Se ve bien en celular, tablet y computadora.' },
  { icon: RefreshCw, title: 'Seguí editando', desc: 'Republicá los cambios sin límite mientras la suscripción esté activa.' },
]

const steps = [
  { num: '01', title: 'Completás el asistente', desc: 'Nombre, rubro, servicios, contacto y colores. Sin tarjeta de crédito.' },
  { num: '02', title: 'Armamos tu sitio', desc: 'Estructura, secciones y diseño listos, con imágenes generadas por IA. Lo editás a gusto.' },
  { num: '03', title: 'Lo publicás cuando quieras', desc: 'Elegís tu subdominio y activás la suscripción. Recién acá se paga.' },
]

const essential = WEBSITE_PLANS.essential

const faqs = [
  {
    q: '¿Qué es gratis exactamente?',
    a: 'Crear tu cuenta, armar el sitio con el asistente, editarlo y verlo terminado en vista previa. Todo eso no cuesta nada y no pide tarjeta de crédito.',
  },
  {
    q: '¿Entonces qué se paga?',
    a: `Publicar el sitio para que sea accesible en internet. Ahí entra la suscripción, desde ${formatARS(essential.monthly)} por mes. Incluye subdominio propio, SSL y hosting.`,
  },
  {
    q: '¿Necesito saber programar?',
    a: 'No. Completás un asistente paso a paso y el sitio se arma solo. Las imágenes se generan con IA; los textos salen de lo que cargás sobre tu negocio y los podés editar cuando quieras.',
  },
  {
    q: '¿Puedo usar mi propio dominio?',
    a: 'Todavía no. Al publicar recibís un subdominio propio del tipo tunegocio.sitios.automaticialab.com. La conexión de dominios propios (tunegocio.com) no está disponible.',
  },
  {
    q: '¿Qué rubros soporta?',
    a: 'Hay 12 rubros con diseño y contenido preparados: restaurante, abogado, consultorio médico, estudio contable, inmobiliaria, gimnasio, peluquería, boutique, agencia, arquitectura, fotografía y servicios profesionales.',
  },
  {
    q: '¿Qué pasa si dejo de pagar?',
    a: 'El sitio deja de estar publicado. Tu proyecto y tus ediciones siguen en tu cuenta, y podés volver a publicarlo reactivando la suscripción.',
  },
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
            <span className="text-sm font-medium text-brand-300">Armalo gratis — Sin tarjeta de crédito</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
            Armá tu sitio web<br />
            <span className="bg-gradient-to-r from-brand-400 to-cyan-300 bg-clip-text text-transparent">
              gratis
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Armá el sitio de tu negocio y velo terminado sin pagar nada.
            Pagás solo cuando decidís publicarlo online.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register?next=creador-de-sitios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-500/25"
            >
              Armar mi sitio gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/servicios/creador-de-sitios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors border border-white/10"
            >
              Ver cómo funciona y precios
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-surface-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> Sin tarjeta para armarlo
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> Vista previa completa
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-400" /> 12 rubros
            </span>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 sm:py-28 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">Así de fácil</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">Tres pasos. Los dos primeros son gratis.</h2>
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

      {/* Qué es gratis y qué se paga */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">Sin letra chica</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">Qué es gratis y qué se paga</h2>
            <p className="mt-4 text-surface-600 max-w-2xl mx-auto">
              Preferimos decírtelo antes de que inviertas tiempo, no en la pantalla de pago.
            </p>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-success-100 px-3 py-1 text-sm font-semibold text-success-700">
              Gratis
            </span>
            <span className="text-sm text-surface-500">Sin tarjeta de crédito</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {freeIncludes.map((b) => (
              <div key={b.title} className="flex gap-4 p-6 rounded-xl bg-surface-50">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-success-100 text-success-700 flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900">{b.title}</h3>
                  <p className="mt-1 text-sm text-surface-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
              Con suscripción
            </span>
            <span className="text-sm text-surface-500">
              Desde {formatARS(essential.monthly)} por mes
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidIncludes.map((b) => (
              <div key={b.title} className="flex gap-4 p-6 rounded-xl bg-surface-50">
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

          <p className="mt-10 text-center text-surface-600">
            Los planes, precios y el detalle completo están en{' '}
            <Link href="/servicios/creador-de-sitios" className="text-brand-600 font-medium underline underline-offset-4 hover:text-brand-700">
              la página del creador de sitios
            </Link>
            .
          </p>
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
            Armá tu sitio y velo terminado. Decidís si lo publicás después.
          </p>
          <Link
            href="/register?next=creador-de-sitios"
            className="mt-10 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-brand-500/25"
          >
            Armar mi sitio gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-surface-500">
            Armarlo y verlo no cuesta nada ni pide tarjeta. Publicarlo requiere una suscripción activa.
          </p>
        </div>
      </section>

      {/* Comparativa */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-surface-900 mb-6 text-center">¿Por qué elegir Automatic IA Lab?</h2>
          <p className="text-surface-600 text-center max-w-2xl mx-auto mb-8">
            Comparado con contratar un diseñador web o pelearte con herramientas complicadas, acá armás
            un sitio profesional en una tarde y no en semanas. Estructura y diseño preparados para tu
            rubro, imágenes generadas con IA, botón de WhatsApp y metadatos SEO. Y a diferencia de otras
            plataformas, ves el resultado terminado antes de poner un peso: pagás recién cuando decidís
            publicarlo.
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
            name: 'Armá tu Sitio Web Gratis',
            description: 'Armá el sitio web de tu negocio y velo terminado sin costo. Publicarlo online requiere una suscripción.',
            url: 'https://automaticialab.com/gratis',
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'Automatic IA Lab',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              offers: [
                {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'ARS',
                  description: 'Armá, editá y previsualizá tu sitio sin costo y sin tarjeta de crédito',
                },
                {
                  '@type': 'Offer',
                  price: String(essential.monthly),
                  priceCurrency: 'ARS',
                  description: `Plan ${essential.name} — publicá tu sitio con subdominio propio, SSL y hosting`,
                },
              ],
            },
          }),
        }}
      />
    </main>
  )
}
