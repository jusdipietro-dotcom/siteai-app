'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import {
  Megaphone, Target, BarChart3, Globe, Zap, MessageCircle,
  ArrowRight, Check, ChevronDown, Search, Hammer, RefreshCw,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20marketing%20digital'

const services = [
  {
    icon: Target,
    name: 'Meta Ads (Facebook + Instagram)',
    desc: 'Estrategia funnel TOFU/MOFU/BOFU, Advantage+ Shopping Campaigns (ASC), DPA con catálogo, públicos custom y lookalike, creativos optimizados (carousel, Reels, UGC, video).',
  },
  {
    icon: Search,
    name: 'Google Ads',
    desc: 'Campañas Search, Performance Max, YouTube. Investigación de keywords, estructura de cuenta, anuncios responsive, extensiones, optimización por conversión.',
  },
  {
    icon: BarChart3,
    name: 'Pixel + Conversions API',
    desc: 'Setup técnico completo del Pixel de Meta + Conversions API (CAPI), eventos estándar (Purchase, AddToCart, Lead), GA4, Google Tag Manager, Server-Side Tagging.',
  },
  {
    icon: Globe,
    name: 'Contenido orgánico',
    desc: 'Estrategia de contenido para Instagram y LinkedIn, calendario editorial, redacción de copies, diseño de carruseles y reels, gestión de comunidad.',
  },
  {
    icon: Zap,
    name: 'Embudos de conversión',
    desc: 'Diseño de funnels completos: lead magnet → secuencia de email → venta. Automatización con n8n + email marketing + retargeting.',
  },
  {
    icon: MessageCircle,
    name: 'Mensajería y bots',
    desc: 'Campañas de mensajes en Instagram/Messenger/WhatsApp con respuestas automáticas IA. Captura de leads desde DM y derivación al equipo de ventas.',
  },
]

const verticales = [
  { emoji: '🛍️', label: 'E-commerce de indumentaria', desc: 'Setup Tiendanube + Shopify + ASC + catálogo dinámico' },
  { emoji: '⚖️', label: 'Estudios jurídicos', desc: 'Captación de consultas por especialidad y zona geográfica' },
  { emoji: '🏥', label: 'Clínicas y consultorios', desc: 'SEO local + Ads geolocalizadas + reviews automation' },
  { emoji: '🍕', label: 'Gastronomía', desc: 'Campañas locales con WhatsApp lead ads y delivery' },
  { emoji: '🏠', label: 'Inmobiliarias', desc: 'Listados con DPA, retargeting y captación por barrio' },
  { emoji: '💼', label: 'Servicios B2B', desc: 'LinkedIn Ads + lead gen forms + nurturing automation' },
]

const proceso = [
  { num: '1', icon: Search, title: 'Diagnóstico', price: 'USD 300 - 700', desc: 'Auditoría de cuentas actuales + análisis competencia + plan estratégico documentado.' },
  { num: '2', icon: Hammer, title: 'Setup + lanzamiento', price: 'USD 1.500 - 5.000', desc: 'Pixel/CAPI/GA4 + estructura cuentas + creativos + lanzamiento de campañas. Descuento del diagnóstico aplicado.' },
  { num: '3', icon: RefreshCw, title: 'Gestión mensual', price: 'USD 200 - 500/mes', desc: 'Optimización diaria + creativos nuevos + reportes mensuales + ajustes según métricas.' },
]

