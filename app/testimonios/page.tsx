import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'
import { Star, Quote, ExternalLink, MessageCircle, Heart, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reseñas y Opiniones de Clientes',
  description:
    'Lo que dicen nuestros clientes en Argentina sobre Automatic IA Lab. Dejá tu reseña en Google Business si trabajaste con nosotros.',
  alternates: { canonical: 'https://automaticialab.com/testimonios' },
  openGraph: {
    title: 'Reseñas y Opiniones — Automatic IA Lab',
    description:
      'Lo que dicen nuestros clientes en Argentina sobre Automatic IA Lab. Dejá tu reseña en Google.',
    url: 'https://automaticialab.com/testimonios',
    type: 'website',
  },
}

// Google Business Profile — CID (Customer ID) de Automatic IA Lab.
// La URL ?cid=... abre el perfil en Maps; desde ahí el cliente clickea
// "Escribir reseña" (o se puede usar https://g.page/r/{short}/review
// si el GBP genera un short link en su panel admin).
const GBP_CID = '05938724930941089681'
const GOOGLE_REVIEW_URL = `https://www.google.com/maps?cid=${GBP_CID}`

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20dejar%20una%20rese%C3%B1a%20de%20Automatic%20IA%20Lab'

const testimonios = [
  {
    name: 'Ricardo F.',
    role: 'Pizzería · Quilmes',
    product: 'Reseñas Google IA',
    text: 'Desde que activé el respondedor de reseñas, nuestra calificación subió de 4.1 a 4.7 en dos meses. Antes ni miraba las reseñas, ahora las trabajo todas.',
    rating: 5,
  },
  {
    name: 'Dr. M. Gómez',
    role: 'Estudio Jurídico · CABA',
    product: 'Monitoreo Judicial + Suite Jurídica',
    text: 'Ya no perdemos plazos por descuidar el portal del PJN. El sistema avisa antes de las 8 AM si hay novedad. Cambia el flujo del estudio entero.',
    rating: 5,
  },
  {
    name: 'Lucía P.',
    role: 'E-commerce · Tienda online',
    product: 'Email Marketing',
    text: 'Teníamos 7.600 contactos y nunca habíamos hecho una campaña. Hoy se envían solos, llegan a inbox y veo el progreso en una planilla. Sin Mailchimp, sin dólares.',
    rating: 5,
  },
  {
    name: 'Ing. Jorge L.',
    role: 'Consultora B2B · Rosario',
    product: 'Prospección IA',
    text: 'Lo configuramos en 2 horas. Al mes siguiente cerramos 3 reuniones desde leads que el sistema captó solo. Inversión recuperada el primer mes.',
    rating: 5,
  },
  {
    name: 'Carolina S.',
    role: 'Coach · Online',
    product: 'Sitio Web con IA',
    text: 'Necesitaba una landing y no sabía por dónde empezar. En 30 minutos tenía el sitio en mi dominio, con WhatsApp y formulario. Increíble.',
    rating: 5,
  },
  {
    name: 'Estudio Pereira',
    role: 'Bufete · La Plata',
    product: 'Suite Jurídica completa',
    text: 'Migramos toda la administración del estudio. Facturación ARCA + dashboard de causas + turnos. Recomendado para estudios chicos que quieren profesionalizar.',
    rating: 5,
  },
]

export default function ResenasPage() {
  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          { name: 'Testimonios', url: 'https://automaticialab.com/testimonios' },
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-8 h-8 fill-yellow-300 text-yellow-300" />
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Lo que dicen nuestros clientes
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Más de 500 negocios en Argentina automatizan sus procesos con nosotros. Acá tenés algunas opiniones reales.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-surface-50 border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '4.9', label: 'estrellas promedio', sub: '/ 5.0' },
            { num: '+500', label: 'negocios activos' },
            { num: '13', label: 'productos integrados' },
            { num: '< 24h', label: 'respuesta soporte' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-orange-600">
                {s.num}
                {s.sub && <span className="text-base text-surface-400">{s.sub}</span>}
              </p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Testimonios</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Casos reales, números reales
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonios.map((t) => (
              <div
                key={t.name}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-orange-300 mb-2" />
                <p className="text-sm text-surface-700 leading-relaxed mb-4 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="border-t border-surface-200 pt-3 mt-2">
                  <p className="font-bold text-surface-900 text-sm">{t.name}</p>
                  <p className="text-xs text-surface-500">{t.role}</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">{t.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Dejar reseña */}
      <section className="py-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 fill-white/40" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            ¿Trabajaste con nosotros?
          </h2>
          <p className="text-white/90 text-lg mb-3 max-w-xl mx-auto">
            Tu opinión nos ayuda a crecer y a que otros negocios encuentren la solución que buscan.
          </p>
          <p className="text-white/75 text-sm mb-8">Tarda menos de 1 minuto.</p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-orange-600 rounded-xl px-6 py-5 font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Dejar reseña en Google
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 text-white rounded-xl px-6 py-5 font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/30 backdrop-blur-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Avisarnos por WhatsApp
            </a>
          </div>

          <p className="text-xs text-white/70 mt-6">
            ¿Algo no funcionó como esperabas?{' '}
            <Link href="/contacto" className="underline font-semibold hover:text-white">
              Contanos primero
            </Link>{' '}
            antes de dejar una reseña — somos un equipo chico, queremos arreglarlo.
          </p>
        </div>
      </section>

      {/* Para qué usamos las reseñas */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-surface-900 mb-6 text-center">
            ¿Para qué usamos las reseñas?
          </h2>
          <div className="bg-surface-50 rounded-2xl border border-surface-100 p-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </span>
              <p className="text-surface-700">
                <strong>Mejorar el producto</strong> — leemos cada una. Si mencionás un bug o una feature que falta, va a la lista de prioridades.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </span>
              <p className="text-surface-700">
                <strong>Construir confianza</strong> — somos un equipo chico de Argentina. Cada reseña honesta nos ayuda a que otros negocios nos encuentren y nos prueben.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </span>
              <p className="text-surface-700">
                <strong>Responder por WhatsApp</strong> — si tu reseña tiene algo que podemos resolver (un bug, una duda), nos vamos a contactar para hacerlo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Soporte alternativo */}
      <section className="py-12 bg-surface-50 border-t border-surface-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Mail className="w-8 h-8 mx-auto text-surface-400 mb-3" />
          <p className="text-surface-600">
            Si necesitás soporte técnico o tenés un problema urgente, escribí a{' '}
            <a href="mailto:automaticialab@gmail.com" className="text-orange-600 font-semibold hover:underline">
              automaticialab@gmail.com
            </a>{' '}
            o usá el chat por WhatsApp.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
