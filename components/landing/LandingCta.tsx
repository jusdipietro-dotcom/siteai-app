'use client'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { waLink } from '@/lib/whatsapp'

const ctaWa = waLink(
  'Hola! Quiero coordinar una reunion para conversar sobre un proyecto con Automatic IA Lab.'
)

export function LandingCta() {
  return (
    <section className="py-24 bg-surface-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(99,102,241,0.2),transparent)]" />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-brand-500/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Reunion inicial sin costo - Respondemos en menos de 24 horas
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Hablemos de tu proyecto.
            <span className="block text-brand-400">Una sola conversacion alcanza para empezar.</span>
          </h2>
          <p className="text-lg text-surface-400 mb-10">
            Inteligencia artificial, marketing digital, diseno web y SEO. 4 pilares de una agencia
            argentina pensada para acompaniar a tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={ctaWa} target="_blank" rel="noopener noreferrer">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
                <MessageCircle className="w-5 h-5" />
                Escribinos por WhatsApp
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
          <p className="text-sm text-surface-500 mt-6">
            +54 9 11 7131 1465 - Buenos Aires, Argentina
          </p>
        </motion.div>
      </div>
    </section>
  )
}
