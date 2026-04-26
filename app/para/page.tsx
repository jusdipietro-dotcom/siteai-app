import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { rubros } from '@/data/rubros'
import { RubrosGrid } from './_components/RubrosGrid'

export const metadata: Metadata = {
  title: 'Sitios Web para Tu Rubro · Automatic IA Lab',
  description: 'Creá un sitio web profesional para tu negocio. Soluciones especializadas para restaurantes, abogados, médicos, gimnasios y más.',
  keywords: [
    'sitio web para negocios',
    'crear página web Argentina',
    'generador de sitios web',
    'web para restaurante',
    'web para abogados',
    'web para médicos',
  ],
  alternates: {
    canonical: 'https://automaticialab.com/para',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Automatic IA Lab',
    title: 'Sitios Web para Tu Rubro',
    description: 'Creá un sitio web profesional para tu negocio',
    url: 'https://automaticialab.com/para',
  },
}

export default function RubrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden bg-surface-950 pt-32 pb-16">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,153,255,0.25),transparent)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-100" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-600/15 border border-brand-500/30 rounded-full px-4 py-2 text-sm font-medium text-brand-300 mb-6">
            <span>✨</span>
            Soluciones para cada rubro
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Sitios web especializados para tu negocio
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Elegí tu rubro y creá un sitio web profesional en minutos. Cada diseño está optimizado con las funciones que tu negocio necesita.
          </p>
        </div>
      </section>

      {/* Rubros Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RubrosGrid rubros={rubros} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              No ves tu rubro específico?
            </h2>
            <p className="text-lg text-surface-400 mb-10 max-w-2xl mx-auto">
              Trabajamos con cualquier tipo de negocio. Contanos sobre el tuyo y armamos una propuesta a medida.
            </p>
            <Link href="/contacto">
              <Button size="xl" variant="gradient" className="gap-2 shadow-brand">
                Pedir cotización
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
