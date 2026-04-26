'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import {
  ArrowRight, Check, Layout, Smartphone, Gauge, Search, ShoppingBag,
  Palette, Code2, MessageSquare, ChevronDown,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20diseno%20de%20paginas%20web'

const packages = [
  {
    id: 'landing',
    name: 'Landing Page',
    priceFrom: 180000,
    deliveryDays: '5-7 dias',
    popular: false,
    desc: 'Una sola pagina con scroll, ideal para presentar un negocio o un producto.',
    features: [
      'Diseno 100% a medida',
      'Hasta 6 secciones',
      'Animaciones y efectos suaves',
      'Optimizada para celular',
      'Formulario de contacto integrado',
      'Conexion con WhatsApp',
      'SEO basico (meta tags + sitemap)',
      'Hosting gratuito + dominio incluido el primer ano',
    ],
  },
  {
    id: 'institucional',
    name: 'Sitio Institucional',
    priceFrom: 350000,
    deliveryDays: '10-15 dias',
    popular: true,
    desc: 'Sitio multipagina para empresas, estudios o profesionales que necesitan presencia seria.',
    features: [
      'Hasta 8 paginas (home, nosotros, servicios, blog, contacto, etc.)',
      'Diseno premium con identidad de marca',
      'Blog editable autoadministrable',
      'Galeria de fotos / portfolio',
      'Mapa interactivo + Google Reviews integrados',
      'Formularios avanzados con notificaciones',
      'SEO on-page completo + Schema.org',
      'Hosting + dominio + email profesional 1 ano',
    ],
  },
  {
    id: 'ecommerce',
    name: 'Tienda Online',
    priceFrom: 650000,
    deliveryDays: '15-25 dias',
    popular: false,
    desc: 'E-commerce completo con catalogo, carrito, pagos y panel de administracion.',
    features: [
      'Catalogo de productos ilimitado',
      'Carrito + checkout + pagos (MercadoPago)',
      'Panel admin para gestionar stock y pedidos',
      'Cupones de descuento + envios configurables',
      'Sincronizacion opcional con Tiendanube',
      'Notificaciones por email y WhatsApp',
      'SEO avanzado + Google Merchant Center',
      'Hosting + dominio + soporte 3 meses',
    ],
  },
]

const features = [
  {
    icon: Palette,
    title: 'Diseno a medida',
    desc: 'Sin templates genericos. Cada web es disenada desde cero con tu marca, tus colores y tu estilo.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first',
    desc: 'El 70% de los visitantes entran desde el celular. Tu sitio se ve perfecto en cualquier pantalla.',
  },
  {
    icon: Gauge,
    title: 'Carga ultra rapida',
    desc: 'Sitios optimizados para cargar en menos de 2 segundos. Mejor experiencia y mejor SEO.',
  },
  {
    icon: Search,
    title: 'Listo para Google',
    desc: 'Estructura SEO desde el dia uno: meta tags, sitemap, schema y velocidad. Posicionamiento mas rapido.',
  },
  {
    icon: MessageSquare,
    title: 'Integraciones reales',
    desc: 'WhatsApp, Google Reviews, MercadoPago, Tiendanube, Calendly, Mailchimp. Todo lo que necesites.',
  },
  {
    icon: Code2,
    title: 'Codigo limpio y propio',
    desc: 'No quedas atado a una plataforma. Te entregamos el codigo y lo podes mover cuando quieras.',
  },
]

const steps = [
  { num: '1', title: 'Brief y propuesta', desc: 'Escuchamos que necesitas, vemos referencias y te enviamos una propuesta clara con precio cerrado.' },
  { num: '2', title: 'Diseno visual', desc: 'Te mostramos un mockup de como va a quedar antes de programar. Iteramos hasta que te encante.' },
  { num: '3', title: 'Desarrollo', desc: 'Programamos el sitio con tecnologia moderna (Next.js + Tailwind). Vos podes seguir el avance.' },
  { num: '4', title: 'Entrega y ajustes', desc: 'Publicamos el sitio, te lo capacitamos y hacemos hasta 2 rondas de ajustes sin costo.' },
]

const includes = [
  'Reunion inicial para entender tu negocio',
  'Diseno UI/UX original (no usamos templates)',
  'Codigo limpio en Next.js + Tailwind CSS',
  'Optimizacion de imagenes automatica',
  'Certificado SSL (https) gratis',
  'Hosting en infraestructura propia (VPS dedicado)',
  'Configuracion de dominio incluida',
  'Capacitacion para que cargues contenido vos mismo',
  'Soporte tecnico post-entrega',
  'Garantia de funcionamiento por 90 dias',
]

