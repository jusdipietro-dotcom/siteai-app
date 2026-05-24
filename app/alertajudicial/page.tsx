'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  RefreshCw,
  BellRing,
  Building2,
  Zap,
  PlugZap,
  Mail,
  ShieldCheck,
  Clock,
  X,
  Loader2,
} from 'lucide-react'

const API_BASE = (
  process.env.NEXT_PUBLIC_AJ_API_BASE ?? 'https://api.automaticialab.com'
).replace(/\/$/, '')

type PlanId = 'basico' | 'profesional' | 'estudio'

interface Plan {
  id: PlanId
  name: string
  price: number
  tagline: string
  featured?: boolean
  badge?: string
  features: string[]
  ctaLabel: string
}

const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Basico',
    price: 15000,
    tagline: '1 CUIT, 1 portal',
    features: [
      '1 CUIL/CUIT monitoreado',
      '1 portal (PJN o SCBA)',
      '6 revisiones diarias (cada 2hs)',
      'Email a 1 destinatario',
      'Soporte por email',
    ],
    ctaLabel: 'Elegir Basico',
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 35000,
    tagline: 'Hasta 5 CUIT, ambos portales',
    featured: true,
    badge: 'Mas elegido',
    features: [
      'Hasta 5 CUIL/CUIT monitoreados',
      'PJN + SCBA (ambos portales)',
      '6 revisiones diarias + webhook manual',
      'Email a hasta 3 destinatarios',
      'Horarios personalizables',
      'Soporte prioritario (< 4hs)',
    ],
    ctaLabel: 'Elegir Profesional',
  },
  {
    id: 'estudio',
    name: 'Estudio',
    price: 75000,
    tagline: 'CUIT ilimitados + IA',
    features: [
      'CUIL/CUIT ilimitados',
      'Todos los portales disponibles',
      'Revisiones cada 2 horas',
      'Destinatarios ilimitados',
      'API REST para integracion',
      'Soporte dedicado + onboarding',
      'Resumen IA (proximamente)',
    ],
    ctaLabel: 'Elegir Estudio',
  },
]

const FEATURES = [
  {
    icon: FileText,
    title: 'Texto completo del proveido',
    desc: 'No solo una alerta. Recibis el contenido integro del proveido o notificacion, extraido automaticamente del PDF directo en tu casilla.',
  },
  {
    icon: RefreshCw,
    title: '6 revisiones diarias',
    desc: 'El sistema revisa los portales cada 2 horas, de 08:15 a 18:15. Horarios personalizables segun tu necesidad.',
  },
  {
    icon: BellRing,
    title: 'Deduplicacion inteligente',
    desc: 'Nunca recibis la misma notificacion dos veces. El sistema recuerda lo que ya te envio durante 30 dias.',
  },
  {
    icon: Building2,
    title: 'Multi-portal PJN + SCBA',
    desc: 'Poder Judicial de la Nacion y SCBA disponibles ahora. Mas portales provinciales en desarrollo constante.',
  },
  {
    icon: Zap,
    title: 'Webhook manual',
    desc: 'Necesitas una revision ahora? Un click y el sistema ejecuta una revision inmediata fuera de horario.',
  },
  {
    icon: PlugZap,
    title: 'API REST (plan Estudio)',
    desc: 'Integra AlertaJudicial con tu sistema de gestion de estudio, CRM o cualquier herramienta interna.',
  },
]

const HOW_STEPS = [
  {
    num: '01',
    title: 'Contratas tu plan',
    desc: 'Elegi el plan que se ajuste a tu practica. Desde un CUIL hasta ilimitados.',
  },
  {
    num: '02',
    title: 'Nos das tus credenciales',
    desc: 'CUIL y contrasena de los portales. Las almacenamos encriptadas en servidores propios.',
  },
  {
    num: '03',
    title: 'Configuramos todo',
    desc: 'En menos de 24 horas activamos tu monitoreo y enviamos un email de prueba.',
  },
  {
    num: '04',
    title: 'Recibis tus alertas',
    desc: 'Cada novedad llega a tu casilla con el texto completo. Leelo desde el celular.',
  },
]

