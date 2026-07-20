'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
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
            Reunión inicial sin costo · cotización en 24 horas
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Hablemos de tu proyecto.
            <span className="block text-brand-400">Empezamos con un diagnóstico técnico.</span>
          </h2>
          <p className="text-lg text-surface-400 mb-10">
            Inteligencia artificial, marketing digital, diseño web y SEO. 4 pilares de una agencia
            argentina. Cada implementación se cotiza a medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
                Pedir cotización
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="https://wa.me/5491171311465?text=Hola,%20quiero%20info%20sobre%20una%20cotizaci%C3%B3n">
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white">
                <MessageSquare className="w-5 h-5" />
                Hablemos por WhatsApp
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
