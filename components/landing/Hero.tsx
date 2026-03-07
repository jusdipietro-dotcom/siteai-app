'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Sparkles, Globe, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-950 pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 bg-brand-600/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generá tu sitio con IA en menos de 60 segundos
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto"
        >
          Tu negocio merece
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400">
            un sitio web increíble
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Completá un formulario simple, elegí tu estilo y nuestra IA genera
          un sitio web profesional, publicado en GitHub Pages, listo para usar.
          Sin código. Sin diseñadores. Sin complicaciones.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/register">
            <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
              <Zap className="w-5 h-5" />
              Crear mi sitio gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white hover:border-surface-600">
              <Play className="w-4 h-4" />
              Ver demo
            </Button>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-surface-500 mb-16"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1 text-surface-400 font-medium">4.9/5</span>
          </div>
          <span className="hidden sm:block text-surface-700">·</span>
          <span>+500 negocios ya tienen su sitio</span>
          <span className="hidden sm:block text-surface-700">·</span>
          <span>Sin tarjeta de crédito</span>
        </motion.div>

        {/* Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Browser chrome */}
          <div className="bg-surface-800 rounded-2xl overflow-hidden border border-surface-700 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            {/* URL bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700 bg-surface-900">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 bg-surface-800 rounded-lg px-3 py-1 text-xs text-surface-500 font-mono flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                pizzeria-la-romana.github.io
              </div>
            </div>
            {/* Site preview */}
            <div className="relative bg-white overflow-hidden" style={{ height: '380px' }}>
              {/* Mock site hero */}
              <div className="h-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center text-white p-8">
                <div className="text-4xl font-extrabold mb-3 tracking-tight">Pizzería La Romana</div>
                <div className="text-lg text-red-200 mb-6">La mejor pizza artesanal de Palermo</div>
                <div className="flex gap-3">
                  <div className="bg-white text-red-700 font-bold px-5 py-2.5 rounded-full text-sm">Hacer pedido</div>
                  <div className="border-2 border-white/60 text-white font-bold px-5 py-2.5 rounded-full text-sm">Ver menú</div>
                </div>
                {/* Decorative elements */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl">
                  <div className="grid grid-cols-3 gap-3 px-6">
                    {['20+ Variedades', 'Delivery 45min', 'Horno de leña'].map((label) => (
                      <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-xs text-white/70">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-elevated flex items-center gap-1.5"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Publicado en 58s
          </motion.div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-4 -left-4 bg-white border border-surface-100 text-surface-900 text-xs font-semibold px-3 py-2 rounded-xl shadow-elevated flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Contenido generado con IA
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
