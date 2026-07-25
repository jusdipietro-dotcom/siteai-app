'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Layout, Search, Zap, MessageCircle, Crown } from 'lucide-react'

const services = [
  {
    id: 'diseno-web',
    icon: Layout,
    title: 'Diseño Web a medida',
    desc: 'Sitios web profesionales con código propio y diseño único. Landing pages, sitios institucionales o tiendas online.',
    priceFrom: 180000,
    href: '/servicios/diseno-web',
    gradient: 'from-blue-500 to-cyan-600',
    accent: 'text-blue-600',
    cta: 'Ver paquetes',
  },
  {
    id: 'seo',
    icon: Search,
    title: 'Posicionamiento SEO',
    desc: 'Aparece primero en Google. SEO técnico, local y orgánico con reportes mensuales transparentes.',
    priceFrom: 45000,
    href: '/servicios/seo',
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    cta: 'Pedir auditoría',
  },
  {
    id: 'chatbot-ia',
    icon: MessageCircle,
    title: 'Chatbot IA para tu web',
    desc: 'Implementamos un chatbot IA personalizado en tu sitio: responde consultas, agenda turnos, captura leads. Conectado con tu negocio.',
    priceFrom: 90000,
    href: '/contacto',
    gradient: 'from-pink-500 to-rose-600',
    accent: 'text-rose-600',
    cta: 'Solicitar info',
  },
  {
    id: 'custom',
    icon: Zap,
    title: 'Workflows a medida',
    desc: 'Automatizamos cualquier proceso de tu negocio: integraciones, scrapers, bots de IA, sincronizaciones.',
    priceFrom: 120000,
    href: '/contacto',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-orange-600',
    cta: 'Contactános',
  },
]

export function ServiciosSection() {
  return (
    <section id="servicios" className="py-20 bg-surface-50 border-y border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Servicios a medida
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
            Cuando necesitás algo único
          </h2>
          <p className="text-surface-500">
            Además de nuestros productos automáticos, ofrecemos servicios personalizados con implementación manual: diseño web a medida, posicionamiento SEO, email marketing y workflows hechos para tu negocio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed mb-4 flex-1">{s.desc}</p>
                <div className="mb-4">
                  <span className="text-xs text-surface-400">Desde</span>
                  <p className="text-2xl font-extrabold text-surface-900">
                    ${s.priceFrom.toLocaleString('es-AR')}
                  </p>
                </div>
                <Link
                  href={s.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.accent} hover:gap-2.5 transition-all`}
                >
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 rounded-2xl p-8 text-white">
            <Crown className="w-9 h-9 mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-2">Implementación Premium</h3>
            <p className="text-white/90 text-sm leading-relaxed mb-5">
              Sistemas completos hechos a medida con onboarding 1:1: Pipeline de Noticias multi-agente, Avatar IA Influencer, ERP Indumentaria, Suite Jurídica White-Label. Desde $1.200.000 ARS.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-amber-700 font-bold rounded-xl hover:bg-white/90 transition-colors text-sm"
            >
              Ver productos premium <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-surface-900 to-surface-800 rounded-2xl p-8 text-center text-white flex flex-col justify-center">
            <h3 className="text-2xl font-bold mb-2">¿Tenés un proyecto distinto?</h3>
            <p className="text-surface-300 mb-6 max-w-xl mx-auto text-sm">
              Si necesitás algo que no está en nuestro catálogo, hablemos. Cotizamos cualquier proyecto de software, automatización o IA.
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-surface-900 font-bold rounded-xl hover:bg-surface-100 transition-colors text-sm self-center"
            >
              Contar mi proyecto <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