const faqs = [
  {
    q: 'Cuanto tarda en estar lista mi web?',
    a: 'Una landing page tarda entre 5 y 7 dias habiles. Un sitio institucional entre 10 y 15. Una tienda online entre 15 y 25 dias. Los plazos arrancan cuando recibimos contenido (textos, fotos, logo).',
  },
  {
    q: 'Como cobran? Hay senas?',
    a: 'Trabajamos con 50% al arrancar y 50% contra entrega. Aceptamos MercadoPago, transferencia o efectivo. Tambien podemos armar un plan en 3 cuotas sin interes (Naranja, Visa o American).',
  },
  {
    q: 'Puedo modificar el sitio yo mismo despues?',
    a: 'Si. Te capacitamos para que puedas editar textos, cambiar imagenes y agregar nuevas secciones desde un panel sencillo. Si preferis que lo hagamos nosotros, ofrecemos un plan de mantenimiento mensual.',
  },
  {
    q: 'Que pasa con el dominio y el hosting?',
    a: 'El primer ano de hosting + dominio (.com o .com.ar) esta incluido. Despues podes renovarlo con nosotros o llevarte el codigo a donde quieras. No te quedas atado.',
  },
  {
    q: 'Trabajan con WordPress / Wix / Squarespace?',
    a: 'No. Usamos Next.js y Tailwind, que son la tecnologia mas moderna y rapida del mercado. Sitios estaticos cargan 5x mas rapido que WordPress y son mas seguros (no se hackean).',
  },
  {
    q: 'Hacen integracion con Instagram, WhatsApp, MercadoPago?',
    a: 'Si. Integramos todo lo que necesites: WhatsApp Business, MercadoPago Checkout, Google Reviews, Calendly para turnos, Mailchimp para newsletters, Pixel de Meta y Google Analytics. Sin costo extra.',
  },
  {
    q: 'Puedo agregar mas paginas / funciones despues?',
    a: 'Si. Cualquier pagina extra o funcionalidad nueva se cotiza aparte. Como el codigo es propio y limpio, agregar cosas es rapido y barato.',
  },
  {
    q: 'Que diferencia tienen con el "creador de sitios" del producto principal?',
    a: 'El creador automatico ($0 a $25.000/mes) usa templates y es ideal para empezar rapido. El servicio de diseno a medida es para cuando queres algo unico, profesional y que destaque sobre la competencia.',
  },
]

const useCases = [
  { emoji: '🏢', title: 'Empresas y PyMES', desc: 'Sitios institucionales que generan confianza y atraen clientes calificados.' },
  { emoji: '⚖️', title: 'Profesionales', desc: 'Estudios juridicos, contables, medicos. Web seria que respalda tu marca personal.' },
  { emoji: '🛍️', title: 'E-commerce', desc: 'Tiendas online con MercadoPago, gestion de stock y panel admin.' },
  { emoji: '🍕', title: 'Gastronomia', desc: 'Menu digital, pedidos por WhatsApp, reservas online y promociones.' },
  { emoji: '🏠', title: 'Inmobiliarias', desc: 'Listados de propiedades con buscador, filtros y galerias.' },
  { emoji: '💪', title: 'Coaches y servicios', desc: 'Landings con turnos, packs de servicios y testimonios.' },
]

export default function DisenoWebPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-500 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Layout className="w-4 h-4" /> Servicio personalizado
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Diseno y desarrollo<br />de paginas web
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed"
            >
              Sitios web a medida con codigo propio, diseno unico y carga ultra rapida. Sin templates. Sin WordPress. Sin pagar por algo que no usas.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#paquetes">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-blue-600 hover:bg-white/90 font-bold text-base px-8">
                  Ver paquetes y precios <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#cotizar">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Pedir cotizacion <ChevronDown className="w-4 h-4" />
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
            { num: '<2s', label: 'tiempo de carga' },
            { num: '90+', label: 'PageSpeed score' },
            { num: '100%', label: 'mobile-friendly' },
            { num: '90 dias', label: 'garantia post-entrega' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-blue-600">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Por que elegirnos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Web profesional, sin atajos
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
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
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
      <section className="py-20 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Como trabajamos</h2>
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
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-extrabold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-surface-900 mb-2">{s.title}</h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="paquetes" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Paquetes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Elegi el paquete que mejor se adapte
            </h2>
            <p className="text-surface-500">
              Precios desde. La cotizacion final depende del alcance especifico de tu proyecto.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border ${p.popular ? 'border-blue-300 shadow-lg ring-2 ring-blue-500/20' : 'border-surface-100'}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mas pedido
                  </div>
                )}
                <h3 className="text-xl font-bold text-surface-900 mb-1">{p.name}</h3>
                <p className="text-sm text-surface-400 mb-4">{p.desc}</p>
                <div className="mb-1">
                  <span className="text-sm text-surface-400">Desde</span>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-extrabold text-surface-900">${p.priceFrom.toLocaleString('es-AR')}</span>
                </div>
                <p className="text-xs text-surface-500 mb-6">Entrega: {p.deliveryDays}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-600">
                      <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`#cotizar?paquete=${p.id}`}>
                  <Button
                    variant={p.popular ? 'gradient' : 'outline'}
                    className={`w-full gap-2 ${p.popular ? '' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  >
                    Cotizar este paquete <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Todo incluido</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              Que viene en cada proyecto
            </h2>
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-8">
            <div className="grid sm:grid-cols-2 gap-3">
              {includes.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-surface-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Para quien</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Trabajamos con</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
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

      {/* Inquiry form */}
      <section id="cotizar" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">Cotizacion</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Hablemos de tu proyecto
            </h2>
            <p className="text-surface-500">
              Completa el formulario y te respondemos en menos de 24 horas con una propuesta concreta.
            </p>
          </div>
          <InquiryForm
            service="diseno-web"
            source="/servicios/diseno-web"
            accentClass="bg-blue-600 hover:bg-blue-700"
            budgetOptions={[
              'Menos de $200.000',
              '$200.000 - $400.000',
              '$400.000 - $700.000',
              '$700.000 - $1.500.000',
              'Mas de $1.500.000',
              'Necesito asesoramiento',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-cyan-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Tu proxima web te esta esperando
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Hablemos hoy y arrancamos tu proyecto esta semana.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#cotizar">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-blue-600 hover:bg-white/90 font-bold text-base px-8">
                Pedir cotizacion <ArrowRight className="w-4 h-4" />
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
