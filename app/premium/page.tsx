'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import {
  ArrowRight, Check, Crown, Newspaper, Sparkles, ShoppingBag, Scale,
  ChevronDown, Headphones, Calendar, Settings, Zap,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20una%20implementacion%20premium'

const products = [
  {
    id: 'canal-noticias',
    icon: Newspaper,
    name: 'Canal de Noticias multi-agente',
    tagline: 'Sistema completo de publicacion automatica en Instagram + WhatsApp',
    desc: 'Pipeline real con 3 fuentes RSS, agente investigador, agente redactor, generacion de imagen con IA, publicacion automatica en Instagram y envio a canal de WhatsApp. Misma tecnologia que opera @puntoreporte (Zona Sur, BA).',
    priceFrom: 1200000,
    duration: '15-25 dias',
    gradient: 'from-violet-600 to-purple-700',
    accent: 'text-violet-700',
    features: [
      '4 workflows n8n a medida (publicacion + estados + monitoreo)',
      'Cuenta Instagram dedicada + sesion persistente',
      'Pipeline AI: investigador → redactor → imagen → publicacion',
      'Anti-ban: cooldown 3h + cap diario + horarios protegidos',
      'WhatsApp Evolution API integrada',
      'Dashboard de control + logs en tiempo real',
      'Configuracion de fuentes RSS por nicho',
      'Entrenamiento del editor 1:1 (4 horas)',
    ],
    deliverable: 'Sistema operando en tu cuenta IG + soporte 30 dias post-launch',
  },
  {
    id: 'avatar-ia',
    icon: Sparkles,
    name: 'Avatar IA Influencer',
    tagline: 'Tu avatar virtual generando contenido publicitario para tus productos',
    desc: 'Avatar IA con identidad visual unica que produce reels, fotos y stories promocionando productos reales (los tuyos o los de tus clientes). Bot Telegram conversacional para crear contenido en 1 click. Stack ComfyUI (SDXL) + Stable Horde + LLM.',
    priceFrom: 1800000,
    duration: '20-30 dias',
    gradient: 'from-fuchsia-600 to-pink-700',
    accent: 'text-fuchsia-700',
    features: [
      'Avatar IA diseñado a medida (10+ poses base)',
      'Bot Telegram conversacional (briefing → contenido)',
      'Generador de imagenes con IA (ComfyUI local)',
      'Pipeline de reels con voz IA + musica',
      'Overlay automatico con productos reales',
      'Publicacion programada en Instagram',
      'Onboarding personalizado: tu marca + tus productos',
      'Soporte tecnico 60 dias',
    ],
    deliverable: 'Avatar + bot Telegram + 30 piezas de contenido generadas durante onboarding',
  },
  {
    id: 'erp-indumentaria',
    icon: ShoppingBag,
    name: 'ERP para Indumentaria (modelo Moia)',
    tagline: 'Sistema completo: stock multi-sucursal + Tiendanube + ARCA',
    desc: 'ERP a medida para marcas de indumentaria con tienda online. Inventario en tiempo real entre tiendas fisicas y online, sync bidireccional con Tiendanube, facturacion electronica AFIP/ARCA, dashboard de ventas, multi-usuario por sucursal.',
    priceFrom: 2400000,
    duration: '30-45 dias',
    gradient: 'from-orange-600 to-red-600',
    accent: 'text-orange-700',
    features: [
      'Backend Flask + PostgreSQL en VPS dedicado',
      'POS multi-sucursal con permisos por usuario',
      'Sync bidireccional con Tiendanube (productos + stock + ordenes)',
      'Facturacion electronica ARCA (Resp. Inscripto o Monotributo)',
      'Dashboard de ventas + reportes mensuales',
      'Gestion de proveedores + ordenes de compra',
      'Importador masivo desde Excel',
      'Capacitacion para tu equipo (4 sesiones)',
    ],
    deliverable: 'ERP funcionando + migracion de tu inventario actual + capacitacion completa',
  },
  {
    id: 'suite-juridica-white-label',
    icon: Scale,
    name: 'Suite Juridica White-Label',
    tagline: 'Plataforma completa para revender a otros estudios juridicos',
    desc: 'Suite legal completa (PJN + SCBA + JurisArgentina + Agente Secretario + Facturacion ARCA + Turnos) bajo TU marca. Vos vendes a otros abogados, nosotros operamos la infraestructura. Listo para escalar como SaaS.',
    priceFrom: 3500000,
    duration: '45-60 dias',
    gradient: 'from-blue-700 to-indigo-800',
    accent: 'text-blue-700',
    features: [
      'Plataforma multi-tenant completa con tu marca',
      'Todos los productos: PJN, SCBA, JurisArgentina, Secretario IA',
      'Facturacion ARCA + dashboard causas + turnos',
      'Panel admin para vos (gestionar tus clientes-abogados)',
      'Cobros automatizados via MercadoPago (vos defines precios)',
      'Onboarding self-service para tus clientes',
      'Hosting + mantenimiento + updates incluidos primer ano',
      'Vos cobras, vos quedan los margenes (modelo licencia o revshare)',
    ],
    deliverable: 'SaaS operativo bajo tu marca + soporte tecnico continuo (incluido 12 meses)',
  },
]

