'use client'
import { motion } from 'framer-motion'
import {
  Brain,
  Megaphone,
  Layout,
  Search,
  Check,
  MessageCircle,
  Bot,
  Workflow,
  BarChart3,
  Target,
  Smartphone,
  ShoppingBag,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { waLink } from '@/lib/whatsapp'

const services = [
  {
    id: 'ia',
    icon: Brain,
    accentIcons: [Bot, Workflow, BarChart3],
    title: 'Inteligencia Artificial',
    tagline: 'Consultoria e implementacion de IA aplicada al negocio',
    description:
      'Diseno e implementacion de soluciones con modelos de lenguaje (GPT, Claude, Gemini, Groq), agentes autonomos, chatbots conversacionales y automatizaciones inteligentes para tu operacion.',
    bullets: [
      'Agentes IA que atienden, califican y derivan leads 24/7',
      'Chatbots para sitios web, WhatsApp, Instagram y Telegram',
      'Automatizaciones con n8n + LLMs (workflows a medida)',
      'Integracion con tus sistemas (CRM, ERP, planillas, APIs)',
      'Procesamiento de documentos, OCR, extraccion de datos',
    ],
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    waMsg: 'Hola! Me interesa el servicio de Inteligencia Artificial. Quiero recibir mas informacion.',
  },
  {
    id: 'marketing',
    icon: Megaphone,
    accentIcons: [Target, Smartphone, BarChart3],
    title: 'Marketing Digital',
    tagline: 'Meta Ads, Google Ads y contenido que convierte',
    description:
      'Estrategia y gestion de campanas pagas en Meta (Facebook + Instagram), Google Ads y TikTok. Contenido organico, copywriting profesional y embudos de conversion para escalar tus ventas.',
    bullets: [
      'Setup y gestion mensual de campanas Meta + Google Ads',
      'Pixel + Conversions API, GA4 y tracking completo',
      'Creativos publicitarios (carousel, video, UGC, Reels)',
      'Email marketing y automatizaciones de nurturing',
      'Reportes y optimizacion continua sobre ROAS / CPA',
    ],
    gradient: 'from-orange-500 to-red-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    waMsg: 'Hola! Me interesa el servicio de Marketing Digital. Quiero recibir mas informacion.',
  },
  {
    id: 'web',
    icon: Layout,
    accentIcons: [Smartphone, ShoppingBag, BarChart3],
    title: 'Diseno Web',
    tagline: 'Sitios a medida en Next.js, sin templates',
    description:
      'Desarrollamos sitios web profesionales, landing pages de alta conversion y tiendas online. Tecnologia moderna (Next.js + Tailwind), performance optimizado, SEO base y conectados a tus herramientas.',
    bullets: [
      'Landing pages y sitios institucionales a medida',
      'E-commerce: Tiendanube, Shopify y desarrollos propios',
      'Integraciones con WhatsApp, formularios y CRM',
      'Disenos pensados para conversion, no para portfolio',
      'Hosting, dominio y mantenimiento incluido',
    ],
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    waMsg: 'Hola! Me interesa el servicio de Diseno Web. Quiero recibir mas informacion.',
  },
  {
    id: 'seo',
    icon: Search,
    accentIcons: [MapPin, TrendingUp, BarChart3],
    title: 'Posicionamiento SEO',
    tagline: 'Aparece primero cuando te buscan',
    description:
      'Auditoria tecnica completa, optimizacion on-page, SEO local con Google Business Profile, generacion de contenido optimizado y estrategia de enlaces. Resultados sostenidos en el tiempo.',
    bullets: [
      'Auditoria SEO tecnica y diagnostico inicial',
      'Optimizacion on-page (meta tags, schema, performance)',
      'SEO local: ficha Google Business + resenas + mapas',
      'Generacion de contenido optimizado para tu nicho',
      'Reporte mensual de posiciones y trafico organico',
    ],
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    waMsg: 'Hola! Me interesa el servicio de Posicionamiento SEO. Quiero recibir mas informacion.',
  },
]

export function LandingServices() {
  return (
    <section id="servicios" className="py-24 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Nuestros servicios
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            4 pilares para escalar tu negocio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Cada servicio se contrata por separado o combinados. Empezamos siempre con una
            conversacion para entender tu situacion.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.id}
                id={`servicio-${s.id}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative bg-white rounded-3xl border-2 ${s.border} p-8 hover:shadow-card transition-shadow scroll-mt-24`}
              >
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${s.gradient} mb-6`} />
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-surface-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-surface-500 font-medium">{s.tagline}</p>
                  </div>
                </div>

                <p className="text-surface-600 leading-relaxed mb-6">{s.description}</p>

                <ul className="space-y-3 mb-7">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-surface-700">
                      <div
                        className={`w-5 h-5 rounded-full ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <Check className={`w-3 h-3 text-surface-700`} />
                      </div>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <a href={waLink(s.waMsg)} target="_blank" rel="noopener noreferrer">
                  <Button variant="gradient" className="gap-2 w-full sm:w-auto">
                    <MessageCircle className="w-4 h-4" />
                    Consultar por este servicio
                  </Button>
                </a>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
