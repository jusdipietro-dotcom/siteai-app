'use client'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { rubros } from '@/data/rubros'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

interface PageProps {
  params: {
    rubro: string
  }
}

export function generateStaticParams() {
  return rubros.map((rubro) => ({
    rubro: rubro.slug,
  }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const rubro = rubros.find((r) => r.slug === params.rubro)

  if (!rubro) {
    return {
      title: 'No encontrado',
    }
  }

  return {
    title: rubro.heroTitle,
    description: rubro.description,
    keywords: rubro.keywords,
    alternates: {
      canonical: `https://automaticialab.com/para/${rubro.slug}`,
    },
    openGraph: {
      type: 'website',
      locale: 'es_AR',
      siteName: 'Automatic IA Lab',
      title: rubro.heroTitle,
      description: rubro.description,
      url: `https://automaticialab.com/para/${rubro.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: rubro.heroTitle,
      description: rubro.description,
    },
  }
}

export default function RubroPage({ params }: PageProps) {
  const rubro = rubros.find((r) => r.slug === params.rubro)

  if (!rubro) {
    notFound()
  }

  const otherRubros = rubros.filter((r) => r.slug !== params.rubro).slice(0, 3)

  return (
    <>
      <SchemaMarkup rubro={rubro} />
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-surface-950 pt-32 pb-16">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-100" />
            <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 bg-brand-600/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Creado especialmente para {rubro.name.toLowerCase()}
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>

            {/* Emoji */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.5}
              className="text-6xl mb-6"
            >
              {rubro.emoji}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6"
            >
              {rubro.heroTitle}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {rubro.heroSubtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
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
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-surface-950 mb-4">
                Características especiales para {rubro.name.toLowerCase()}
              </h2>
              <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                Cada sitio está optimizado con las funciones que tu negocio necesita
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rubro.features.map((feature, i) => (
                <motion.div
                  key={feature}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="flex gap-4 p-6 rounded-xl border border-surface-200 hover:border-brand-500/30 hover:bg-brand-50/50 transition-all"
                >
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

        {/* CTA Section */}
        <section className="py-20 bg-surface-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
            >
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
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-extrabold text-surface-950 mb-12 text-center"
              >
                Otros tipos de negocios
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {otherRubros.map((r, i) => (
                  <motion.div
                    key={r.slug}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={i}
                    className="group"
                  >
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

        <Footer />
      </div>
    </>
  )
}

function SchemaMarkup({ rubro }: { rubro: (typeof rubros)[0] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Creador de Sitios Web para ${rubro.name}`,
    description: rubro.description,
    url: `https://automaticialab.com/para/${rubro.slug}`,
    applicationCategory: 'WebApplications',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ARS',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '500',
    },
    keywords: rubro.keywords.join(', '),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