const FAQS = [
  {
    q: 'Es legal automatizar el acceso a portales judiciales?',
    a: 'Si. El sistema accede con tus credenciales legitimas, de la misma forma que lo harias vos manualmente. No se vulnera ningun sistema ni se accede a informacion de terceros.',
  },
  {
    q: 'Mis credenciales estan seguras?',
    a: 'Las credenciales se almacenan encriptadas en servidores propios. No usamos servicios de terceros para almacenarlas. El acceso es exclusivamente interno y automatizado.',
  },
  {
    q: 'Que pasa si el portal cambia su interfaz?',
    a: 'Nuestro equipo tecnico monitorea los portales permanentemente. Cuando hay cambios, actualizamos los conectores generalmente en menos de 24 horas sin costo adicional.',
  },
  {
    q: 'Funciona con cualquier causa?',
    a: 'Funciona con todas las causas visibles en el portal asociado a tu CUIL/CUIT. Si la causa aparece cuando entras al portal, AlertaJudicial la detecta.',
  },
  {
    q: 'Puedo cancelar en cualquier momento?',
    a: 'Si. No hay contratos de permanencia ni clausulas de salida. La cancelacion es efectiva al final del periodo facturado.',
  },
  {
    q: 'Como funciona el trial?',
    a: 'Los primeros 60 dias son gratis. Necesitas dejar tarjeta para activarte pero no se cobra hasta el dia 61. Si cancelas antes, no pagas nada.',
  },
  {
    q: 'Puedo recibir alertas por WhatsApp?',
    a: 'Estamos desarrollando esta funcionalidad. Se espera para el segundo trimestre de 2026. Mientras tanto, el email funciona en cualquier celular.',
  },
]

interface FormState {
  name: string
  email: string
  cuit: string
}

const EMPTY_FORM: FormState = { name: '', email: '', cuit: '' }

