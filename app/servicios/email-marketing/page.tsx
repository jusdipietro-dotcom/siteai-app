'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Check, Send, Shield, Clock, UserCheck, MailX,
  BarChart3, Zap, Mail, X, ChevronDown
} from 'lucide-react'

const WA_LINK = 'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20email%20marketing%20automatizado'

const plans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 15000,
    popular: false,
    desc: 'Para emprendedores y negocios que arrancan',
    campaigns: '1',
    contacts: '5.000',
    emailsDay: '360',
    senders: '1',
    senderType: 'Gmail gratuito',
    templates: 'Estandar con tu marca',
    support: 'Email',
    onboarding: false,
    features: [
      '1 campana activa',
      'Hasta 5.000 contactos',
      '360 envios por dia',
      'Gmail gratuito como remitente',
      'Template profesional con tu marca',
      'Anti-spam + desuscripcion automatica',
      'Seguimiento en Google Sheets',
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 25000,
    popular: true,
    desc: 'Para negocios en crecimiento',
    campaigns: '3',
    contacts: '20.000',
    emailsDay: '1.440',
    senders: '3',
    senderType: 'Gmail + Workspace',
    templates: 'Personalizados por campana',
    support: 'Prioritario',
    onboarding: false,
    features: [
      'Hasta 3 campanas activas',
      'Hasta 20.000 contactos',
      '1.440 envios por dia',
      'Hasta 3 remitentes distintos',
      'Google Workspace (mas envios/dia)',
      'Templates personalizados por campana',
      'Anti-spam + desuscripcion automatica',
      'Reportes y soporte prioritario',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 45000,
    popular: false,
    desc: 'Para agencias y multiples marcas',
    campaigns: 'Ilimitadas',
    contacts: '100.000',
    emailsDay: '1.440',
    senders: 'Ilimitados',
    senderType: 'Cualquier email',
    templates: 'A medida por marca',
    support: 'Dedicado',
    onboarding: true,
    features: [
      'Campanas ilimitadas',
      'Hasta 100.000 contactos',
      '1.440 envios por dia',
      'Remitentes ilimitados',
      'Cualquier tipo de email',
      'Templates a medida por marca',
      'Soporte prioritario dedicado',
      'Onboarding asistido completo',
    ],
  },
]

const planComparisonRows = [
  { label: 'Campanas activas',     key: 'campaigns' as const },
  { label: 'Contactos por campana', key: 'contacts' as const },
  { label: 'Envios por dia',       key: 'emailsDay' as const },
  { label: 'Remitentes distintos',  key: 'senders' as const },
  { label: 'Tipo de remitente',     key: 'senderType' as const },
  { label: 'Templates',             key: 'templates' as const },
  { label: 'Soporte',               key: 'support' as const },
]

const features = [
  {
    icon: Send,
    title: 'Envío 100% automático',
    desc: 'El sistema envía emails uno por uno, a ritmo controlado, las 24 horas. No tenés que hacer nada.',
  },
  {
    icon: UserCheck,
    title: 'Personalizado por nombre',
    desc: 'Cada email saluda al contacto por su nombre. Mejor tasa de apertura, menos spam.',
  },
  {
    icon: Shield,
    title: 'Anti-spam integrado',
    desc: 'Ritmo controlado, subject optimizado, template profesional y link de desuscripción en cada email.',
  },
  {
    icon: BarChart3,
    title: 'Seguimiento en tiempo real',
    desc: 'Planilla de Google Sheets que se actualiza automáticamente con cada envío.',
  },
  {
    icon: MailX,
    title: 'Desuscripción automática',
    desc: 'Cada email incluye un link para desuscribirse. Se excluyen automáticamente de futuros envíos.',
  },
  {
    icon: Zap,
    title: 'Diseño profesional',
    desc: 'Email HTML con tu marca, colores, imagen y botón de acción. Compatible con Gmail, Outlook y celulares.',
  },
]

