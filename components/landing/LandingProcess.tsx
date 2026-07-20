'use client'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Hammer, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { waLink } from '@/lib/whatsapp'

const steps = [
  {
    num: '1',
    icon: Search,
    title: 'Diagnostico inicial',
    duration: 'Conversacion + relevamiento',
    desc: 'Empezamos con una charla por WhatsApp o video para entender tu negocio, tu situacion actual y tus objetivos. Hacemos un relevamiento tecnico y proponemos un plan claro.',
    deliverables: [
      'Reunion inicial sin costo',
      'Relevamiento de tu stack actual y procesos',
      'Documento de diagnostico con propuesta',
      'Alcance, plazos y arquitectura definidos',
    ],
    color: 'from-blue-500 to-cyan-500',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    num: '2',
    icon: Hammer,
    title: 'Implementacion',
    duration: 'Desarrollo iterativo con avances semanales',
    desc: 'Desarrollamos e implementamos la solucion acordada. Trabajamos de forma iterativa con avances semanales por video para que veas el progreso en tiempo real.',
    deliverables: [
      'Desarrollo a medida con tecnologia moderna',
      'Integraciones con tus sistemas actuales',
      'Testing, QA y puesta en produccion',
      'Capacitacion para tu equipo y documentacion',
    ],
    color: 'from-violet-500 to-purple-600',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    popular: true,
  },
  {
    num: '3',
    icon: RefreshCw,
    title: 'Soporte y mejoras',
    duration: 'Acompaniamiento continuo',
    desc: 'Una vez en produccion, te acompaniamos con soporte tecnico, actualizaciones de seguridad y mejoras continuas. Sin contratos rigidos: avanzamos a tu ritmo.',
    deliverables: [
      'Soporte tecnico por WhatsApp y email',
      'Actualizaciones de seguridad y dependencias',
      'Mejoras y ajustes segun necesidad',
      'Monitoreo proactivo y reportes mensuales',
    ],
    color: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
]

const processWa = waLink(
  'Hola! Quiero coordinar una reunion para conocer el diagnostico inicial sin costo.'
)

export function LandingProcess() {
  return (
    <section
      id="proceso"
      className="py-24 bg-gradient-to-br from-surface-50 to-white scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Como trabajamos
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 mb-4">
            Diagnostico - Implementacion - Soporte
          </h2>
          <p className="text-lg text-surface-500 leading-relaxed">
            Un proceso claro en 3 pasos. Arrancamos con una conversacion sin compromiso y vos
            decidis si avanzamos.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-3xl border-2 ${
                  s.popular
                    ? s.border + ' shadow-xl ring-2 ring-violet-500/15'
                    : 'border-surface-100'
                } overflow-hidden flex flex-col`}
              >
                {s.popular && (
                  <div className="absolute top-4 right-4 bg-violet-600 text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                    Etapa principal
                  </div>
                )}
                <div className={`h-2 bg-gradient-to-r ${s.color}`} />
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full ${s.bg} ${s.accent} flex items-center justify-center font-extrabold text-base border-2 ${s.border}`}
                    >
                      {s.num}
                    </div>
                    <Icon className={`w-5 h-5 ${s.accent}`} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-surface-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-surface-400 mb-4">{s.duration}</p>
                  <p className="text-surface-600 text-sm leading-relaxed mb-5">{s.desc}</p>

                  <p className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-3">
                    Que incluye
                  </p>
                  <ul className="space-y-2 flex-1">
                    {s.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-surface-700">
                        <Check className={`w-4 h-4 ${s.accent} shrink-0 mt-0.5`} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <a href={processWa} target="_blank" rel="noopener noreferrer">
            <Button variant="gradient" size="xl" className="gap-2 shadow-brand">
              <MessageCircle className="w-5 h-5" />
              Coordinar reunion sin compromiso
            </Button>
          </a>
          <p className="text-sm text-surface-500 mt-3">
            Te respondemos en menos de 24 horas - Reunion inicial gratuita
          </p>
        </div>
      </div>
    </section>
  )
}