export default function AlertaJudicialLanding() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modalOpen = selectedPlan !== null

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  function openModal(plan: Plan) {
    setSelectedPlan(plan)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function closeModal() {
    if (loading) return
    setSelectedPlan(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedPlan) return

    setError(null)

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const cuit = form.cuit.replace(/[^\d]/g, '')

    if (name.length < 2) {
      setError('Ingresa nombre y apellido.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalido.')
      return
    }
    if (!/^\d{10,11}$/.test(cuit)) {
      setError('CUIT/CUIL invalido. Debe tener 10 u 11 digitos.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan.id, name, email, cuit }),
      })

      if (!res.ok) {
        const errBody = await res
          .json()
          .catch(() => ({ detail: `Error HTTP ${res.status}` }))
        throw new Error(errBody.detail || `Error HTTP ${res.status}`)
      }

      const data = (await res.json()) as { init_point?: string }
      if (!data.init_point) {
        throw new Error('La pasarela no devolvio el link de pago.')
      }
      window.location.href = data.init_point
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error de red inesperado.'
      setError(
        `No pudimos iniciar el pago: ${message}. Escribinos a contacto@automaticialab.com si persiste.`,
      )
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-mono font-semibold mb-6 uppercase tracking-wider"
              >
                <BellRing className="w-3.5 h-3.5" /> Monitoreo judicial automatizado
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              >
                Cada proveido,
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-violet-200 bg-clip-text text-transparent">
                  directo a tu email.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-white/90 mb-8 leading-relaxed"
              >
                AlertaJudicial vigila los portales judiciales argentinos (PJN y
                SCBA) por vos y te envia el texto completo de cada notificacion.
                Sin entrar a ningun portal. Sin perder ningun plazo.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-10"
              >
                <a href="#planes">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-bold text-base px-8"
                  >
                    Ver planes <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <a href="#como-funciona">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium"
                  >
                    Como funciona <ChevronDown className="w-4 h-4" />
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-6 max-w-md"
              >
                {[
                  { v: '6x', l: 'revisiones diarias' },
                  { v: '100%', l: 'texto del documento' },
                  { v: '24hs', l: 'setup completo' },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="text-3xl font-extrabold text-cyan-200">
                      {s.v}
                    </p>
                    <p className="text-xs text-white/70 mt-1">{s.l}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Email mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="bg-surface-900/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-mono text-white/50 ml-3">
                    Gmail · PJN · 3 entradas nuevas
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-center mb-5">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                      Poder Judicial de la Nacion
                    </p>
                    <p className="text-lg font-bold text-white">
                      Entradas Nuevas
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      24/05/2026, 10:19 hs
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-lg border-l-4 border-violet-500 overflow-hidden mb-3">
                    <div className="px-4 py-2 bg-violet-500/10">
                      <span className="text-[10px] font-mono text-violet-300 uppercase tracking-wider">
                        Despacho · #1
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-white">
                        COM 19121/2021
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        GARBARINO S.A. s/QUIEBRA · 17 mar
                      </p>
                      <div className="mt-3 bg-white/5 rounded p-3 text-xs text-white/70 leading-relaxed">
                        Buenos Aires, 17 de marzo de 2026
                        <br />
                        A fin de proveer lo que corresponda, agreguese a los
                        autos de extension de quiebra cuya formacion fuera
                        ordenada con fecha 12 de marzo de 2026...
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg border-l-4 border-cyan-400 opacity-50 px-4 py-3">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">
                      Notificacion · #2
                    </span>
                    <p className="text-sm font-bold text-white mt-1">
                      CIV 27925/2021
                    </p>
                    <p className="text-xs text-white/60">
                      LOPEZ c/ MARTINEZ s/DANOS · 17 mar
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────── PROBLEMA / SOLUCION ───────────────── */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              El problema
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Perder un plazo no es una opcion.
              <br />
              <span className="italic text-violet-700">
                Tampoco perder tiempo.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border-2 border-danger-100 p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-danger-50 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6 text-danger-600" />
              </div>
              <h3 className="text-xl font-bold text-danger-700 mb-4">
                Sin AlertaJudicial
              </h3>
              <ul className="space-y-3">
                {[
                  'Entrar manualmente a cada portal varias veces al dia',
                  'Recordar verificar cada causa individualmente',
                  'Riesgo de perder un plazo por olvido o distraccion',
                  '30-60 minutos diarios en tareas repetitivas',
                  'Dependencia de la memoria o de un empleado',
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 text-sm text-surface-600"
                  >
                    <X className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl border-2 border-violet-200 p-8 shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-violet-700" />
              </div>
              <h3 className="text-xl font-bold text-violet-700 mb-4">
                Con AlertaJudicial
              </h3>
              <ul className="space-y-3">
                {[
                  'Monitoreo automatico 6 veces al dia (cada 2 horas)',
                  'Texto completo del proveido directo en tu casilla',
                  'Cero posibilidad de perder una notificacion',
                  'Ahorro de 30-60 min diarios de trabajo manual',
                  'Funciona solo, sin intervencion humana',
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 text-sm text-surface-600"
                  >
                    <Check className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────── FEATURES ───────────────── */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              Funcionalidades
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Todo lo que necesitas,{' '}
              <span className="italic text-violet-700">nada que no.</span>
            </h2>
            <p className="text-surface-500">
              Disenado especificamente para la practica judicial argentina. Sin
              funciones innecesarias, sin complejidad.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-6 border border-surface-100 hover:border-violet-200 hover:shadow-lg transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2 text-lg">
                    {f.title}
                  </h3>
                  <p className="text-sm text-surface-500 leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── COMO FUNCIONA ───────────────── */}
      <section id="como-funciona" className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Activalo en{' '}
              <span className="italic text-violet-700">24 horas</span>
            </h2>
            <p className="text-surface-500">
              Sin instalar nada. Sin aprender un sistema nuevo. Es un email.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-surface-100 text-center"
              >
                <p className="text-5xl font-extrabold text-violet-100 mb-3 leading-none">
                  {s.num}
                </p>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── PRICING ───────────────── */}
      <section id="planes" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              Precios
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Simple. <span className="italic text-violet-700">Sin sorpresas.</span>
            </h2>
            <p className="text-surface-500">
              Sin contratos de permanencia. Cancela cuando quieras. Primeros 60
              dias gratis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-3xl p-8 flex flex-col ${
                  p.featured
                    ? 'border-2 border-violet-600 shadow-2xl shadow-violet-200 lg:scale-105 z-10'
                    : 'border border-surface-200 hover:border-violet-300 hover:shadow-lg transition-all'
                }`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-mono font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
                    {p.badge}
                  </div>
                )}

                <p className="text-xs font-mono font-semibold text-surface-500 uppercase tracking-widest mb-2">
                  {p.name}
                </p>
                <p className="text-4xl font-extrabold text-surface-900 mb-1">
                  ${p.price.toLocaleString('es-AR')}{' '}
                  <span className="text-base font-normal text-surface-400">
                    ARS
                  </span>
                </p>
                <p className="text-sm text-surface-500 mb-1">por mes</p>
                <p className="text-sm text-violet-700 font-medium mb-6">
                  {p.tagline}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-3 text-sm text-surface-600"
                    >
                      <Check className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => openModal(p)}
                  className={`w-full gap-2 font-semibold ${
                    p.featured
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95'
                      : 'bg-surface-900 text-white hover:bg-surface-800'
                  }`}
                >
                  {p.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-surface-500 mt-8 font-mono">
            Primeros 60 dias gratis · Tarjeta requerida (sin cargo hasta dia 61)
            · Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* ───────────────── TESTIMONIOS ───────────────── */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              Testimonios
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Lo que dicen{' '}
              <span className="italic text-violet-700">los abogados</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stars: 5,
                text: 'Antes perdia media hora cada manana revisando el portal del PJN. Ahora abro el email en el subte y ya se todo lo que paso en mis causas.',
                initials: 'MG',
                name: 'Dra. Mariana Gonzalez',
                role: 'Abogada civil y comercial, CABA',
              },
              {
                stars: 5,
                text: 'Desde que implementamos AlertaJudicial en el estudio, ningun plazo se nos escapo. La tranquilidad que da no tiene precio.',
                initials: 'RL',
                name: 'Dr. Roberto Lopez',
                role: 'Socio, Estudio Lopez & Asociados',
              },
              {
                stars: 5,
                text: 'Lo mejor es que recibis el texto completo del proveido, no solo un aviso generico. Es como tener un pasante que no se distrae nunca.',
                initials: 'CF',
                name: 'Dra. Carolina Fernandez',
                role: 'Abogada laboral, Mar del Plata',
              },
            ].map((t, i) => (
              <motion.div
                key={t.initials}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 border border-surface-100"
              >
                <p className="text-amber-500 tracking-widest mb-4">
                  {'★'.repeat(t.stars)}
                </p>
                <p className="text-sm italic text-surface-600 leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900 text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-surface-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-violet-700 font-semibold text-sm uppercase tracking-wider mb-3">
              Preguntas frecuentes
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Tenes <span className="italic text-violet-700">dudas?</span>
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="bg-surface-50 rounded-xl p-5 border border-surface-100 group"
              >
                <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between gap-2 list-none">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-surface-400 group-open:rotate-180 transition-transform shrink-0" />
                </summary>
                <p className="text-sm text-surface-500 leading-relaxed mt-3">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── CTA FINAL ───────────────── */}
      <section
        id="contacto"
        className="py-20 bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 text-white text-center"
      >
        <div className="max-w-2xl mx-auto px-4">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            No pierdas otro plazo.
            <br />
            <span className="italic text-cyan-200">Empeza hoy.</span>
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Suscribite online en minutos. 60 dias gratis para probar. Sin
            compromiso de permanencia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#planes">
              <Button
                variant="secondary"
                size="lg"
                className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-bold text-base px-8"
              >
                Ver planes <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="mailto:contacto@automaticialab.com?subject=Consulta%20AlertaJudicial"
              className="inline-block"
            >
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium"
              >
                <Mail className="w-4 h-4" /> Hablar por email
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* ───────────────── MODAL ───────────────── */}
      {modalOpen && selectedPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="aj-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={closeModal}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-surface-200"
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-700 transition-colors disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3
              id="aj-modal-title"
              className="text-2xl font-extrabold text-surface-900 mb-1"
            >
              Suscribite al Plan {selectedPlan.name}
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Te vamos a redirigir a MercadoPago para completar el pago. Sin
              cargo durante los primeros 60 dias.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block text-sm">
                <span className="text-surface-700 font-medium">
                  Nombre y apellido
                </span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                  minLength={2}
                  autoComplete="name"
                  disabled={loading}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-surface-900 disabled:opacity-50"
                />
              </label>

              <label className="block text-sm">
                <span className="text-surface-700 font-medium">
                  Email (donde se envian las alertas)
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-surface-900 disabled:opacity-50"
                />
              </label>

              <label className="block text-sm">
                <span className="text-surface-700 font-medium">
                  CUIT / CUIL
                </span>
                <input
                  type="text"
                  name="cuit"
                  value={form.cuit}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, cuit: e.target.value }))
                  }
                  required
                  inputMode="numeric"
                  placeholder="20-12345678-9"
                  disabled={loading}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-surface-900 disabled:opacity-50"
                />
              </label>

              <div className="flex items-center justify-between bg-surface-50 rounded-lg px-4 py-3 text-sm border border-surface-100">
                <span className="text-surface-500">Plan elegido:</span>
                <span className="font-bold text-surface-900">
                  {selectedPlan.name}
                </span>
                <span className="font-mono text-violet-700 font-semibold">
                  ${selectedPlan.price.toLocaleString('es-AR')}/mes
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Ir a pagar en MercadoPago
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-danger-600 bg-danger-50 border border-danger-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <p className="text-xs text-surface-400 text-center font-mono">
                Pago seguro · Cancela cuando quieras
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  )
}
