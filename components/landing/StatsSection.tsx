'use client'
import { motion } from 'framer-motion'
import { Zap, Globe, Star, Building2 } from 'lucide-react'

const stats = [
  {
    icon: Building2,
    value: '+500',
    label: 'negocios con su sitio',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Zap,
    value: '58s',
    label: 'promedio de generación',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Globe,
    value: '12',
    label: 'rubros disponibles',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'calificación promedio',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-surface-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(0,153,255,0.08),transparent)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-4xl font-extrabold ${stat.color} mb-1 tracking-tight`}>
                  {stat.value}
                </div>
                <div className="text-sm text-surface-400 leading-snug">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
