'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
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
            <Zap className="w-3.5 h-3.5" />
            Sin tarjeta de crédito · Plan gratuito disponible
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Tu negocio merece estar en internet.
            <span className="block text-brand-400">Empezá hoy.</span>
          </h2>
          <p className="text-lg text-surface-400 mb-10">
            Creá tu primer sitio en minutos. Sin código, sin diseñadores, sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
                <Zap className="w-5 h-5" />
                Crear mi sitio gratis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white">
                Ver demo en vivo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
