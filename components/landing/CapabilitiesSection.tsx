'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Brain, Megaphone, Layout, Search, ArrowRight, Sparkles,
  Bot, Mail, MessageSquare, Target, Globe, Scale, Bell,
  Calendar, Users, FileText,
} from 'lucide-react'

const services = [
  {
    icon: Brain,
    name: 'Inteligencia Artificial',
    tagline: 'Soluciones IA aplicadas a tu negocio',
    desc: 'Implementamos modelos de IA, agentes autónomos, chatbots, automatización con LLMs y workflows con n8n. Diagnóstico técnico + arquitectura + desarrollo + capacitación.',
    href: '/servicios/inteligencia-artificial',
    color: 'from-violet-500 to-purple-600',
    accent: 'text-violet-600',
    examples: [
      'Chatbots con IA en web/WhatsApp',
      'Agentes autónomos multi-paso',
      'Automatización con n8n + LLMs',
      'Asistentes virtuales para áreas (legal, ventas, soporte)',
    ],
  },
  {
    icon: Megaphone,
    name: 'Marketing Digital',
    tagline: 'Meta Ads, Google Ads y contenido',
    desc: 'Estrategia + ejecución de campañas de paid media (Meta + Google), contenido orgánico para redes, embudos de conversión y análisis de métricas.',
    href: '/servicios/marketing-digital',
    color: 'from-orange-500 to-red-600',
    accent: 'text-orange-600',
    examples: [
      'Campañas Meta Ads (FB+IG) optimizadas',
      'Google Ads para captación local',
      'Pixel + Conversions API + tracking',
      'Contenido orgánico Instagram/LinkedIn',
    ],
  },
  {
    icon: Layout,
    name: 'Diseño Web',
    tagline: 'Sitios profesionales a medida',
    desc: 'Diseño y desarrollo de sitios web en Next.js + Tailwind. Landing pages, sitios institucionales, e-commerce con MercadoPago, integraciones a medida.',
    href: '/servicios/diseno-web',
    color: 'from-blue-500 to-cyan-500',
    accent: 'text-blue-600',
    examples: [
      'Landing pages con conversión optimizada',
      'Sitios institucionales con CMS',
      'Tiendas online con MercadoPago',
      'Integraciones (Tiendanube, Calendly, WhatsApp)',
    ],
  },
  {
    icon: Search,
    name: 'Posicionamiento SEO',
    tagline: 'Aparece primero cuando te buscan',
    desc: 'Auditoría técnica + optimización on-page + SEO local con Google Business Profile + creación de contenido + link building. Reportes mensuales con métricas reales.',
    href: '/servicios/seo',
    color: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    examples: [
      'Auditoría SEO técnica completa',
      'SEO Local + Google Business Profile',
      'Optimización on-page + Schema.org',
      'Link building white-hat',
    ],
  },
]

// Casos de uso / verticales que ya hicimos (son el portfolio, no productos auto-checkout)
const useCases = [
  { icon: Scale, label: 'Estudios jurídicos', href: '/automatizacion-para-abogados' },
  { icon: Globe, label: 'Sitios web a medida', href: '/servicios/diseno-web' },
  { icon: Bell, label: 'Alertas judiciales PJN/SCBA', href: '/automatizacion-para-abogados' },
  { icon: Bot, label: 'Bots WhatsApp con IA', href: '/contacto' },
  { icon: MessageSquare, label: 'Auto-responder reseñas Google', href: '/contacto' },
  { icon: Target, label: 'Prospección B2B con IA', href: '/contacto' },
  { icon: Mail, label: 'Email marketing automatizado', href: '/contacto' },
  { icon: Calendar, label: 'Sistemas de turnos online', href: '/contacto' },
  { icon: Users, label: 'Optimizadores LinkedIn', href: '/contacto' },
  { icon: FileText, label: 'Facturación electrónica AFIP', href: '/contacto' },
]

export function CapabilitiesSection() {
  return (
    <>
      {/* Servicios principales (4 pilares) */}
      <section id="servicios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Nuestros 4 pilares
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 mb-4">
              Servicios de agencia digital
            </h2>
            <p className="text-lg text-surface-500 leading-relaxed">
              Cada proyecto se cotiza y se implementa de forma personalizada. Trabajamos con un proceso
              de <strong className="text-surface-900">diagnóstico previo</strong> + propuesta + implementación.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-xl transition-all flex flex-col"
                >
                  <div className={`h-2 bg-gradient-to-r ${s.color}`} />
                  <div className="p-7 flex-1 flex flex-col">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-surface-900 mb-1">{s.name}</h3>
                    <p className={`${s.accent} font-medium text-sm mb-4`}>{s.tagline}</p>
                    <p className="text-surface-600 text-sm leading-relaxed mb-5">{s.desc}</p>

                    <p className="text-xs uppercase tracking-wider text-surface-400 font-semibold mb-2">Ejemplos de proyectos</p>
                    <ul className="space-y-1.5 mb-6 flex-1">
                      {s.examples.map((ex) => (
                        <li key={ex} className="flex items-start gap-2 text-sm text-surface-600">
                          <span className={`${s.accent} mt-1`}>•</span>
                          {ex}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={s.href}
                      className={`inline-flex items-center gap-1.5 ${s.accent} font-semibold text-sm hover:gap-2.5 transition-all`}
                    >
                      Ver detalles del servicio <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Casos de uso (qué ya hicimos) */}
      <section className="py-20 bg-surface-50 border-y border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Capacidades</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Algunos proyectos que ya hicimos
            </h2>
            <p className="text-surface-500 max-w-2xl mx-auto">
              Cada uno se cotiza según alcance. Pedinos un diagnóstico y armamos una propuesta a medida.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {useCases.map((uc, i) => {
              const Icon = uc.icon
              return (
                <motion.div
                  key={uc.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={uc.href}
                    className="block bg-white rounded-xl p-4 border border-surface-100 hover:border-brand-300 hover:shadow-md transition-all text-center h-full"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-surface-700 leading-tight">{uc.label}</p>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
