'use client'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles, Rocket } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: MessageSquare,
    title: 'Elegís tu producto',
    description:
      'Explorá nuestro catálogo de 11 productos. Sitios web, monitoreo judicial, prospección B2B, email marketing, reseñas, LinkedIn, trading y más. Cada uno resuelve un problema real.',
    color: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'Lo configuramos con IA',
    description:
      'Activamos tu producto en minutos. La IA se encarga de personalizar todo: contenido, frecuencia, tono, integraciones y automatizaciones adaptadas a tu negocio.',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Funciona en piloto automático',
    description:
      'Tu producto trabaja 24/7 sin intervención. Recibís resultados, alertas y reportes. Vos te enfocás en lo que importa.',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Así funciona
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Tres pasos para automatizar tu negocio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-surface-500"
          >
            Sin conocimientos técnicos, sin equipos, sin demoras.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-brand-200 via-violet-200 to-emerald-200 hidden md:block" />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className={`relative w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-surface-100 rounded-full flex items-center justify-center text-xs font-black text-surface-900 shadow-soft">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{step.title}</h3>
                <p className="text-surface-500 leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
