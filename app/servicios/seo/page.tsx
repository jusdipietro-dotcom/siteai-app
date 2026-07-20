'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import {
  ArrowRight, Check, Search, TrendingUp, Target, FileSearch,
  LinkIcon, BarChart3, ChevronDown, MapPin, Globe2,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20posicionamiento%20SEO'

const packages = [
  {
    id: 'auditoria',
    name: 'Auditoria SEO',
    priceFrom: 80000,
    deliveryDays: '5-7 dias',
    popular: false,
    desc: 'Diagnostico completo de tu sitio + plan de accion. Pago unico, sin compromiso mensual.',
    features: [
      'Auditoria tecnica completa (velocidad, mobile, errores)',
      'Auditoria de contenido y palabras clave',
      'Analisis de la competencia (top 5 rivales)',
      'Auditoria de backlinks',
      'Analisis on-page de hasta 20 paginas',
      'Reporte con priorizacion de mejoras',
      'Plan de accion 90 dias',
      'Reunion de 1h para explicarte el reporte',
    ],
  },
  {
    id: 'local',
    name: 'SEO Local',
    priceFrom: 45000,
    deliveryDays: 'Mensual',
    popular: true,
    desc: 'Para negocios fisicos: Google Maps, Reviews, citas locales y posicionamiento por ciudad.',
    features: [
      'Optimizacion completa de Google Business Profile',
      'Estrategia de reviews + sistema automatico',
      'Citas locales en directorios (NAP consistency)',
      'Optimizacion para "near me" / busqueda por zona',
      'Posts semanales en Google Business',
      'Reportes mensuales de visibilidad y llamadas',
      'Integracion con sitio web existente',
      'Soporte por WhatsApp',
    ],
  },
  {
    id: 'organico',
    name: 'SEO Organico',
    priceFrom: 90000,
    deliveryDays: 'Mensual',
    popular: false,
    desc: 'Posicionamiento integral: trafico organico desde Google con contenido y autoridad.',
    features: [
      'Investigacion de palabras clave mensual',
      'Optimizacion on-page de paginas clave',
      'Creacion de hasta 4 articulos SEO al mes',
      'Construccion de backlinks de calidad',
      'Schema markup avanzado',
      'Optimizacion de Core Web Vitals',
      'Reportes mensuales con metricas claras',
      'Asesoramiento estrategico continuo',
    ],
  },
]

const services = [
  {
    icon: FileSearch,
    title: 'SEO Tecnico',
    desc: 'Velocidad, indexacion, sitemap, robots.txt, schema, mobile usability, errores 404, redirecciones.',
  },
  {
    icon: Search,
    title: 'SEO On-Page',
    desc: 'Title tags, meta descriptions, H1-H6, contenido optimizado, imagenes con alt, links internos.',
  },
  {
    icon: LinkIcon,
    title: 'SEO Off-Page',
    desc: 'Construccion de backlinks de calidad, menciones de marca, guest posts, directorios autoritativos.',
  },
  {
    icon: MapPin,
    title: 'SEO Local',
    desc: 'Google Business Profile, NAP consistency, reviews management, citas locales, "near me" search.',
  },
  {
    icon: Target,
    title: 'Keyword Research',
    desc: 'Investigacion de palabras clave con volumen, dificultad, intencion y oportunidades reales.',
  },
  {
    icon: BarChart3,
    title: 'Analytics y Reportes',
    desc: 'GA4, Search Console, dashboards mensuales claros con metricas que importan al negocio.',
  },
]

const steps = [
  { num: '1', title: 'Auditoria inicial', desc: 'Analizamos tu sitio, tus competidores y tus palabras clave. Identificamos oportunidades reales.' },
  { num: '2', title: 'Plan estrategico', desc: 'Te presentamos un roadmap a 90/180/365 dias con prioridades, recursos y resultados esperados.' },
  { num: '3', title: 'Implementacion', desc: 'Ejecutamos: cambios tecnicos, contenido, optimizacion on-page y construccion de autoridad.' },
  { num: '4', title: 'Medicion y ajuste', desc: 'Reportes mensuales con posiciones, trafico y conversiones. Iteramos lo que funciona.' },
]

