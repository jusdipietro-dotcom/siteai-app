'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

interface RubrosGridProps {
  rubros: Rubro[]
}

export function RubrosGrid({ rubros }: RubrosGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rubros.map((rubro, i) => (
          <motion.div
            key={rubro.slug}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            className="group"
          >
            <Link href={`/para/${rubro.slug}`}>
              <div className="h-full p-8 rounded-2xl border-2 border-surface-200 hover:border-brand-500 hover:shadow-lg hover:bg-brand-50/30 transition-all cursor-pointer">
                {/* Emoji */}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {rubro.emoji}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-surface-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {rubro.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-surface-600 mb-6 line-clamp-2">
                  {rubro.description}
                </p>

                {/* Features Preview */}
                <div className="space-y-2 mb-6">
                  {rubro.features.slice(0, 3).map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-surface-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                      {feature}
                    </div>
                  ))}
                  {rubro.features.length > 3 && (
                    <div className="text-xs text-surface-500 font-medium pt-2">
                      +{rubro.features.length - 3} características más
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:gap-3 transition-all">
                  Crear sitio web
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  )
}
