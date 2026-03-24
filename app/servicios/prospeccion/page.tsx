'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Check, Target, Shield, Clock, Mail,
  BarChart3, Zap, Search, ChevronDown, X, UserCheck,
} from 'lucide-react'

const WA_LINK = 'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20prospeccion%20B2B%20con%20IA'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 25000,
    popular: false,
    desc: 'Para freelancers y emprendedores que arrancan',
    nichos: '1',
    ciudades: '3',
    emailsDay: '100',
    multiAccount: false,
    crmIntegration: false,
    weeklyReporting: false,
    monthlyAdjust: false,
    supportType: 'Email',
    features: [
      '1 nicho de prospeccion',
      'Hasta 3 ciudades',
      '100 emails IA personalizados por dia',
      'Google Sheets en tiempo real',
      'Anti-spam + desuscripcion automatica',
      'Soporte por email',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 45000,
    popular: true,
    desc: 'Para agencias y equipos de ventas B2B',
    nichos: '3',
    ciudades: '5',
    emailsDay: '100',
    multiAccount: false,
    crmIntegration: false,
    weeklyReporting: false,
    monthlyAdjust: true,
    supportType: 'WhatsApp',
    features: [
      'Hasta 3 nichos de prospeccion',
      'Hasta 5 ciudades',
      '100 emails IA personalizados por dia',
      'Google Sheets en tiempo real',
      'Anti-spam + desuscripcion automatica',
      'Ajuste mensual de estrategia',
      'Soporte por WhatsApp',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 75000,
    popular: false,
    desc: 'Para empresas con multiples verticales',
    nichos: 'Ilimitados',
    ciudades: 'Ilimitadas',
    emailsDay: '100',
    multiAccount: true,
    crmIntegration: true,
    weeklyReporting: true,
    monthlyAdjust: true,
    supportType: 'Dedicado',
    features: [
      'Nichos ilimitados + personalizados',
      'Ciudades ilimitadas',
      '100 emails IA personalizados por dia',
      'Multi-cuenta',
      'Integracion CRM',
      'Reporting semanal',
      'Ajuste mensual de estrategia',
      'Soporte dedicado',
    ],
  },
]

const planComparisonRows = [
  { label: 'Nichos de prospeccion', key: 'nichos' as const },
  { label: 'Ciudades', key: 'ciudades' as const },
  { label: 'Emails IA por dia', key: 'emailsDay' as const },
  { label: 'Tipo de soporte', key: 'supportType' as const },
]

const features = [
  {
    icon: Search,
    title: 'Captacion automatica de leads',
    desc: 'El sistema busca negocios reales en tu nicho y ciudad, extrae datos de contacto y emails verificados.',
  },
  {
    icon: Mail,
    title: 'Emails personalizados con IA',
    desc: 'Cada email es unico: la IA analiza el negocio del prospecto y redacta un mensaje relevante para el.',
  },
  {
    icon: Shield,
    title: 'Anti-spam profesional',
    desc: 'Ritmo controlado, subject optimizado y link de desuscripcion en cada email. Llegas a la bandeja de entrada.',
  },
  {
    icon: BarChart3,
    title: 'Google Sheets en tiempo real',
    desc: 'Todos los leads captados y emails enviados se registran automaticamente en tu planilla.',
  },
  {
    icon: UserCheck,
    title: 'Emails verificados',
    desc: 'Cada email se valida contra el dominio real del negocio antes de enviarlo.',
  },
  {
    icon: Zap,
    title: 'Todo automatico, 24/5',
    desc: 'Configuras una vez y el sistema trabaja solo. Prospeccion continua sin intervencion manual.',
  },
]

const steps = [
  { num: '1', title: 'Capta leads', desc: 'El sistema busca negocios en tus nichos y ciudades, extrae datos de contacto y emails verificados.' },
  { num: '2', title: 'Genera emails con IA', desc: 'La IA analiza cada prospecto y redacta un email unico, relevante y personalizado.' },
  { num: '3', title: 'Envia automaticamente', desc: 'Los emails se envian a ritmo controlado con anti-spam. Todo queda registrado en Google Sheets.' },
]

const faqs = [
  { q: 'Como encuentra los leads?', a: 'El sistema busca negocios reales en Google Maps y directorios por nicho y ciudad, extrae datos de contacto y valida los emails contra el dominio del negocio.' },
  { q: 'Los emails caen en spam?', a: 'No. El sistema usa anti-spam profesional: envio a ritmo controlado, personalización por IA, templates optimizados y link de desuscripcion en cada email.' },
  { q: 'Cuantos emails por dia se envian?', a: 'Todos los planes incluyen 100 emails personalizados por dia. Cada email es unico, generado por IA segun el prospecto.' },
  { q: 'Necesito saber de tecnologia?', a: 'No. Nosotros configuramos todo. Vos solo elegis nichos, ciudades y nos describis tus servicios. El sistema trabaja solo.' },
  { q: 'Puedo cambiar los nichos o ciudades?', a: 'Si. Podes ajustar nichos, ciudades y la descripcion de servicios en cualquier momento.' },
  { q: 'Que pasa si alguien se desuscribe?', a: 'Se excluye automaticamente de futuros envios. El sistema respeta la desuscripcion sin intervencion manual.' },
]

