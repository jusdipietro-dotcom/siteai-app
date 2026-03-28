'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Valentina Cruz',
    role: 'Abogada · Monitoreo Judicial',
    avatar: 'VC',
    color: 'bg-violet-500',
    text: 'El monitoreo judicial me cambio la vida. Ya no entro mas al portal del PJN. Me llegan las notificaciones por email con el texto completo. Ahorro horas por semana.',
    stars: 5,
  },
  {
    name: 'Ricardo Fernandez',
    role: 'Pizzeria Don Ricardo · Resenas Google',
    avatar: 'RF',
    color: 'bg-amber-500',
    text: 'Desde que active el respondedor de resenas, nuestra calificacion subio de 4.1 a 4.7. Cada resena se responde en minutos con un tono perfecto. Los clientes lo notan.',
    stars: 5,
  },
  {
    name: 'Martina Gonzalez',
    role: 'Nutricionista · Sitio Web + Turnos',
    avatar: 'MG',
    color: 'bg-brand-500',
    text: 'En 3 minutos tenia mi sitio publicado y el sistema de turnos funcionando. Mis pacientes reservan solos desde el celular. Ya no pierdo tiempo coordinando horarios.',
    stars: 5,
  },
  {
    name: 'Diego Peralta',
    role: 'Agencia de Marketing · Prospeccion B2B',
    avatar: 'DP',
    color: 'bg-orange-500',
    text: 'La prospeccion automatica nos genero 180 leads en el primer mes. Los emails personalizados con IA tienen una tasa de respuesta del 6%. Impresionante para cold outreach.',
    stars: 5,
  },
  {
    name: 'Lucia Moreno',
    role: 'Consultora · LinkedIn Optimizer',
    avatar: 'LM',
    color: 'bg-blue-500',
    text: 'Paso de 200 a 1500 impresiones semanales en LinkedIn. El bot me genera los posts, yo confirmo desde Telegram y se publican solos. Ahora me contactan a mi.',
    stars: 5,
  },
  {
    name: 'Carlos Ibanez',
    role: 'Inmobiliaria · Email Marketing',
    avatar: 'CI',
    color: 'bg-pink-500',
    text: 'Mando campañas de email a 3000 contactos sin pagar Mailchimp ni un dolar. El sistema anti-spam funciona perfecto, los mails llegan a inbox. Increible relacion costo-beneficio.',
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
