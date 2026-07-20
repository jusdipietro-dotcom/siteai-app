'use client'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Brain, Megaphone, Layout, Search, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { waLink } from '@/lib/whatsapp'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const pillars = [
  {
    icon: Brain,
    label: 'Inteligencia Artificial',
    desc: 'Agentes, chatbots y automatizacion con LLMs',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Megaphone,
    label: 'Marketing Digital',
    desc: 'Meta Ads, Google Ads y contenido organico',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: Layout,
    label: 'Diseno Web',
    desc: 'Sitios a medida, sin templates',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Search,
    label: 'Posicionamiento SEO',
    desc: 'Aparece primero en Google',
    color: 'from-emerald-500 to-teal-600',
  },
]

const heroWa = waLink(
  'Hola! Quiero recibir mas informacion sobre los servicios de Automatic IA Lab.'
)

export function LandingHero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-950 pt-16"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-100" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 bg-brand-600/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Agencia digital - Buenos Aires, Argentina
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-5xl mx-auto"
        >
          Hacemos crecer tu negocio con
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-violet-400 to-cyan-400">
            IA, marketing, diseno y SEO
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Somos una agencia argentina especializada en cuatro pilares: inteligencia artificial
          aplicada, marketing digital, diseno web a medida y posicionamiento SEO. Cada proyecto se
          planifica y se implementa de manera personalizada para tu negocio.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12"
        >
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.label}
                className="bg-surface-800/50 backdrop-blur border border-surface-700 rounded-2xl p-5 h-full"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-3 mx-auto`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">{p.label}</p>
                <p className="text-xs text-surface-400">{p.desc}</p>
              </div>
            )
          })}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <a href={heroWa} target="_blank" rel="noopener noreferrer">
            <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
              <MessageCircle className="w-5 h-5" />
              Consultanos por WhatsApp
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <a href="#servicios">
            <Button
              size="xl"
              variant="outline"
              className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white hover:border-surface-600"
            >
              Ver nuestros servicios
            </Button>
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-surface-500"
        >
          <span>Asesoramiento sin compromiso</span>
          <span className="hidden sm:block text-surface-700">-</span>
          <span>Respuesta en menos de 24 horas</span>
          <span className="hidden sm:block text-surface-700">-</span>
          <span>Soporte directo por WhatsApp</span>
        </motion.div>
      </div>
    </section>
  )
}