const why = [
  {
    icon: Headphones,
    title: 'Onboarding 1:1',
    desc: 'No te dejamos solo con un manual. Te capacitamos personalmente hasta que el sistema este corriendo en tu negocio.',
  },
  {
    icon: Settings,
    title: '100% a medida',
    desc: 'Cada implementacion se adapta a tu marca, tu flujo y tus integraciones. No es un template generico.',
  },
  {
    icon: Calendar,
    title: 'Plazos garantizados',
    desc: 'Te firmamos un plan con hitos. Si nos atrasamos, descuento sobre el precio final. Sin excusas.',
  },
  {
    icon: Zap,
    title: 'Soporte post-launch',
    desc: 'Entre 30 y 365 dias de soporte tecnico segun el producto. Bugs y ajustes pequenos sin costo.',
  },
]

const process = [
  { num: '1', title: 'Reunion de descubrimiento', desc: '60 min via Meet. Entendemos tu negocio, objetivos y restricciones. Salis con un diagnostico aunque no avances.' },
  { num: '2', title: 'Propuesta cerrada', desc: 'Te enviamos alcance + precio cerrado + plan con hitos. Sin sorpresas.' },
  { num: '3', title: 'Sena 50% + arrancamos', desc: 'Con la sena confirmamos plazo de inicio. Comenzamos la semana siguiente.' },
  { num: '4', title: 'Iteramos con vos', desc: 'Avances semanales por video. Vos validas, ajustamos en el momento. Sin sorpresas al final.' },
  { num: '5', title: 'Entrega + capacitacion', desc: 'Sistema en produccion + capacitacion para tu equipo. Pago final contra entrega operativa.' },
  { num: '6', title: 'Soporte post-launch', desc: 'Entre 30 y 365 dias segun producto. Bugs y ajustes menores cubiertos.' },
]

