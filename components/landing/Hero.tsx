'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Star, Bot, Globe, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const products = [
  {
    icon: Globe,
    label: 'Sitios Web con IA',
    desc: 'Generá tu web en 60 segundos',
    color: 'from-brand-500 to-cyan-500',
    href: '#productos',
  },
  {
    icon: Scale,
    label: 'Monitoreo Judicial',
    desc: 'Notificaciones PJN y SCBA',
    color: 'from-violet-500 to-purple-600',
    href: '#productos',
  },
  {
    icon: Bot,
    label: 'Automatizaciones',
    desc: 'Flujos inteligentes a medida',
    color: 'from-emerald-500 to-teal-600',
    href: '#productos',
  },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-950 pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
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
          Plataforma de automatización inteligente
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-5xl mx-auto"
        >
          Automatizá tu negocio
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400">
            con inteligencia artificial
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Sitios web generados con IA, monitoreo judicial automático y
          automatizaciones a medida. Todo en una plataforma, sin código,
          sin complicaciones.
        </motion.p>

        {/* Product cards */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12"
        >
          {products.map((p) => {
            const Icon = p.icon
            return (
              <Link key={p.label} href={p.href}>
                <div className="group bg-surface-800/50 backdrop-blur border border-surface-700 rounded-2xl p-5 hover:border-brand-500/50 hover:bg-surface-800 transition-all duration-200 cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-3 mx-auto`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-white mb-1">{p.label}</h2>
                  <p className="text-xs text-surface-400">{p.desc}</p>
                </div>
              </Link>
            )
          })}
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link href="/register">
            <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
              <Zap className="w-5 h-5" />
              Empezar gratis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="#productos">
            <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white hover:border-surface-600">
              Ver productos
            </Button>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-surface-500"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1 text-surface-400 font-medium">4.9/5</span>
          </div>
          <span className="hidden sm:block text-surface-700">·</span>
          <span>+500 negocios automatizados</span>
          <span className="hidden sm:block text-surface-700">·</span>
          <span>Sin tarjeta de crédito</span>
        </motion.div>
      </div>
    </section>
  )
}
