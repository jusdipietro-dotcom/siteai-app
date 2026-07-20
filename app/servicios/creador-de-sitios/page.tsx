'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { WEBSITE_PLANS_LIST } from '@/lib/website-plans'
import {
  ArrowRight, Check, Sparkles, Globe, Shield, Wand2,
  Pencil, Smartphone, MessageCircle, ChevronDown, Eye, CreditCard,
} from 'lucide-react'

const WA_LINK = 'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20el%20creador%20de%20sitios%20web'

const features = [
  {
    icon: Wand2,
    title: 'La IA escribe el contenido',
    desc: 'Contas de que es tu negocio y la IA redacta los textos, arma las secciones y elige una paleta acorde a tu rubro.',
  },
  {
    icon: Pencil,
    title: 'Editor visual',
    desc: 'Cambias textos, colores, imagenes y secciones desde el navegador. Sin codigo y con ediciones ilimitadas.',
  },
  {
    icon: Eye,
    title: 'Vista previa completa y gratuita',
    desc: 'Ves el sitio terminado antes de decidir. No pedimos tarjeta para armarlo ni para previsualizarlo.',
  },
  {
    icon: Globe,
    title: 'Subdominio propio',
    desc: 'Tu sitio queda publicado en tunegocio.sitios.automaticialab.com, listo para compartir.',
  },
  {
    icon: Shield,
    title: 'SSL y hosting incluidos',
    desc: 'Certificado HTTPS y alojamiento incluidos en la suscripcion. No contratas nada por separado.',
  },
  {
    icon: Smartphone,
    title: 'Responsive y con WhatsApp',
    desc: 'Se ve bien en celular, tablet y escritorio, con boton de WhatsApp integrado para recibir consultas.',
  },
]

const steps = [
  { num: '1', title: 'Contanos de tu negocio', desc: 'Un asistente te hace las preguntas basicas: rubro, servicios, contacto y estilo.', free: true },
  { num: '2', title: 'La IA genera tu sitio', desc: 'Textos, secciones y diseno listos en minutos. Podes regenerar lo que no te guste.', free: true },
  { num: '3', title: 'Editalo y previsualizalo', desc: 'Ajustas todo en el editor visual y ves el resultado final completo.', free: true },
  { num: '4', title: 'Publicalo', desc: 'Elegis tu subdominio y activas la suscripcion. Recien aca se paga.', free: false },
]

const faqs = [
  {
    q: 'Que es gratis exactamente?',
    a: 'Crear la cuenta, armar el sitio con el asistente, editarlo y verlo completo en vista previa. No se pide tarjeta en ningun momento de ese proceso. La suscripcion se activa solo cuando decidis publicar el sitio para que sea accesible al publico.',
  },
  {
    q: 'Que pasa si armo el sitio y no me convence?',
    a: 'No pagas nada. El proyecto queda guardado en tu cuenta en vista previa y podes seguir editandolo o descartarlo cuando quieras.',
  },
  {
    q: 'Que direccion web tiene mi sitio?',
    a: 'Un subdominio propio del tipo tunegocio.sitios.automaticialab.com, que elegis vos al publicar. La conexion de dominios propios (tunegocio.com) todavia no esta disponible.',
  },
  {
    q: 'Necesito saber programar o disenar?',
    a: 'No. El asistente te guia con preguntas simples y la IA se encarga del contenido y del diseno. Despues ajustas lo que quieras desde el editor visual.',
  },
  {
    q: 'Puedo editar el sitio despues de publicarlo?',
    a: 'Si. Las ediciones son ilimitadas en ambos planes. Cambias lo que necesites y volves a publicar.',
  },
  {
    q: 'Cual es la diferencia con el servicio de diseno web?',
    a: 'Este producto es autogestionado: lo armas vos con IA sobre una base de plantillas, en el dia y a precio fijo. El servicio de diseno web es a medida: lo disenamos y programamos nosotros en Next.js, sin plantillas y cotizado segun tu caso.',
  },
]

