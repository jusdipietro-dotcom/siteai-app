'use client'
import { motion } from 'framer-motion'
import { Zap, Palette, Globe, Search, Smartphone, MessageSquare, BarChart, Shield } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Generación instantánea', desc: 'Sitio listo en menos de 60 segundos gracias a nuestra IA avanzada.', color: 'text-amber-500 bg-amber-50' },
  { icon: Palette, title: 'Diseño personalizado', desc: 'Elige colores, tipografía y template que representen tu marca.', color: 'text-violet-500 bg-violet-50' },
  { icon: Globe, title: 'Publicación automática', desc: 'Tu sitio se publica en GitHub Pages con URL propia de inmediato.', color: 'text-brand-500 bg-brand-50' },
  { icon: Search, title: 'SEO incluido', desc: 'Metadatos, keywords y descripción optimizados para Google.', color: 'text-emerald-500 bg-emerald-50' },
  { icon: Smartphone, title: 'Responsive total', desc: '100% adaptado a mobile, tablet y desktop. Sin excepciones.', color: 'text-cyan-500 bg-cyan-50' },
  { icon: MessageSquare, title: 'WhatsApp integrado', desc: 'Botón de contacto directo para que tus clientes te escriban al instante.', color: 'text-green-500 bg-green-50' },
  { icon: BarChart, title: 'Google Analytics', desc: 'Métricas de visitas incluidas en el plan Professional.', color: 'text-orange-500 bg-orange-50' },
  { icon: Shield, title: 'HTTPS siempre', desc: 'Certificado SSL incluido. Tu sitio siempre seguro y confiable.', color: 'text-rose-500 bg-rose-50' },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Todo incluido
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Todo lo que tu negocio necesita
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Sin plugins, sin configuraciones, sin dolores de cabeza.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
