'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle, BookOpen, Zap, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: '¿Cómo creo mi primer sitio web?',
    a: 'Hacé clic en "Nuevo sitio" en la barra lateral izquierda. El asistente te guiará paso a paso para ingresar los datos de tu negocio y generará el sitio automáticamente.',
  },
  {
    q: '¿Qué incluye el plan gratuito?',
    a: 'El plan gratuito te permite crear y editar sitios en modo borrador. Para publicar y tener dominio propio necesitás el plan Essential o Professional.',
  },
  {
    q: '¿Puedo cambiar el diseño después de generarlo?',
    a: 'Sí. Desde el editor podés modificar colores, textos, imágenes y secciones. Los cambios se guardan automáticamente en tiempo real.',
  },
  {
    q: '¿Cómo funciona el pago?',
    a: 'Los pagos se procesan de forma segura a través de MercadoPago con suscripción mensual. Podés cancelar en cualquier momento desde la configuración del proyecto.',
  },
  {
    q: '¿Mi sitio va a aparecer en Google?',
    a: 'Sí. Todos los sitios publicados incluyen metadatos SEO optimizados, Open Graph, y están preparados para ser indexados por buscadores.',
  },
  {
    q: '¿Puedo subir mis propias imágenes?',
    a: 'Sí. Desde la sección Multimedia podés subir imágenes en formato PNG, JPG o WebP de hasta 5 MB. Luego podés usarlas en cualquier sección del editor.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-surface-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-surface-800">{q}</span>
        <ChevronDown className={cn('h-4 w-4 text-surface-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-surface-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Centro de ayuda</h1>
        <p className="text-sm text-surface-500 mb-10">Encontrá respuestas a las preguntas más frecuentes.</p>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Zap,           label: 'Primeros pasos' },
            { icon: BookOpen,      label: 'Guías' },
            { icon: LifeBuoy,      label: 'Soporte' },
            { icon: MessageCircle, label: 'Contacto' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-surface-200 hover:border-brand-200 hover:bg-brand-50 transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center text-brand-500 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-surface-700">{label}</span>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <h2 className="text-base font-semibold text-surface-900 mb-4">Preguntas frecuentes</h2>
          <div>
            {FAQS.map(({ q, a }) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>

        {/* Contact card */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold mb-1">¿No encontraste lo que buscabas?</p>
              <p className="text-sm text-white/80 mb-3">Nuestro equipo responde en menos de 24 horas.</p>
              <button
                type="button"
                className="h-9 px-4 rounded-xl bg-white text-brand-700 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Contactar soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
