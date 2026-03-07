'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Para probar la plataforma',
    cta: 'Empezar gratis',
    ctaVariant: 'outline' as const,
    href: '/register',
    popular: false,
    features: [
      '1 sitio web',
      'Template básico',
      '4 secciones (Hero, Servicios, Sobre mí, Contacto)',
      'URL en GitHub Pages',
      'Botón de WhatsApp',
      'Soporte por email',
    ],
    missing: ['SEO avanzado', 'Google Analytics', 'Galería de fotos', 'FAQ y Testimonios', 'Template premium'],
  },
  {
    name: 'Essential',
    price: '12.000',
    description: 'Para negocios que quieren presencia online',
    cta: 'Elegir Essential',
    ctaVariant: 'gradient' as const,
    href: '/register?plan=essential',
    popular: true,
    features: [
      '3 sitios web',
      'Todos los templates incluidos',
      '6 secciones (+ Galería, Testimonios)',
      'URL en GitHub Pages',
      'SEO optimizado',
      'Botón de WhatsApp',
      'Personalización de colores',
      'Soporte prioritario',
    ],
    missing: ['Google Analytics', 'FAQ avanzado', 'Dominio personalizado'],
  },
  {
    name: 'Professional',
    price: '29.000',
    description: 'Para negocios que quieren el máximo impacto',
    cta: 'Elegir Professional',
    ctaVariant: 'gradient' as const,
    href: '/register?plan=professional',
    popular: false,
    features: [
      'Sitios ilimitados',
      'Todos los templates premium',
      '8+ secciones completas',
      'SEO avanzado + sitemap',
      'Google Analytics integrado',
      'Galería con lightbox',
      'FAQ accordion',
      'Editor visual avanzado',
      'Dominio personalizado*',
      'Soporte premium',
    ],
    missing: [],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Precios
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Planes simples, sin sorpresas
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Sin contratos, sin costos ocultos. Cancelá cuando quieras. Sin tarjeta para empezar.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative bg-white rounded-2xl border shadow-soft ${
                plan.popular
                  ? 'border-brand-400 shadow-brand ring-2 ring-brand-500/20 scale-105'
                  : 'border-surface-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="gradient-brand text-white text-xs font-bold px-3 py-1 rounded-full shadow-brand flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Más popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg font-bold text-surface-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-surface-500 mb-5">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-sm text-surface-500">$</span>
                  <span className="text-5xl font-extrabold text-surface-900">{plan.price}</span>
                  <span className="text-sm text-surface-500">/ mes</span>
                </div>

                <Link href={plan.href}>
                  <Button variant={plan.ctaVariant} className="w-full mb-6">
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-surface-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-surface-400 line-through">
                      <Check className="w-4 h-4 text-surface-200 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-surface-400 mt-6">
          * Dominio personalizado requiere configuración DNS manual. Consultar soporte.
        </p>
      </div>
    </section>
  )
}
