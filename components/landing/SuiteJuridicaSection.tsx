'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  Scale,
  Shield,
  Receipt,
  CalendarDays,
  FileSearch,
  Check,
  Sparkles,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const services = [
  {
    icon: Scale,
    name: 'Notificaciones Judiciales',
    desc: 'PJN + SCBA, alertas cada 2 horas',
  },
  {
    icon: Receipt,
    name: 'Facturación Electrónica ARCA',
    desc: 'Facturas A, B, NC, ND — todo digital',
  },
  {
    icon: FileSearch,
    name: 'Dashboard de Causas MEV',
    desc: 'Todas tus causas SCBA en un panel',
  },
  {
    icon: CalendarDays,
    name: 'Turnos Online',
    desc: 'Agenda pública con confirmación automática',
  },
]

const plans = [
  {
    id: 'abogado',
    name: 'Abogado',
    price: '39.000',
    individualPrice: '56.000',
    savings: '30%',
    highlights: ['1 CUIT', '30 causas', '1 profesional'],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: '69.000',
    individualPrice: '112.000',
    savings: '38%',
    popular: true,
    highlights: ['Facturas A+B', '100 causas', '5 áreas de práctica'],
  },
  {
    id: 'estudio',
    name: 'Estudio Jurídico',
    price: '149.000',
    individualPrice: '230.000',
    savings: '35%',
    highlights: ['3 puntos de venta', 'Causas ilimitadas', '3 profesionales'],
  },
]

export function SuiteJuridicaSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950 via-[#0c0a20] to-surface-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(139,92,246,0.15),transparent)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/30 rounded-full px-4 py-2 text-sm font-medium text-violet-300 mb-6"
          >
            <Crown className="w-4 h-4" />
            Exclusivo para abogados y estudios jurídicos
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            Suite Jurídica
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400">
              Todo-en-uno para tu estudio
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-surface-400 leading-relaxed"
          >
            4 herramientas esenciales en una sola suscripción.
            Ahorra hasta un 38% vs contratarlas por separado.
          </motion.p>
        </div>

        {/* Services grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {services.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:border-violet-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{s.name}</h3>
                <p className="text-surface-400 text-xs">{s.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? 'bg-gradient-to-b from-violet-500/20 to-purple-600/10 border-2 border-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Más elegido
                  </span>
                </div>
              )}

              <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                <span className="text-surface-400 text-sm">/mes</span>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <span className="text-surface-500 text-xs line-through">${plan.individualPrice}/mes</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  -{plan.savings}
                </span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-surface-300">
                    <Check className="w-4 h-4 text-violet-400 shrink-0" />
                    {h}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-surface-300">
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  4 servicios incluidos
                </li>
              </ul>

              <Link href={`/register?next=suite-juridica`}>
                <Button
                  className={`w-full gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                  }`}
                >
                  Empezar ahora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-surface-400">
            <Shield className="w-4 h-4 text-violet-400" />
            Cancela cuando quieras. Sin contratos. Precios en pesos argentinos.
          </div>
        </motion.div>
      </div>
    </section>
  )
}
