'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: '¿Qué tipos de proyectos hacen?',
    a: 'Cuatro pilares: inteligencia artificial aplicada (chatbots, agentes autónomos, automatización con LLMs), marketing digital (Meta Ads, Google Ads, contenido), diseño web a medida (landing, sitios institucionales, e-commerce) y posicionamiento SEO (técnico, local, orgánico). Cada proyecto se cotiza según alcance.',
  },
  {
    q: '¿Cómo es el proceso de contratación?',
    a: 'Tres pasos. Primero diagnóstico técnico (USD 300-700, 5-10 días) con relevamiento, arquitectura y documento de 15-30 páginas. Después implementación a medida (USD 1.500-5.000, 15-45 días, descuenta el diagnóstico). Finalmente mantenimiento opcional (USD 200-500/mes, sin permanencia).',
  },
  {
    q: '¿Por qué cobran el diagnóstico?',
    a: 'Porque requiere 5-15 horas de trabajo profesional (relevamiento + arquitectura + documentación). El documento es tuyo: lo podés usar con nosotros o con otra agencia. Si avanzás con la implementación, descontamos el 100% del diagnóstico.',
  },
  {
    q: '¿Cobran en pesos o en USD?',
    a: 'Cobramos en USD por estabilidad de tarifas pero aceptamos pago en pesos argentinos al MEP/CCL del día. Aceptamos transferencia, MercadoPago o crypto (USDT/USDC). Plan de pago: 50% al arrancar, 30% a mitad, 20% contra entrega.',
  },
  {
    q: '¿Hay permanencia en el mantenimiento?',
    a: 'No. Trabajamos mes a mes. Si decidís cortar, nos avisás con 30 días y te entregamos toda la documentación, accesos y aprendizajes. Sin penalidad.',
  },
  {
    q: '¿Quién es dueño del código y los activos?',
    a: 'Vos. Te entregamos código fuente + documentación + acceso al servidor + cuentas de ads bajo tu nombre. Sin vendor lock-in. Si decidís discontinuar, te llevás todo y podés operarlo con otra agencia.',
  },
  {
    q: '¿Trabajan con cualquier rubro?',
    a: 'Sí, pero somos especialistas en: estudios jurídicos (suite completa con monitoreo PJN/SCBA), e-commerce de indumentaria, gastronomía, clínicas y consultorios, inmobiliarias, servicios B2B y profesionales independientes.',
  },
  {
    q: '¿Cuánto tarda en estar listo un proyecto?',
    a: 'Diagnóstico: 5-10 días. Implementación según tipo: landing simple 5-7 días, sitio institucional 10-15 días, tienda online 15-25 días, sistema con IA 4-8 semanas, integración compleja 8-12 semanas.',
  },
  {
    q: '¿Cómo es el soporte?',
    a: 'Soporte directo por WhatsApp y email. Sin bots, sin tickets. Respondemos consultas en horario comercial L-V 9-18 ART y emergencias críticas fuera de horario.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-surface-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open ? 'true' : 'false'}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-surface-50 transition-colors"
      >
        <span className="font-semibold text-surface-900 text-sm sm:text-base">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-surface-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-surface-500 leading-relaxed border-t border-surface-100 pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            FAQ
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Preguntas frecuentes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Todo lo que necesitás saber antes de empezar.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
