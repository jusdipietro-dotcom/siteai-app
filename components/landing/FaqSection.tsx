'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Necesito saber programar para usar la plataforma?',
    a: 'No. Todos nuestros productos son plug & play. Vos elegis, nosotros configuramos y la IA hace el resto. No se requiere ningun conocimiento tecnico.',
  },
  {
    q: 'Puedo contratar un solo producto o tengo que contratar todo?',
    a: 'Cada producto es 100% independiente. Podes contratar solo el que necesitas o combinar varios. El alta es online y la activacion es inmediata en la mayoria de los casos.',
  },
  {
    q: 'Los precios son en dolares?',
    a: 'No. Todos nuestros precios son en pesos argentinos (ARS). Aceptamos MercadoPago y transferencia bancaria. Sin tarjetas internacionales ni conversiones.',
  },
  {
    q: 'Que pasa si cancelo?',
    a: 'Podes cancelar cuando quieras, sin penalidades ni contratos de permanencia. Tu servicio seguira activo hasta que venza el periodo contratado.',
  },
  {
    q: 'Que es el Monitoreo Judicial?',
    a: 'Es un servicio que revisa automaticamente los portales PJN y SCBA cada 2 horas y te envia por email las nuevas notificaciones con el texto completo del PDF. No necesitas entrar al portal nunca mas.',
  },
  {
    q: 'Que portales judiciales monitorean?',
    a: 'Actualmente PJN y SCBA, con expansion planificada a MEV, PJ Buenos Aires, Cordoba y Santa Fe durante 2026.',
  },
  {
    q: 'Como funciona la Prospeccion B2B con IA?',
    a: 'El sistema busca prospectos en tu nicho y ciudad, extrae emails verificados de sus webs, y envia emails unicos generados por IA que mencionan datos reales de cada negocio. Todo automatico con seguimiento en Google Sheets.',
  },
  {
    q: 'Cuantos leads puedo capturar por dia?',
    a: 'Entre 50 y 150 leads unicos por dia dependiendo de los nichos y ciudades. Se deduplican automaticamente. No hay limite mensual.',
  },
  {
    q: 'Como funciona el respondedor de resenas de Google?',
    a: 'Un agente de IA monitorea tu perfil de Google Business cada 30 minutos. Cuando detecta una resena nueva, genera una respuesta personalizada segun la puntuacion, el contenido y el nombre del cliente. Se publica automaticamente con el tono de tu marca.',
  },
  {
    q: 'Que hace el LinkedIn Optimizer?',
    a: 'Analiza tu perfil de LinkedIn, genera recomendaciones de optimizacion y crea publicaciones profesionales de alto impacto. Lo confirmas desde Telegram y se publica automaticamente. Incluye plan de contenido semanal.',
  },
  {
    q: 'Como funcionan las Senales Crypto?',
    a: 'Un bot analiza 18 pares crypto con 7 indicadores tecnicos + 3 macro. Cuando hay confluencia (score >= 6/10), te envia una alerta a Telegram con precio de entrada, Stop Loss, Take Profit y ratio riesgo/beneficio. 60% win rate verificado.',
  },
  {
    q: 'Que incluye la automatizacion de redes sociales?',
    a: 'Un sistema 100% automatizado busca contenido de tu nicho, lo procesa con IA, genera imagenes y lo publica en Instagram automaticamente. Incluye 4 publicaciones diarias (fotos y reels) sin intervencion humana.',
  },
  {
    q: 'Como funciona el sistema de Turnos Online?',
    a: 'Tus clientes eligen dia, hora y servicio desde una web responsive. El turno se confirma automaticamente por email y se registra en Google Calendar. Incluye disponibilidad en tiempo real y personalizacion completa.',
  },
  {
    q: 'Que tipo de automatizaciones hacen a medida?',
    a: 'Desarrollamos flujos con IA: scraping de datos, integraciones API, agentes LLM (GPT, Gemini, Groq), procesamiento de documentos, notificaciones inteligentes y mas. Cada proyecto se adapta a tu necesidad.',
  },
  {
    q: 'Como es el soporte?',
    a: 'Soporte directo por WhatsApp. Sin bots, sin tickets, sin esperar dias. Respondemos consultas en horario comercial y emergencias criticas fuera de horario.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-surface-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
