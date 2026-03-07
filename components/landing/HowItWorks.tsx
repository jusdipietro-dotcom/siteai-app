'use client'
import { motion } from 'framer-motion'
import { ClipboardList, Sparkles, Globe } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Completás el formulario',
    description:
      'Ingresás el nombre de tu negocio, rubro, servicios, colores y estilo. En menos de 5 minutos tenés todo listo.',
    color: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'La IA genera tu sitio',
    description:
      'Nuestra IA crea el contenido, diseño y estructura de tu sitio web personalizado para tu rubro y estilo.',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
  },
  {
    step: '03',
    icon: Globe,
    title: 'Tu sitio se publica',
    description:
      'En segundos, tu sitio queda publicado con una URL propia. Podés editarlo, compartirlo y recibir consultas.',
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
            Tres pasos para tener tu sitio online
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-surface-500"
          >
            Sin conocimientos técnicos, sin diseñadores, sin demoras.
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
