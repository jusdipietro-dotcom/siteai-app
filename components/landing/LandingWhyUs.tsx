'use client'
import { motion } from 'framer-motion'
import { MapPin, Code2, Headphones, Brain, ShieldCheck, Zap } from 'lucide-react'

const reasons = [
  {
    icon: MapPin,
    title: 'Agencia argentina',
    desc: 'Equipo local en Buenos Aires. Hablamos tu idioma, conocemos tu mercado y entendemos los desafios reales de un negocio en Argentina.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: Code2,
    title: 'Sin templates ni soluciones genericas',
    desc: 'Cada implementacion es a medida. No usamos plantillas: el sitio, el flujo y la automatizacion se disenan especificamente para tu negocio.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Brain,
    title: 'IA aplicada al negocio',
    desc: 'No vendemos hype: implementamos modelos LLM (GPT, Claude, Gemini, Groq) y agentes IA que generan valor concreto en tu operacion diaria.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Headphones,
    title: 'Soporte directo por WhatsApp',
    desc: 'Te atendemos vos a nosotros, sin tickets ni call centers. Comunicacion directa con el equipo que implementa tu proyecto.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: ShieldCheck,
    title: 'Sin contratos ni permanencia',
    desc: 'Trabajamos por resultados, no por candado. Si la solucion no esta funcionando como esperabas, lo conversamos y ajustamos. Vos decidis hasta cuando.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Tiempos reales y predecibles',
    desc: 'Cotizamos en 24 horas, arrancamos en dias y avanzamos con entregas semanales. Sin promesas vacias ni proyectos eternos.',
    color: 'from-cyan-500 to-blue-500',
  },
]

export function LandingWhyUs() {
  return (
    <section className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Por que Automatic IA Lab
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Una forma distinta de trabajar
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Cercania, calidad tecnica y resultados medibles. Eso es lo que nos diferencia.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => {
            const Icon = r.icon
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-surface-100 p-6 hover:shadow-card transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-surface-900 mb-2">{r.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{r.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