const steps = [
  { num: '1', title: 'Envianos tus contactos', desc: 'Un Excel, CSV o planilla de Google con nombre y email de tus clientes.' },
  { num: '2', title: 'Diseñamos tu email', desc: 'Creamos un email profesional con tu marca, colores y contenido.' },
  { num: '3', title: 'Activamos el sistema', desc: 'Lo configuramos y empieza a enviar automáticamente.' },
  { num: '4', title: 'Seguí el progreso', desc: 'Ves en tiempo real cuántos emails se enviaron en una planilla compartida.' },
]

const comparison = [
  { feature: 'Costo mensual', mailchimp: '$13-350 USD', brevo: '$9-65 USD', ours: 'Desde $15.000 ARS' },
  { feature: 'Moneda', mailchimp: 'Dólares', brevo: 'Dólares', ours: 'Pesos AR' },
  { feature: 'Contactos ilimitados', mailchimp: 'No', brevo: 'No', ours: 'Sí' },
  { feature: 'Personalización', mailchimp: 'Sí', brevo: 'Sí', ours: 'Sí' },
  { feature: 'Template a medida', mailchimp: 'Genéricos', brevo: 'Genéricos', ours: 'Diseñado para vos' },
  { feature: 'Desuscripción', mailchimp: 'Sí', brevo: 'Sí', ours: 'Sí' },
  { feature: 'Complejidad', mailchimp: 'Alta', brevo: 'Media', ours: 'Mínima' },
  { feature: '¿Lo configurás vos?', mailchimp: 'Sí', brevo: 'Sí', ours: 'Lo hacemos nosotros' },
]

const faqs = [
  { q: '¿Los emails caen en spam?', a: 'No. El sistema usa técnicas anti-spam profesionales: envío a ritmo controlado, personalización por nombre, templates optimizados y link de desuscripción en cada email.' },
  { q: '¿Cuántos emails por día puedo enviar?', a: 'Con Gmail gratuito: hasta 360 por día. Con Google Workspace: hasta 1.440 por día.' },
  { q: '¿Puedo cambiar el contenido del email?', a: 'Sí. Podemos actualizar el diseño, texto, imágenes y links cuando lo necesites.' },
  { q: '¿Necesito saber de tecnología?', a: 'No. Nosotros configuramos todo. Vos solo nos pasás los contactos y el contenido, y seguís el progreso en una planilla de Google.' },
  { q: '¿Cuánto tarda en enviar a todos mis contactos?', a: '1.000 contactos ≈ 3 días. 5.000 ≈ 14 días. 10.000 ≈ 28 días (Gmail gratuito). Con Workspace es 4x más rápido.' },
  { q: '¿Es legal?', a: 'Sí, siempre que tus contactos hayan dado consentimiento. Cada email incluye opción de desuscripción, como exige la ley.' },
]

const useCases = [
  { emoji: '🛍️', title: 'Tiendas online', desc: 'Promos, cupones, lanzamientos. Conectá con clientes de Tiendanube, Shopify o WooCommerce.' },
  { emoji: '⚖️', title: 'Servicios profesionales', desc: 'Newsletters, recordatorios, novedades del estudio o consultora.' },
  { emoji: '🍕', title: 'Gastronomía', desc: 'Menú del día, promos de la semana, cupones de delivery.' },
  { emoji: '🏠', title: 'Inmobiliarias', desc: 'Nuevas propiedades, alertas de precio, reportes del mercado.' },
]

