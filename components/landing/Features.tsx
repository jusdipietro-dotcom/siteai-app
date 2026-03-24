'use client'
import { motion } from 'framer-motion'
import { Zap, Bot, Globe, Shield, Clock, TrendingUp, Wallet, HeadphonesIcon } from 'lucide-react'

const features = [
  { icon: Zap, title: 'Activacion inmediata', desc: 'La mayoria de nuestros productos se activan en minutos. Sin esperas, sin burocracia.', color: 'text-amber-500 bg-amber-50' },
  { icon: Bot, title: 'IA en todo', desc: 'Cada producto usa inteligencia artificial para generar contenido, respuestas, analisis y decisiones.', color: 'text-violet-500 bg-violet-50' },
  { icon: Globe, title: '100% en la nube', desc: 'Todo corre en nuestros servidores. No necesitas instalar nada ni tener computadora prendida.', color: 'text-brand-500 bg-brand-50' },
  { icon: Shield, title: 'Seguridad y privacidad', desc: 'Datos encriptados, credenciales protegidas y acceso seguro a todos los servicios.', color: 'text-emerald-500 bg-emerald-50' },
  { icon: Clock, title: 'Funciona 24/7', desc: 'Automatizaciones que trabajan todo el dia, todos los dias. Vos descansas, ellas no.', color: 'text-cyan-500 bg-cyan-50' },
  { icon: TrendingUp, title: 'Resultados medibles', desc: 'Cada producto incluye metricas y seguimiento. Sabes exactamente que esta pasando.', color: 'text-green-500 bg-green-50' },
  { icon: Wallet, title: 'Precios en pesos', desc: 'Sin dolares, sin tarjetas internacionales. Paga en ARS con MercadoPago o transferencia.', color: 'text-orange-500 bg-orange-50' },
  { icon: HeadphonesIcon, title: 'Soporte humano', desc: 'Atencion directa por WhatsApp. Sin bots, sin tickets, sin esperar dias por una respuesta.', color: 'text-rose-500 bg-rose-50' },
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
            Por que elegirnos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Todo lo que necesitas para escalar
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            11 productos, una plataforma, cero complicaciones.
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