export default function CreadorDeSitiosServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" /> Autogestionado
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Crea tu sitio web<br />vos mismo, con IA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-4 max-w-xl leading-relaxed"
            >
              Contestas unas preguntas y la IA arma tu sitio completo. Lo editas, lo ves terminado y
              decidis despues.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="inline-flex items-center gap-2 text-base font-semibold bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl mb-8"
            >
              <Check className="w-4 h-4" />
              Armarlo y verlo es gratis. Pagas solo cuando lo publicas.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/register?next=creador-de-sitios">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-violet-600 hover:bg-white/90 font-bold text-base px-8">
                  Empezar gratis <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#planes">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Ver precios <ChevronDown className="w-4 h-4" />
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
            { num: '$0', label: 'para armarlo y verlo' },
            { num: 'Minutos', label: 'no semanas' },
            { num: 'ARS', label: 'pagas en pesos' },
            { num: 'SSL', label: 'incluido al publicar' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-violet-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free vs paid */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Sin sorpresas</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Que es gratis y que se paga
            </h2>
            <p className="text-surface-500">
              Preferimos decirtelo antes de que inviertas tiempo, no en la pantalla de pago.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-surface-900 mb-3">Gratis, sin tarjeta</h3>
              <ul className="space-y-2">
                {[
                  'Crear tu cuenta',
                  'Armar el sitio con el asistente y la IA',
                  'Editar textos, colores, imagenes y secciones',
                  'Ver el sitio terminado en vista previa',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-violet-50 rounded-2xl p-6 border border-violet-100"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-surface-900 mb-3">Con suscripcion</h3>
              <ul className="space-y-2">
                {[
                  'Publicar el sitio para que sea accesible',
                  'Subdominio propio (tunegocio.sitios.automaticialab.com)',
                  'Certificado SSL y hosting',
                  'Seguir editando y republicando sin limite',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                    <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Que incluye</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Todo lo que necesita un sitio de negocio
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
                  className="bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-card transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
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
      <section id="como-funciona" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Como funciona
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
                <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 mb-3">{s.desc}</p>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${s.free ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                  {s.free ? 'Gratis' : 'Con suscripcion'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planes" className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Planes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Precios de publicacion
            </h2>
            <p className="text-surface-500">
              Solo entran en juego cuando publicas. Armar el sitio y verlo terminado no cuesta nada.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {WEBSITE_PLANS_LIST.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border ${p.popular ? 'border-violet-300 shadow-lg ring-2 ring-violet-500/20' : 'border-surface-100'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mas elegido
                  </div>
                )}
                <h3 className="text-xl font-bold text-surface-900 mb-1">{p.name}</h3>
                <p className="text-sm text-surface-400 mb-4">{p.description}</p>
                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-surface-900">${p.monthly.toLocaleString('es-AR')}</span>
                  <span className="text-surface-400 text-sm">/mes</span>
                </div>
                <p className="text-xs text-surface-400 mb-6">
                  o ${p.annual.toLocaleString('es-AR')}/mes con facturacion anual
                </p>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                      <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?next=creador-de-sitios&plan=${p.id}`}>
                  <Button
                    variant={p.popular ? 'gradient' : 'outline'}
                    className={`w-full gap-2 ${p.popular ? '' : 'border-violet-200 text-violet-600 hover:bg-violet-50'}`}
                  >
                    Empezar gratis <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-surface-400 mt-6">
            Precios en pesos argentinos. Suscripcion mensual por MercadoPago, cancelable cuando quieras.
          </p>
        </div>
      </section>

      {/* Self-service vs bespoke */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Cual me conviene</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Lo hacer vos o lo hacemos nosotros
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-violet-50 rounded-2xl p-6 border border-violet-100">
              <h3 className="font-bold text-surface-900 mb-2">Lo armas vos (esta pagina)</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                Autogestionado, sobre una base de plantillas y con IA. Listo el mismo dia, a precio
                fijo y publicado en un subdominio. Ideal si necesitas presencia online rapido y
                sencilla.
              </p>
              <Link href="/register?next=creador-de-sitios">
                <Button variant="gradient" className="w-full gap-2">
                  Empezar gratis <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-surface-50 rounded-2xl p-6 border border-surface-100">
              <h3 className="font-bold text-surface-900 mb-2">Lo hacemos nosotros</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                Diseno y desarrollo a medida en Next.js, sin plantillas, con dominio propio e
                integraciones especificas. Se cotiza segun tu caso. Ideal si necesitas algo unico o
                funcionalidad que no entra en una plantilla.
              </p>
              <Link href="/servicios/diseno-web">
                <Button variant="outline" className="w-full gap-2">
                  Ver diseno web a medida <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Proba armar tu sitio ahora
          </h2>
          <p className="text-white/80 text-lg mb-8">
            No pedimos tarjeta. Si el resultado no te convence, no pagas nada.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?next=creador-de-sitios">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-violet-600 hover:bg-white/90 font-bold text-base px-8">
                Empezar gratis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                <MessageCircle className="w-4 h-4" />
                Consultar por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