export default function EmailMarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-rose-600 to-red-500 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Mail className="w-4 h-4" /> Nuevo servicio
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Email Marketing<br />Automatizado
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed"
            >
              Enviá emails promocionales personalizados a todos tus contactos. Sin Mailchimp. Sin dólares. Sin complicarte.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#planes">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-rose-600 hover:bg-white/90 font-bold text-base px-8">
                  Ver planes y precios <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#como-funciona">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Cómo funciona <ChevronDown className="w-4 h-4" />
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
            { num: '360', label: 'emails/día' },
            { num: '100%', label: 'automático' },
            { num: 'ARS', label: 'pagás en pesos' },
            { num: '24hs', label: 'implementación' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-rose-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Qué incluye</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Todo lo que necesitás para hacer email marketing profesional
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-4">
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
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Cómo funciona
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Comparación</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Compará y ahorrá
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-surface-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-900 text-white">
                  <th scope="col" className="text-left py-3 px-4 font-semibold">Característica</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Mailchimp</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Brevo</th>
                  <th scope="col" className="py-3 px-4 font-semibold bg-rose-600">Automatic IA Lab</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={i % 2 ? 'bg-surface-50' : 'bg-white'}>
                    <td className="py-3 px-4 font-semibold text-surface-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-surface-500">{row.mailchimp}</td>
                    <td className="py-3 px-4 text-center text-surface-500">{row.brevo}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600 bg-rose-50">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Casos de uso</p>
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
                className="bg-white rounded-2xl p-6 border border-surface-100 text-center"
              >
                <div className="text-3xl mb-3">{uc.emoji}</div>
                <h3 className="font-bold text-surface-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-surface-500">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Caso de éxito</p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface-50 rounded-2xl p-8 border border-surface-100"
          >
            <p className="text-lg text-surface-700 italic mb-4 leading-relaxed">
              &ldquo;Teníamos 7.600 contactos de nuestra tienda online y no sabíamos cómo llegar a todos. Con este sistema se envían solos, llegan a la bandeja de entrada y podemos ver el progreso en tiempo real.&rdquo;
            </p>
            <p className="font-bold text-rose-600">Moia Curves</p>
            <p className="text-sm text-surface-400">E-commerce de indumentaria</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
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
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Planes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Elegi el plan que se adapte a tu negocio
            </h2>
            <p className="text-surface-500">Todos los planes incluyen anti-spam, desuscripcion automatica y seguimiento en tiempo real.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border ${p.popular ? 'border-rose-300 shadow-lg ring-2 ring-rose-500/20' : 'border-surface-100'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full">
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
                      <Check className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?next=email-marketing&plan=${p.id}`}>
                  <Button
                    variant={p.popular ? 'gradient' : 'outline'}
                    className={`w-full gap-2 ${p.popular ? '' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}
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
            <p className="text-rose-600 font-semibold text-sm uppercase tracking-wider mb-3">Detalle</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Compara los planes en detalle
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-surface-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-900 text-white">
                  <th scope="col" className="text-left py-3 px-4 font-semibold">Característica</th>
                  {plans.map(p => (
                    <th scope="col" key={p.id} className={`py-3 px-4 font-semibold text-center ${p.popular ? 'bg-rose-600' : ''}`}>
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
                      <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-rose-50/50 font-medium text-surface-800' : 'text-surface-600'}`}>
                        {p[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Boolean rows */}
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Onboarding asistido</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-rose-50/50' : ''}`}>
                      {p.onboarding ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-surface-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface-50">
                  <td className="py-3 px-4 font-semibold text-surface-700">Anti-spam integrado</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-rose-50/50' : ''}`}>
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 font-semibold text-surface-700">Desuscripcion automatica</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-rose-50/50' : ''}`}>
                      <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="bg-surface-50">
                  <td className="py-3 px-4 font-semibold text-surface-700">Seguimiento en Sheets</td>
                  {plans.map(p => (
                    <td key={p.id} className={`py-3 px-4 text-center ${p.popular ? 'bg-rose-50/50' : ''}`}>
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
      <section className="py-20 bg-gradient-to-br from-rose-600 to-pink-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Empezá a llegar a todos tus clientes
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Elegí un plan o consultanos por WhatsApp. Respuesta en menos de 24 horas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#planes">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-rose-600 hover:bg-white/90 font-bold text-base px-8">
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
