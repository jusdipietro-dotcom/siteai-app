'use client'
import { motion } from 'framer-motion'
import { businessTypes } from '@/data/mockBusinessTypes'

export function LandingVerticals() {
  return (
    <section id="rubros" className="py-24 bg-white scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Para tu rubro
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Trabajamos con cada tipo de negocio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Estrategias y soluciones adaptadas a la realidad de tu industria, en Argentina y la
            region.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {businessTypes.map((type, i) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 8) * 0.04 }}
              whileHover={{ y: -4 }}
              className="relative bg-white border border-surface-100 rounded-2xl p-5 hover:shadow-card transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-2xl"
                style={{ backgroundColor: type.color + '18' }}
              >
                {type.icon}
              </div>
              <h3 className="font-semibold text-surface-900 text-sm mb-1 leading-tight">
                {type.name}
              </h3>
              <p className="text-xs text-surface-400 leading-relaxed">{type.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {type.keywords.slice(0, 2).map((kw: string) => (
                  <span
                    key={kw}
                    className="text-xs bg-surface-50 text-surface-500 px-2 py-0.5 rounded-full border border-surface-100"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