const useCases = [
  { emoji: '\uD83C\uDFE2', title: 'Agencias de marketing', desc: 'Capta clientes para tu agencia en nichos especificos y ciudades target.' },
  { emoji: '\uD83D\uDCBC', title: 'Consultoras B2B', desc: 'Genera reuniones con decision-makers de empresas en tu vertical.' },
  { emoji: '\uD83D\uDEE0\uFE0F', title: 'Software y SaaS', desc: 'Llega a negocios que necesitan tu solucion con emails relevantes.' },
  { emoji: '\uD83C\uDFEB', title: 'Servicios profesionales', desc: 'Abogados, contadores, arquitectos: conecta con clientes potenciales automaticamente.' },
]

export default function ProspeccionServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-rose-500 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Target className="w-4 h-4" /> Nuevo servicio
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Prospeccion B2B<br />con IA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed"
            >
              Capta leads reales, genera emails unicos con IA y envia automaticamente. Todo en piloto automatico, 24/5.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#planes">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-orange-600 hover:bg-white/90 font-bold text-base px-8">
                  Ver planes y precios <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#como-funciona">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Como funciona <ChevronDown className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-surface-50 border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '100', label: 'emails IA/dia' },
            { num: '100%', label: 'automatico' },
            { num: 'ARS', label: 'pagas en pesos' },
            { num: '24hs', label: 'implementacion' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-orange-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Que incluye</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Captacion de leads + emails con IA en un solo sistema
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:shadow-card transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Como funciona
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Casos de uso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Ideal para
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-100 text-center"
              >
                <div className="text-3xl mb-3">{uc.emoji}</div>
                <h3 className="font-bold text-surface-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-surface-500">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-surface-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-1">
            {faqs.map(f => (
              <div key={f.q} className="bg-white rounded-xl p-5 border border-surface-100">
                <h3 className="font-semibold text-surface-900 mb-2">{f.q}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section id="planes" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Planes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Elegi el plan que se adapte a tu negocio
            </h2>
            <p className="text-surface-500">Todos los planes incluyen captacion de leads, emails con IA, anti-spam y Google Sheets.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border ${p.popular ? 'border-orange-300 shadow-lg ring-2 ring-orange-500/20' : 'border-surface-100'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mas elegido
                  </div>
                )}
                <h3 className="text-xl font-bold text-surface-900 mb-1">{p.name}</h3>
                <p className="text-sm text-surface-400 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-surface-900">${p.price.toLocaleString('es-AR')}</span>
                  <span className="text-surface-400 text-sm">/mes</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                      <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?next=prospeccion&plan=${p.id}`}>
                  <Button
                    variant={p.popular ? 'gradient' : 'outline'}
                    className={`w-full gap-2 ${p.popular ? '' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                  >
                    Empezar ahora <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan comparison table */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-orange-600 font-semibold text-sm uppercase tracking-wider mb-3">Detalle</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Compara los planes en detalle
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-surface-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-900 text-white">
                  <th scope="col" className="text-left py-3 px-4 font-semibold">Caracteristica</th>
                  {plans.map(p => (
                    <th scope="col" key={p.id} className={`py-3 px-4 font-semibold text-center ${p.popular ? 'bg-orange-600' : ''}`}>
                      {p.name}
                      <div className="font-normal text-xs opacity-80 mt-0.5">${p.price.toLocaleString('es-AR')}/mes</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planComparisonRows.map((row, i) => (
                  <tr key={row.key} className={i % 2 ? 'bg-surface-50' : 'bg-white'}>
                    <td className="py-3 px-4 font-semibold text-surface-700">{row.label}</td>
                    {plans.map(p => (
                      <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50 font-medium text-surface-800' : 'text-surface-600'}`}>
                        {p[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Boolean rows */}
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Multi-cuenta</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      {p.multiAccount ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-surface-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface-50">
                  <td className="py-3 px-4 font-semibold text-surface-700">Integracion CRM</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      {p.crmIntegration ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-surface-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Reporting semanal</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      {p.weeklyReporting ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-surface-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface-50">
                  <td className="py-3 px-4 font-semibold text-surface-700">Ajuste mensual de estrategia</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      {p.monthlyAdjust ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-surface-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Anti-spam integrado</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface-50">
                  <td className="py-3 px-4 font-semibold text-surface-700">Desuscripcion automatica</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Google Sheets en tiempo real</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-orange-50/50' : ''}`}>
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-red-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Empeza a prospectar con IA
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Elegi un plan o consultanos por WhatsApp. Respuesta en menos de 24 horas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#planes">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-orange-600 hover:bg-white/90 font-bold text-base px-8">
                Ver planes <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                Contactar por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
