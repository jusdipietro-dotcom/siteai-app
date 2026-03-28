'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, Sparkles, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Rubro } from '@/data/rubros'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

export function RubroContent({ rubro, otherRubros }: { rubro: Rubro; otherRubros: Rubro[] }) {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-surface-950 pt-32 pb-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-100" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 bg-brand-600/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Creado especialmente para {rubro.name.toLowerCase()}
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.5} className="text-6xl mb-6">
            {rubro.emoji}
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            {rubro.heroTitle}
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {rubro.heroSubtitle}
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto shadow-brand">
                <Zap className="w-5 h-5" />
                Crear sitio web gratis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white hover:border-surface-600">
                Ver más opciones
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-950 mb-4">
              Características especiales para {rubro.name.toLowerCase()}
            </h2>
            <p className="text-lg text-surface-600 max-w-2xl mx-auto">
              Cada sitio está optimizado con las funciones que tu negocio necesita
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rubro.features.map((feature, i) => (
              <motion.div key={feature} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="flex gap-4 p-6 rounded-xl border border-surface-200 hover:border-brand-500/30 hover:bg-brand-50/50 transition-all">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-brand-600 mt-1" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-surface-900">{feature}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-sell Section */}
      {rubro.crossSell && (
        <section className="py-20 bg-surface-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${rubro.crossSell.gradient} p-8 lg:p-12 text-white`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-white/80">Complemento ideal</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">{rubro.crossSell.title}</h3>
                <p className="text-lg text-white/80 mb-4">{rubro.crossSell.subtitle}</p>
                <p className="text-white/70 leading-relaxed mb-6 max-w-2xl">{rubro.crossSell.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {rubro.crossSell.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link href={rubro.crossSell.ctaHref}>
                    <Button size="lg" className="gap-2 bg-white text-surface-900 hover:bg-white/90 font-bold">
                      {rubro.crossSell.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <div>
                    <p className="text-sm font-bold text-white">{rubro.crossSell.price}</p>
                    <p className="text-xs text-white/60">{rubro.crossSell.priceNote}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-950 mb-6">
              Tu sitio web en minutos, sin código
            </h2>
            <p className="text-lg text-surface-600 mb-10 max-w-2xl mx-auto">
              Completá un simple formulario, elegí el estilo y nuestra IA genera un sitio profesional, optimizado para SEO y publicado en minutos.
            </p>
            <Link href="/register">
              <Button size="xl" variant="gradient" className="gap-2 shadow-brand">
                <Zap className="w-5 h-5" />
                Empezar ahora
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Related Rubros */}
      {otherRubros.length > 0 && (
        <section className="py-20 bg-white border-t border-surface-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-extrabold text-surface-950 mb-12 text-center">
              Otros tipos de negocios
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherRubros.map((r, i) => (
                <motion.div key={r.slug} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="group">
                  <Link href={`/para/${r.slug}`}>
                    <div className="h-full p-8 rounded-xl border border-surface-200 hover:border-brand-500/50 hover:bg-brand-50/30 transition-all cursor-pointer">
                      <div className="text-4xl mb-4">{r.emoji}</div>
                      <h3 className="text-xl font-bold text-surface-900 mb-2 group-hover:text-brand-600 transition-colors">
                        {r.name}
                      </h3>
                      <p className="text-sm text-surface-600">{r.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/para">
                <Button variant="outline" className="gap-2">
                  Ver todos los tipos
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
