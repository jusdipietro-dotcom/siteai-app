'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Martina González',
    role: 'Nutricionista · Mar del Plata',
    avatar: 'MG',
    color: 'bg-violet-500',
    text: 'Increíble. En 3 minutos completé el formulario y en 1 minuto ya tenía mi sitio publicado. Mis pacientes me lo mencionan en cada consulta.',
    stars: 5,
  },
  {
    name: 'Ricardo Fernández',
    role: 'Pizzería Don Ricardo · Córdoba',
    avatar: 'RF',
    color: 'bg-red-500',
    text: 'Nunca pensé que podría tener un sitio así sin contratar un diseñador. El template de restaurante quedó espectacular y el bot de WhatsApp nos trae consultas todo el día.',
    stars: 5,
  },
  {
    name: 'Valentina Cruz',
    role: 'Abogada · Buenos Aires',
    avatar: 'VC',
    color: 'bg-brand-500',
    text: 'El template legal es muy profesional. Mis clientes lo mencionan como un factor de confianza. Súper fácil de usar, sin saber nada de tecnología.',
    stars: 5,
  },
  {
    name: 'Diego Peralta',
    role: 'Personal Trainer · Rosario',
    avatar: 'DP',
    color: 'bg-orange-500',
    text: 'Lo usé para mi gym y quedé sorprendido. El contenido generado por la IA es copado y tiene todo lo que necesitaba: galería, testimonios, WhatsApp.',
    stars: 5,
  },
  {
    name: 'Lucía Moreno',
    role: 'Psicóloga · Mendoza',
    avatar: 'LM',
    color: 'bg-pink-500',
    text: 'La IA entendió perfectamente el tono cálido que quería para mi consultorio. El sitio transmite exactamente lo que necesito. 100% recomendable.',
    stars: 5,
  },
  {
    name: 'Carlos Ibáñez',
    role: 'Inmobiliaria Ibáñez · CABA',
    avatar: 'CI',
    color: 'bg-emerald-500',
    text: 'Generé sitios para tres de mis sucursales en el mismo día. El dashboard es muy cómodo para manejar varios proyectos. Tremenda herramienta.',
    stars: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Testimonios
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Lo que dicen nuestros usuarios
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-surface-50 border border-surface-100 rounded-2xl p-6 hover:shadow-card transition-shadow"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-surface-700 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">{t.name}</p>
                  <p className="text-xs text-surface-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
