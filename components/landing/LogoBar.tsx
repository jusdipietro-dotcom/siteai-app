'use client'
import { motion } from 'framer-motion'

const businesses = [
  'Estudio Di Pietro', 'Pizzería La Romana', 'DermaGlow', 'FitLife Gym',
  'Inmobiliaria Torres', 'Consultora Nexo', 'Clínica Salud+', 'Barber Shop El Rey',
  'Academia Inglés Global', 'Ferrería Don José',
]

export function LogoBar() {
  return (
    <section className="bg-surface-950 border-t border-surface-800 py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-sm text-surface-600 font-medium mb-6 uppercase tracking-wider">
          Negocios que ya generaron su sitio
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface-950 to-transparent z-10" />
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...businesses, ...businesses].map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm font-medium text-surface-500 bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2 shrink-0"
              >
                <div className="w-2 h-2 bg-brand-500 rounded-full" />
                {name}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