const faqs = [
  {
    q: 'Por que cuesta tanto?',
    a: 'Estos productos son sistemas completos hechos a medida, no plantillas. Cada uno requiere entre 100 y 400 horas de trabajo profesional (desarrollo + integraciones + setup + capacitacion). Comparado con contratar un equipo (1 desarrollador full-time = $1.5M-$2.5M/mes en Argentina), implementarlos con nosotros sale entre 5 y 10 veces mas barato.',
  },
  {
    q: 'Puedo financiarlo?',
    a: 'Si. Trabajamos con 50% al arrancar, 30% a mitad del proyecto y 20% contra entrega. Para proyectos mas grandes podemos armar planes en 4-6 cuotas con tarjeta o transferencias mensuales.',
  },
  {
    q: 'Y si no me gusta como va el proyecto?',
    a: 'Trabajamos con hitos. Si despues del primer hito (mockup + arquitectura) no te convence, podes cancelar y solo pagas la sena. Para hitos posteriores, hay penalizacion proporcional pero NO te quedas con un sistema a medio hacer.',
  },
  {
    q: 'Quien es el dueno del codigo?',
    a: 'Vos. Te entregamos el codigo fuente completo + documentacion + acceso al servidor. Si en algun momento queres irte, te llevas todo. No hay vendor lock-in.',
  },
  {
    q: 'Necesito tener equipo tecnico para usarlo?',
    a: 'No. Nosotros operamos y mantenemos. Vos solo necesitas operar el "front" del sistema (cargar productos, ver reportes, etc.) y para eso te capacitamos. Si despues queres internalizar el equipo tecnico, te lo entregamos documentado.',
  },
  {
    q: 'Hacen otras implementaciones distintas a estas 4?',
    a: 'Si. Cualquier sistema de software, IA o automatizacion compleja. Estas 4 son las que ya tenemos productizadas (mas rapidas + mas baratas). Para otras cosas: cotizacion a medida segun alcance.',
  },
  {
    q: 'Trabajan fuera de Argentina?',
    a: 'Si para Latinoamerica (Uruguay, Chile, Colombia, Mexico, Peru, Espana). Cobramos en USD via Stripe o Wise. Para EEUU/Canada: caso por caso.',
  },
]

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            >
              <Crown className="w-4 h-4" /> Premium · Implementacion asistida
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Sistemas completos<br />implementados por nosotros
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/95 mb-8 max-w-xl leading-relaxed"
            >
              4 productos premium para negocios que necesitan algo mas que una suscripcion. Implementacion 100% manual, capacitacion personalizada y soporte post-launch.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#productos">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-amber-700 hover:bg-white/90 font-bold text-base px-8">
                  Ver productos premium <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#contacto">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Solicitar reunion <ChevronDown className="w-4 h-4" />
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
            { num: '15-60', label: 'dias de implementacion' },
            { num: '50/50', label: 'modalidad de pago' },
            { num: '100%', label: 'codigo propio entregado' },
            { num: '30-365', label: 'dias de soporte incluido' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-amber-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="productos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider mb-3">Productos premium</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              4 sistemas completos, listos para implementar
            </h2>
            <p className="text-surface-500">
              Productos productizados con metodologia probada. Plazo cerrado, precio cerrado, alcance cerrado.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {products.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl border border-surface-100 overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
                >
                  <div className={`bg-gradient-to-br ${p.gradient} p-6 text-white`}>
                    <Icon className="w-9 h-9 mb-3 opacity-90" />
                    <h3 className="text-2xl font-extrabold mb-1">{p.name}</h3>
                    <p className="text-white/80 text-sm">{p.tagline}</p>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-surface-600 text-sm leading-relaxed mb-5">{p.desc}</p>

                    <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-surface-100">
                      <div>
                        <p className="text-xs text-surface-400 uppercase tracking-wider">Desde</p>
                        <p className="text-2xl font-extrabold text-surface-900">${p.priceFrom.toLocaleString('es-AR')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400 uppercase tracking-wider">Implementacion</p>
                        <p className="text-2xl font-extrabold text-surface-900">{p.duration}</p>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-3">Que incluye</p>
                    <ul className="space-y-2 mb-5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                          <Check className={`w-4 h-4 ${p.accent} shrink-0 mt-0.5`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="bg-surface-50 rounded-xl p-3 mb-5">
                      <p className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-1">Entregable final</p>
                      <p className="text-sm text-surface-600">{p.deliverable}</p>
                    </div>

                    <a href={`#contacto?producto=${p.id}`}>
                      <Button className={`w-full gap-2 bg-gradient-to-r ${p.gradient} text-white font-semibold hover:opacity-95`}>
                        Solicitar reunion <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider mb-3">Por que elegir premium</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              No es un servicio comun
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {why.map((w, i) => {
              const Icon = w.icon
              return (
                <motion.div
                  key={w.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-6 border border-surface-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2">{w.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{w.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Como trabajamos</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {process.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-100"
              >
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center text-base font-extrabold mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-surface-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl p-5 border border-surface-100 group">
                <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between gap-2">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-surface-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-sm text-surface-500 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry */}
      <section id="contacto" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-amber-700 font-semibold text-sm uppercase tracking-wider mb-3">Solicitar reunion</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Hablemos de tu proyecto premium
            </h2>
            <p className="text-surface-500">
              Reunion gratuita de 60 min. Salis con un diagnostico aunque no avances con nosotros.
            </p>
          </div>
          <InquiryForm
            service="premium"
            source="/premium"
            accentClass="bg-amber-600 hover:bg-amber-700"
            budgetOptions={[
              '$1.000.000 - $2.000.000',
              '$2.000.000 - $3.500.000',
              '$3.500.000 - $5.000.000',
              'Mas de $5.000.000',
              'Necesito asesoramiento',
            ]}
            description="Decinos cual de los 4 productos te interesa (o si necesitas algo distinto). Te contactamos para coordinar reunion."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-amber-600 to-orange-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Crown className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Listos para llevar tu negocio al siguiente nivel?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Reunion gratis. Diagnostico cerrado. Vos decidis si avanzamos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#contacto">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-amber-700 hover:bg-white/90 font-bold text-base px-8">
                Solicitar reunion <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                Hablar por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
