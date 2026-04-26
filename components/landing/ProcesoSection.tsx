'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Hammer, RefreshCw, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    num: '1',
    icon: Search,
    title: 'Diagnóstico inicial',
    price: 'USD 300 — 700',
    duration: '5 a 10 días',
    desc: 'Reunión inicial + relevamiento técnico de tu negocio + diseño de arquitectura propuesta. Salís con un documento de diagnóstico detallado que es tuyo, lo uses con nosotros o no.',
    deliverables: [
      'Reunión técnica de 2-3 horas',
      'Auditoría de stack actual y procesos',
      'Documento de diagnóstico (15-30 páginas)',
      'Arquitectura propuesta + alcance',
      'Estimación de costos y plazos',
    ],
    color: 'from-blue-500 to-cyan-500',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    num: '2',
    icon: Hammer,
    title: 'Implementación',
    price: 'USD 1.500 — 5.000',
    duration: '15 a 60 días',
    desc: 'Desarrollo + integración + testing + capacitación. Trabajo iterativo con avances semanales por video. El precio depende del alcance (definido en el diagnóstico).',
    deliverables: [
      'Desarrollo a medida con tecnología moderna',
      'Integraciones con tus sistemas actuales',
      'Testing completo y QA',
      'Capacitación para tu equipo',
      'Documentación técnica y manuales',
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
    title: 'Mantenimiento mensual',
    price: 'USD 200 — 500 / mes',
    duration: 'Recurrente · sin permanencia',
    desc: 'Soporte técnico + actualizaciones + mejoras continuas + ajustes según necesidad. Opcional pero recomendado para sistemas en producción crítica.',
    deliverables: [
      'Soporte técnico por WhatsApp y email',
      'Actualizaciones de seguridad y dependencias',
      'Pequeñas mejoras incluidas (hasta 4 hs/mes)',
      'Monitoreo proactivo del sistema',
      'Reportes mensuales de uso y métricas',
    ],
    color: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
]

const faq = [
  {
    q: '¿Por qué cobran el diagnóstico?',
    a: 'Para garantizar valor real desde el día 1. El diagnóstico requiere 5-15 horas de trabajo profesional (relevamiento + arquitectura + documentación). Si lo regaláramos, no podríamos dedicarle el tiempo que merece y vos saldrías con menos información para tomar la decisión.',
  },
  {
    q: '¿El diagnóstico es independiente de la implementación?',
    a: 'Sí. El documento es tuyo y lo podés usar con nosotros, con otra agencia, o internamente. No hay ningún compromiso de avanzar con la implementación.',
  },
  {
    q: '¿Qué pasa si avanzo con la implementación?',
    a: 'Descontamos el 100% del valor del diagnóstico del costo de implementación. Es decir: si el diagnóstico fue de USD 500 y la implementación cotiza USD 3.000, pagás USD 2.500 al avanzar.',
  },
  {
    q: '¿Por qué cobran en USD?',
    a: 'Por estabilidad. Las tarifas en pesos argentinos se desactualizan cada 30-60 días por inflación. Cobramos en USD pero aceptamos pago en pesos al tipo de cambio MEP/CCL del día, en transferencia o MercadoPago.',
  },
]

export function ProcesoSection() {
  return (
    <section id="proceso" className="py-24 bg-gradient-to-br from-surface-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Cómo trabajamos
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-900 mb-4">
            Diagnóstico → Implementación → Mantenimiento
          </h2>
          <p className="text-lg text-surface-500 leading-relaxed">
            Un proceso claro en 3 pasos. Empezás con un diagnóstico técnico (que vale por sí solo) y
            avanzás con la implementación cuando estés convencido.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-3xl border-2 ${s.popular ? s.border + ' shadow-xl ring-2 ring-violet-500/15' : 'border-surface-100'} overflow-hidden flex flex-col`}
              >
                {s.popular && (
                  <div className="absolute top-4 right-4 bg-violet-600 text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider">
                    Más elegido
                  </div>
                )}
                <div className={`h-2 bg-gradient-to-r ${s.color}`} />
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${s.bg} ${s.accent} flex items-center justify-center font-extrabold text-base border-2 ${s.border}`}>
                      {s.num}
                    </div>
                    <Icon className={`w-5 h-5 ${s.accent}`} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-surface-900 mb-1">{s.title}</h3>
                  <p className={`${s.accent} font-extrabold text-3xl mb-1`}>{s.price}</p>
                  <p className="text-sm text-surface-400 mb-4">{s.duration}</p>
                  <p className="text-surface-600 text-sm leading-relaxed mb-5">{s.desc}</p>

                  <p className="text-xs uppercase tracking-wider text-surface-500 font-semibold mb-3">Qué incluye</p>
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

        {/* CTA */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Link href="/contacto">
            <Button variant="gradient" size="xl" className="gap-2 shadow-brand">
              Solicitar diagnóstico inicial <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-surface-500 mt-3">
            Reunión de 30 min sin costo · Te respondemos en menos de 24 horas
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-extrabold text-surface-900 mb-6 text-center">
            Preguntas sobre el proceso y precios
          </h3>
          <div className="space-y-2">
            {faq.map((f) => (
              <details
                key={f.q}
                className="bg-white rounded-xl p-5 border border-surface-100 group"
              >
                <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between">
                  {f.q}
                  <span className="text-surface-400 group-open:rotate-45 transition-transform text-2xl leading-none">
                    +
                  </span>
                </summary>
                <p className="text-sm text-surface-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
