'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: '¿Necesito saber programar o diseñar?',
    a: 'No. Completás un formulario con los datos de tu negocio y nuestra IA hace todo: el contenido, el diseño y la publicación. No se requiere ningún conocimiento técnico.',
  },
  {
    q: '¿Puedo editar el sitio después de generarlo?',
    a: 'Sí. Tenés un editor visual donde podés cambiar textos, imágenes, colores y secciones. Los cambios se reflejan en tiempo real en la preview antes de publicar.',
  },
  {
    q: '¿Dónde se publica mi sitio?',
    a: 'Tu sitio se publica automáticamente en GitHub Pages con una URL propia. En el plan Professional podés conectar tu propio dominio (.com, .com.ar, etc.).',
  },
  {
    q: '¿La IA genera el contenido o tengo que escribirlo?',
    a: 'La IA genera todo el contenido inicial basándose en los datos que ingresás (nombre, rubro, servicios, estilo). Después podés ajustar cualquier texto desde el editor.',
  },
  {
    q: '¿Puedo usar mi propio dominio personalizado?',
    a: 'Sí, está disponible en el plan Professional. Requiere una configuración DNS simple que te explicamos paso a paso desde el soporte.',
  },
  {
    q: '¿Qué pasa si cancelo mi plan?',
    a: 'Podés cancelar cuando quieras, sin penalidades. Tu sitio seguirá publicado hasta que venza el período contratado. No hay contratos anuales forzosos.',
  },
  {
    q: '¿Cuánto tiempo tarda en generarse el sitio?',
    a: 'El tiempo promedio de generación es de 58 segundos. Una vez generado, el sitio queda publicado y accesible inmediatamente.',
  },
  {
    q: '¿Incluye botón de WhatsApp?',
    a: 'Sí, todos los planes incluyen el botón flotante de WhatsApp integrado automáticamente con el número que ingresés en el formulario.',
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
