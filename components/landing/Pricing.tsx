'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Globe, Scale, Target, Search, MessageSquare, Linkedin, Send, CandlestickChart, Instagram, CalendarCheck, Bot, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

const productPricing = [
  {
    icon: Globe,
    name: 'Sitios Web con IA',
    price: 'Desde $0',
    period: '/mes',
    note: 'Plan gratuito disponible',
    gradient: 'from-brand-500 to-cyan-500',
    href: '/register',
  },
  {
    icon: Scale,
    name: 'Monitoreo Judicial',
    price: 'Desde $19.000',
    period: '/mes',
    note: 'Por CUIT monitoreado',
    gradient: 'from-violet-500 to-purple-600',
    href: '/register?next=monitoreo',
  },
  {
    icon: FileText,
    name: 'LexPost Legal',
    price: 'Desde $15.000',
    period: '/mes',
    note: 'Publicacion legal en Instagram',
    gradient: 'from-indigo-600 to-blue-800',
    href: '/register?next=lexpost',
  },
  {
    icon: Target,
    name: 'Prospeccion B2B',
    price: 'Desde $25.000',
    period: '/mes',
    note: 'Leads + emails con IA',
    gradient: 'from-orange-500 to-red-600',
    href: '/register?next=prospeccion',
  },
  {
    icon: Search,
    name: 'Captacion de Leads',
    price: 'Desde $18.000',
    period: '/mes',
    note: 'Leads ilimitados',
    gradient: 'from-rose-500 to-pink-600',
    href: '/register?next=leads',
  },
  {
    icon: MessageSquare,
    name: 'Resenas Google IA',
    price: 'Desde $15.000',
    period: '/mes',
    note: 'Por perfil de Google Business',
    gradient: 'from-amber-500 to-orange-500',
    href: '/register?next=resenas',
  },
  {
    icon: Linkedin,
    name: 'LinkedIn Optimizer',
    price: 'Desde $12.000',
    period: '/mes',
    note: 'Por perfil de LinkedIn',
    gradient: 'from-blue-600 to-sky-500',
    href: '/register?next=linkedin',
  },
  {
    icon: Send,
    name: 'Email Marketing',
    price: 'Desde $15.000',
    period: '/mes',
    note: 'En pesos, sin USD',
    gradient: 'from-pink-500 to-rose-600',
    href: '/servicios/email-marketing#planes',
  },
  {
    icon: CandlestickChart,
    name: 'Senales Crypto',
    price: '$20.000',
    period: '/mes',
    note: '18 pares | análisis técnico',
    gradient: 'from-emerald-500 to-green-600',
    href: '/register?next=crypto',
  },
  {
    icon: Instagram,
    name: 'Redes Sociales IA',
    price: 'A medida',
    period: '',
    note: 'Setup + publicacion diaria',
    gradient: 'from-fuchsia-500 to-purple-600',
    href: 'https://wa.me/5491171311465?text=Hola,%20me%20interesa%20la%20automatizacion%20de%20redes%20sociales',
  },
  {
    icon: CalendarCheck,
    name: 'Turnos Online',
    price: 'Desde $12.000',
    period: '/mes',
    note: 'Setup incluido',
    gradient: 'from-teal-500 to-cyan-600',
    href: 'https://wa.me/5491171311465?text=Hola,%20me%20interesa%20el%20sistema%20de%20turnos%20online',
  },
  {
    icon: Bot,
    name: 'Automatizaciones IA',
    price: 'Desde $50.000',
    period: '',
    note: 'Presupuesto a medida',
    gradient: 'from-slate-600 to-slate-800',
    href: 'https://wa.me/5491171311465?text=Hola,%20necesito%20una%20automatizacion%20personalizada',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
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
            Un precio para cada necesidad
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Todos los precios en pesos argentinos. Sin contratos, sin costos ocultos. Cancela cuando quieras.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productPricing.map((product, i) => {
            const Icon = product.icon
            return (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-surface-100 p-5 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-surface-900 text-sm mb-1">{product.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-2xl font-extrabold text-surface-900">{product.price}</span>
                  {product.period && <span className="text-sm text-surface-400">{product.period}</span>}
                </div>
                <p className="text-xs text-surface-400 mb-4 flex-1">{product.note}</p>
                <Link href={product.href}>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    Ver mas <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-surface-500 mb-4">
            Necesitas algo diferente? Armate un combo de productos o pedinos un presupuesto a medida.
          </p>
          <Link href="https://wa.me/5491171311465?text=Hola,%20quiero%20consultar%20por%20precios">
            <Button variant="gradient" className="gap-2">
              Consultar por WhatsApp <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