const expectations = [
  { time: 'Mes 1-2', what: 'Auditoria completa, fixes tecnicos urgentes, primer batch de contenido optimizado.' },
  { time: 'Mes 3-4', what: 'Mejora de keywords secundarias, primeros backlinks, aumento de impresiones en Search Console.' },
  { time: 'Mes 5-6', what: 'Posicionamiento en keywords principales (pagina 1-2), aumento de trafico organico 30-80%.' },
  { time: 'Mes 7-12', what: 'Top 3 en keywords objetivo, trafico organico estable, ROI claro y conversiones medibles.' },
]

const faqs = [
  {
    q: 'En cuanto tiempo voy a ver resultados?',
    a: 'SEO es una inversion de mediano plazo. Cambios tecnicos se ven en 2-4 semanas. Posicionamiento real (top 10 Google) demora entre 3 y 6 meses. Top 3 puede tardar 6-12 meses dependiendo de la competencia.',
  },
  {
    q: 'Pueden garantizarme el #1 en Google?',
    a: 'Nadie puede garantizar posiciones especificas porque Google es quien decide. Lo que si garantizamos es trabajo profesional, transparente y medible. Si una agencia te promete "garantia top 1" estan mintiendo.',
  },
  {
    q: 'Que diferencia hay entre SEO local y SEO organico?',
    a: 'SEO local sirve para negocios con direccion fisica (clinicas, restaurantes, peluquerias). Apunta a "X cerca de mi" y Google Maps. SEO organico sirve para sitios que venden o informan a nivel pais o internacional.',
  },
  {
    q: 'Hace falta tener una web nueva o sirve la mia?',
    a: 'Trabajamos con cualquier sitio: WordPress, Wix, Shopify, Tiendanube, Webflow o codigo a medida. Si tu web tiene problemas tecnicos serios te lo decimos en la auditoria y vemos como resolverlo.',
  },
  {
    q: 'Trabajan en cualquier rubro?',
    a: 'Si, pero somos especialistas en: estudios juridicos, profesionales independientes, e-commerce de indumentaria, gastronomia, inmobiliarias y servicios B2B. Si tu rubro no esta, igual escribinos: probablemente podemos.',
  },
  {
    q: 'Que pasa si no quiero seguir despues de unos meses?',
    a: 'Sin permanencia. Trabajamos mes a mes. Si decidis cortar, nos avisas con 30 dias y listo. Te entregamos toda la documentacion y los avances.',
  },
  {
    q: 'Hacen "black hat" o tecnicas riesgosas?',
    a: 'Nunca. Solo white hat. Las tecnicas riesgosas (PBN, link spam, cloaking) pueden darte resultados rapidos pero te penaliza Google y perdes todo. Construimos crecimiento sostenido.',
  },
  {
    q: 'Como mido si esta funcionando?',
    a: 'Reportes mensuales con: posiciones de keywords, trafico organico, impresiones en Search Console, leads o ventas atribuidas a SEO. Todo medible, sin humo.',
  },
]

const useCases = [
  { emoji: '⚖️', title: 'Estudios juridicos', desc: 'Posicionamos por especialidad legal y zona geografica. Captamos clientes calificados.' },
  { emoji: '🏥', title: 'Clinicas y salud', desc: 'SEO local + reputacion online. Aumentamos consultas desde Google Maps.' },
  { emoji: '🛍️', title: 'E-commerce', desc: 'Posicionamos productos por categoria + long-tail. Trafico organico que vende.' },
  { emoji: '🏠', title: 'Inmobiliarias', desc: 'SEO local por barrios + busquedas tipo "departamento 2 ambientes Quilmes".' },
  { emoji: '💼', title: 'Servicios B2B', desc: 'Lead generation organico con contenido tecnico y posicionamiento de autoridad.' },
  { emoji: '🍕', title: 'Gastronomia', desc: 'Top en Google Maps, reviews automatizadas, reservas desde busquedas locales.' },
]