const faqs = [
  {
    q: '¿Garantizan resultados?',
    a: 'Garantizamos trabajo profesional, transparente y medible. NO garantizamos un ROAS o un volumen específico — depende de muchos factores fuera de nuestro control (oferta, producto, competencia, mercado). Lo que sí garantizamos: setup técnico impecable, campañas con metodología probada, reportes mensuales con métricas reales.',
  },
  {
    q: '¿Hay permanencia?',
    a: 'No. Trabajamos mes a mes. Si decidís cortar, nos avisas con 30 días y te entregamos toda la documentación, accesos y aprendizajes. Sin penalidad.',
  },
  {
    q: '¿Quién es dueño de las cuentas de ads?',
    a: 'Vos. Trabajamos en TUS cuentas (Meta Business Manager, Google Ads). Nunca en cuentas nuestras. Si nos vamos, vos seguís siendo dueño de todo: cuentas, históricos, creativos, audiencias.',
  },
  {
    q: '¿Por qué cobran en USD?',
    a: 'Por estabilidad. Las tarifas en pesos argentinos se desactualizan cada 30-60 días por inflación. Cobramos en USD pero aceptamos pago en pesos al MEP/CCL del día.',
  },
  {
    q: '¿Trabajan con cualquier presupuesto de ads?',
    a: 'Idealmente USD 500/mes mínimo en ads para que tenga sentido contratarnos (el fee de gestión + ads tiene que ser proporcional). Para presupuestos menores, recomendamos solo el setup inicial y vos gestionás después.',
  },
  {
    q: '¿Hacen creativos o necesito un diseñador?',
    a: 'Hacemos creativos: carousels, copies, reels editados (te pasamos el guion para que grabes el video, lo editamos nosotros). Si necesitás producción audiovisual completa (filmar, modelos, locaciones), eso se cotiza aparte.',
  },
]

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Megaphone className="w-4 h-4" /> Servicio de agencia
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Marketing Digital<br />que sí convierte
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-2xl leading-relaxed"
            >
              Meta Ads, Google Ads, contenido orgánico, embudos de conversión y mensajería con IA. Estrategia + ejecución + análisis de métricas con un equipo argentino que vive de hacer crecer cuentas.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#cotizar">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-orange-700 hover:bg-white/90 font-bold text-base px-8">
                  Solicitar diagnóstico <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#servicios">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Ver servicios <ChevronDown className="w-4 h-4" />
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
            { num: 'Meta', label: '+ Google Ads' },
            { num: 'CAPI', label: 'tracking server-side' },
            { num: 'Sin', label: 'permanencia' },
            { num: 'USD', label: 'tarifas estables' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-orange-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Qué hacemos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Servicios incluidos
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:shadow-lg transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2">{s.name}</h3>
                  <p className="text-sm text-surface-600 leading-relaxed">{s.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Verticales */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Verticales</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Trabajamos con</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {verticales.map((v) => (
              <div key={v.label} className="bg-white rounded-xl p-5 border border-surface-100">
                <div className="text-2xl mb-2">{v.emoji}</div>
                <p className="font-bold text-surface-900 text-sm mb-1">{v.label}</p>
                <p className="text-xs text-surface-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Cómo trabajamos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Proceso en 3 pasos</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {proceso.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.num} className="bg-surface-50 rounded-2xl p-6 border border-surface-100">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-extrabold mb-4">
                    {p.num}
                  </div>
                  <Icon className="w-5 h-5 text-orange-600 mb-2" />
                  <h3 className="font-bold text-surface-900 mb-1">{p.title}</h3>
                  <p className="text-orange-700 font-extrabold text-lg mb-2">{p.price}</p>
                  <p className="text-sm text-surface-600 leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
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

      {/* Inquiry */}
      <section id="cotizar" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Solicitar diagnóstico</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Auditemos tu marketing actual
            </h2>
            <p className="text-surface-500">
              Reunión inicial gratis de 30 min. Te respondemos en menos de 24 horas.
            </p>
          </div>
          <InquiryForm
            service="custom"
            source="/servicios/marketing-digital"
            accentClass="bg-orange-600 hover:bg-orange-700"
            budgetOptions={[
              'USD 300-700 — solo diagnóstico',
              'USD 1.500-3.000 — setup chico',
              'USD 3.000-5.000 — setup mediano',
              'USD 5.000+ — proyecto grande',
              'Necesito asesoramiento',
            ]}
            description="Contanos sobre tu negocio y tu objetivo. El diagnóstico inicial cuesta USD 300-700 y se descuenta del setup si avanzás."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            ¿Tu marketing está funcionando?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Hagamos un diagnóstico técnico y descubrámoslo juntos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#cotizar">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-orange-700 hover:bg-white/90 font-bold text-base px-8">
                Solicitar diagnóstico <ArrowRight className="w-4 h-4" />
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