export default function SeoPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <TrendingUp className="w-4 h-4" /> Servicio personalizado
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Posicionamiento SEO<br />en Google
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed"
            >
              Aparece primero cuando tu cliente te busca. SEO tecnico, local y de contenido para que tu negocio crezca con trafico organico que vende.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#paquetes">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-emerald-700 hover:bg-white/90 font-bold text-base px-8">
                  Ver paquetes y precios <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#cotizar">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Pedir auditoria gratis <ChevronDown className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-surface-50 border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '93%', label: 'inicia con un buscador' },
            { num: '75%', label: 'no pasa de la pagina 1' },
            { num: '+200%', label: 'trafico promedio a 6m' },
            { num: '0%', label: 'humo y promesas falsas' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-emerald-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Que hacemos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              SEO completo, no solo backlinks
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Como trabajamos</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="paquetes" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Paquetes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Elegi como queres crecer
            </h2>
            <p className="text-surface-500">
              Sin permanencia. Sin contratos largos. Si no funciona, te vas cuando quieras.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border ${p.popular ? 'border-emerald-300 shadow-lg ring-2 ring-emerald-500/20' : 'border-surface-100'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mas pedido
                  </div>
                )}
                <h3 className="text-xl font-bold text-surface-900 mb-1">{p.name}</h3>
                <p className="text-sm text-surface-400 mb-4">{p.desc}</p>
                <div className="mb-1">
                  <span className="text-sm text-surface-400">Desde</span>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-surface-900">${p.priceFrom.toLocaleString('es-AR')}</span>
                  <span className="text-surface-400 text-sm ml-1">{p.id === 'auditoria' ? 'unico' : '/mes'}</span>
                </div>
                <p className="text-xs text-surface-500 mb-6">Modalidad: {p.deliveryDays}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`#cotizar?paquete=${p.id}`}>
                  <Button
                    variant={p.popular ? 'gradient' : 'outline'}
                    className={`w-full gap-2 ${p.popular ? '' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                  >
                    Cotizar este paquete <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expectations timeline */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Realidad</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Que esperar mes a mes
            </h2>
            <p className="text-surface-500">
              SEO no es magia. Mostramos lo que realmente pasa para que tomes una decision informada.
            </p>
          </div>
          <div className="space-y-3">
            {expectations.map((e) => (
              <div key={e.time} className="bg-white rounded-xl p-5 border border-surface-100 flex flex-col sm:flex-row gap-2 sm:gap-6">
                <span className="text-emerald-700 font-bold text-sm shrink-0 sm:w-32">{e.time}</span>
                <p className="text-sm text-surface-600 leading-relaxed">{e.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Casos de uso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Trabajamos con</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-100 text-center"
              >
                <div className="text-3xl mb-3">{uc.emoji}</div>
                <h3 className="font-bold text-surface-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-surface-500">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-surface-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl p-5 border border-surface-100 group">
                <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between gap-2">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-surface-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-sm text-surface-500 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="cotizar" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-3">Cotizacion</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Pedi una auditoria SEO sin costo
            </h2>
            <p className="text-surface-500">
              Te respondemos con un mini-diagnostico de tu sitio y una propuesta concreta.
            </p>
          </div>
          <InquiryForm
            service="seo"
            source="/servicios/seo"
            accentClass="bg-emerald-600 hover:bg-emerald-700"
            budgetOptions={[
              'Auditoria unica (menos de $100.000)',
              'Mensual $40.000 - $80.000',
              'Mensual $80.000 - $150.000',
              'Mensual mas de $150.000',
              'Necesito asesoramiento',
            ]}
            description="Decinos tu sitio web y un poco sobre tu negocio. Te enviamos una propuesta a medida en menos de 24 horas."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Globe2 className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Tu cliente te esta buscando en Google
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Hagamos que te encuentre.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#cotizar">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-emerald-700 hover:bg-white/90 font-bold text-base px-8">
                Pedir auditoria gratis <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                Hablar por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
