'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Globe, Scale, Bot, Check, Zap, Bell, FileText, Shield, Clock, Mail, Webhook, MessageSquare, Linkedin, TrendingUp, Users, PenTool, CandlestickChart, Activity, BarChart3, Search, Send, UserCheck, MailX, Target, CalendarCheck, Instagram, Newspaper, Image, BookOpen, Database, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const products = [
  {
    id: 'sitios-web',
    badge: 'Producto estrella',
    title: 'Sitios Web autogestionados',
    subtitle: 'Tu negocio online en minutos',
    description: 'Arma un sitio web profesional completando un asistente guiado. Con los datos de tu negocio montamos el sitio sobre una plantilla acorde a tu rubro. Publicado con SSL, SEO y WhatsApp integrado.',
    icon: Globe,
    gradient: 'from-brand-500 to-cyan-500',
    bgGlow: 'bg-brand-500/10',
    features: [
      { icon: Zap, text: 'Asistente guiado, sin código' },
      { icon: Globe, text: 'URL propia con SSL incluido' },
      { icon: FileText, text: 'SEO optimizado para Google' },
    ],
    cta: 'Crear mi sitio gratis',
    ctaHref: '/register',
    price: 'Desde $0/mes',
    priceNote: 'Plan gratuito disponible',
  },
  {
    id: 'jurisprudencia',
    badge: 'Para abogados',
    title: 'JurisArgentina',
    subtitle: 'Buscador de jurisprudencia con texto completo',
    description: '+285.000 fallos de SAIJ, JUBA y Corte Suprema con texto completo. Búsqueda avanzada con operadores booleanos, filtros por jurisdicción, materia y tribunal. Exportación PDF y cita automática. Actualizado diariamente con fallos de toda Argentina.',
    icon: BookOpen,
    gradient: 'from-blue-600 to-indigo-700',
    bgGlow: 'bg-blue-500/10',
    features: [
      { icon: Database, text: '+285.000 fallos con texto completo' },
      { icon: Search, text: 'Búsqueda avanzada con operadores booleanos' },
      { icon: Download, text: 'Exportar PDF y copiar cita' },
    ],
    cta: 'Acceder a JurisArgentina',
    ctaHref: 'https://juris.automaticialab.com',
    price: 'Desde $0/mes',
    priceNote: 'Plan gratuito | Premium $14.999/mes',
  },
  {
    id: 'monitoreo-judicial',
    badge: 'Para abogados',
    title: 'Monitoreo Judicial',
    subtitle: 'Cada proveído y notificación, directo a tu email',
    description: 'Monitoreo automático de notificaciones en PJN y SCBA. Recibí alertas por email con el texto completo de cada documento, sin entrar al portal. Ideal para abogados y estudios jurídicos.',
    icon: Scale,
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
    features: [
      { icon: Bell, text: 'Alertas cada 2 horas (L-V)' },
      { icon: FileText, text: 'Texto completo del PDF extraído' },
      { icon: Shield, text: 'Deduplicación inteligente' },
    ],
    cta: 'Suscribirme',
    ctaHref: '/alertajudicial',
    price: 'Desde $15.000/mes',
    priceNote: '60 días gratis | Sin contrato mínimo',
  },
  {
    id: 'lexpost',
    badge: 'Para abogados',
    title: 'LexPost - Publicación Legal IA',
    subtitle: 'De la sentencia al Instagram en 5 minutos',
    description: 'Subí un PDF de sentencia, resolución o dictamen. La IA censura datos personales automáticamente (Ley 25.326), genera una carátula profesional con tu branding, crea el copy para Instagram y lo publica como carousel. Ideal para abogados que quieren posicionarse en redes con contenido jurídico real.',
    icon: FileText,
    gradient: 'from-indigo-600 to-blue-800',
    bgGlow: 'bg-indigo-500/10',
    features: [
      { icon: Shield, text: 'Censura automática de datos personales (OCR + IA)' },
      { icon: Image, text: 'Carátula profesional con branding de tu estudio' },
      { icon: Instagram, text: 'Publicación directa como carousel en Instagram' },
    ],
    cta: 'Activar LexPost',
    ctaHref: '/register?next=lexpost',
    price: 'Desde $15.000/mes',
    priceNote: 'Por cuenta de Instagram',
  },
  {
    id: 'prospeccion',
    badge: 'Ventas B2B',
    title: 'Prospección B2B con IA',
    subtitle: 'Leads reales + emails personalizados en piloto automático',
    description: 'Sistema completo que busca prospectos en tu nicho, extrae emails verificados de sus webs y envía emails únicos generados por IA. Cada mensaje menciona datos reales del negocio. Todo automático, 24/5, con seguimiento en Google Sheets.',
    icon: Target,
    gradient: 'from-orange-500 to-red-600',
    bgGlow: 'bg-orange-500/10',
    features: [
      { icon: Search, text: 'Captación automática por nicho y ciudad' },
      { icon: Mail, text: 'Emails personalizados generados por IA' },
      { icon: Shield, text: 'Anti-spam profesional con unsubscribe' },
    ],
    cta: 'Activar Prospección',
    ctaHref: '/register?next=prospeccion',
    price: 'Desde $25.000/mes',
    priceNote: 'Stack 100% gratuito para el cliente',
  },
  {
    id: 'captacion-leads',
    badge: 'LeadGen',
    title: 'Captación de Leads IA',
    subtitle: 'Base de datos de prospectos reales, sin mover un dedo',
    description: 'Sistema automatizado que busca negocios reales en toda Argentina, extrae sus datos de contacto y te arma una base de leads lista para vender. Funciona 24/7 sin intervención: elegí nichos y ciudades, y valida cada email contra el dominio del negocio.',
    icon: Search,
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-rose-500/10',
    features: [
      { icon: Mail, text: 'Emails verificados contra dominio real' },
      { icon: Users, text: '45 nichos y 25 ciudades argentinas' },
      { icon: Clock, text: 'Captura automática 24/7 sin límites' },
    ],
    cta: 'Activar captación de leads',
    ctaHref: '/register?next=leads',
    price: 'Desde $18.000/mes',
    priceNote: 'Leads ilimitados en Google Sheets',
  },
  {
    id: 'resenas-google',
    badge: 'Reputación online',
    title: 'Reseñas Google IA',
    subtitle: 'Responde cada reseña en minutos, no en días',
    description: 'Un agente de IA monitorea tus reseñas de Google Business y responde automáticamente con el tono de tu marca. Respuestas personalizadas según la puntuación, el contenido y el nombre del cliente. Tu reputación online, siempre atendida.',
    icon: MessageSquare,
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
    features: [
      { icon: Zap, text: 'Respuestas automáticas con IA' },
      { icon: Clock, text: 'Monitoreo cada 30 minutos' },
      { icon: Shield, text: 'Tono personalizado por negocio' },
    ],
    cta: 'Activar respuestas IA',
    ctaHref: '/register?next=resenas',
    price: 'Desde $15.000/mes',
    priceNote: 'Por perfil de Google Business',
  },
  {
    id: 'linkedin-optimizer',
    badge: 'Personal branding',
    title: 'LinkedIn Optimizer IA',
    subtitle: 'Publicaciones que posicionan, perfil que convierte',
    description: 'Un asistente de IA analiza tu perfil de LinkedIn, genera recomendaciones de optimización y crea publicaciones profesionales de alto impacto. Confirmás, se publica automáticamente. Todo desde Telegram.',
    icon: Linkedin,
    gradient: 'from-blue-600 to-sky-500',
    bgGlow: 'bg-blue-500/10',
    features: [
      { icon: TrendingUp, text: 'Optimización de perfil con IA' },
      { icon: PenTool, text: 'Posts virales auto-publicados' },
      { icon: Users, text: 'Plan de contenido semanal' },
    ],
    cta: 'Activar LinkedIn IA',
    ctaHref: '/register?next=linkedin',
    price: 'Desde $12.000/mes',
    priceNote: 'Por perfil de LinkedIn',
  },
  {
    id: 'email-marketing',
    badge: 'Marketing',
    title: 'Email Marketing Automatizado',
    subtitle: 'Llega a todos tus clientes sin Mailchimp ni dólares',
    description: 'Sistema que envía emails promocionales personalizados a toda tu base de contactos, de forma automática. Template profesional con tu marca, anti-spam integrado, desuscripción automática y seguimiento en tiempo real. Sin plataformas costosas en dólares.',
    icon: Send,
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/10',
    features: [
      { icon: UserCheck, text: 'Personalizado por nombre del contacto' },
      { icon: Shield, text: 'Anti-spam: ritmo controlado + template optimizado' },
      { icon: MailX, text: 'Desuscripción automática en cada email' },
    ],
    cta: 'Ver planes y precios',
    ctaHref: '/servicios/email-marketing#planes',
    price: 'Desde $15.000/mes',
    priceNote: 'En pesos, sin plataformas en USD',
  },
  {
    id: 'senales-crypto',
    badge: 'Trading',
    title: 'Señales Crypto IA',
    subtitle: 'Trading inteligente con análisis técnico automatizado',
    description: 'Bot de señales crypto educativas. Analiza 18 pares con 7 indicadores técnicos (RSI, MACD, EMA, Bollinger, ADX, Volumen, Velas) + 3 indicadores macro (Fear & Greed, Funding Rate, BTC Dominance). Alertas en Telegram con niveles sugeridos de Stop Loss y Take Profit. Informativo, no es asesoramiento financiero ni garantiza ganancias.',
    icon: CandlestickChart,
    gradient: 'from-emerald-500 to-green-600',
    bgGlow: 'bg-emerald-500/10',
    features: [
      { icon: Activity, text: '18 pares analizados 24/7 en tiempo real' },
      { icon: Shield, text: '7 indicadores técnicos + 3 macro' },
      { icon: MessageSquare, text: 'Alertas Telegram con SL/TP y score de confianza' },
    ],
    cta: 'Activar señales crypto',
    ctaHref: '/register?next=crypto',
    price: '$20.000/mes',
    priceNote: '18 pares | análisis técnico | 24/7',
  },
  {
    id: 'redes-sociales',
    badge: 'Social media',
    title: 'Automatización de Redes Sociales',
    subtitle: 'Contenido publicado en Instagram sin tocar el celular',
    description: 'Sistema 100% automatizado que busca noticias o contenido de tu nicho, lo procesa con IA, genera imágenes y lo publica en Instagram automáticamente. Ideal para canales de noticias, marcas y cuentas temáticas que quieren publicar todos los días sin esfuerzo.',
    icon: Instagram,
    gradient: 'from-fuchsia-500 to-purple-600',
    bgGlow: 'bg-fuchsia-500/10',
    features: [
      { icon: Newspaper, text: '4 publicaciones diarias automáticas' },
      { icon: Image, text: 'Imágenes generadas con IA' },
      { icon: Zap, text: 'Contenido curado de múltiples fuentes' },
    ],
    cta: 'Consultar disponibilidad',
    ctaHref: 'https://wa.me/5491171311465?text=Hola,%20me%20interesa%20la%20automatizacion%20de%20redes%20sociales',
    price: 'Presupuesto a medida',
    priceNote: 'Incluye setup + publicacion diaria',
  },
  {
    id: 'turnos-online',
    badge: 'Agenda digital',
    title: 'Turnos Online',
    subtitle: 'Tus clientes reservan solos, vos atendés',
    description: 'Plataforma web de reserva de turnos con confirmación automática, integración con Google Calendar y notificaciones por email. Tus clientes eligen día, hora y servicio desde el celular. Vos solo atendés.',
    icon: CalendarCheck,
    gradient: 'from-teal-500 to-cyan-600',
    bgGlow: 'bg-teal-500/10',
    features: [
      { icon: CalendarCheck, text: 'Integración Google Calendar automática' },
      { icon: Mail, text: 'Confirmación por email al instante' },
      { icon: Clock, text: 'Disponibilidad en tiempo real' },
    ],
    cta: 'Consultar turnos online',
    ctaHref: 'https://wa.me/5491171311465?text=Hola,%20me%20interesa%20el%20sistema%20de%20turnos%20online',
    price: 'Desde $12.000/mes',
    priceNote: 'Setup incluido, $0 en infraestructura',
  },
  {
    id: 'automatizaciones',
    badge: 'A medida',
    title: 'Automatizaciones IA',
    subtitle: 'Flujos inteligentes para tu operación',
    description: 'Diseñamos e implementamos automatizaciones personalizadas con IA: scraping, procesamiento de datos, integraciones API, agentes LLM, notificaciones y más. Pensado para empresas que quieren escalar sin sumar personal.',
    icon: Bot,
    gradient: 'from-slate-600 to-slate-800',
    bgGlow: 'bg-slate-500/10',
    features: [
      { icon: Webhook, text: 'Integraciones API ilimitadas' },
      { icon: Bot, text: 'Agentes con IA (GPT, Gemini, Groq)' },
      { icon: Clock, text: 'Workflows 24/7 en la nube' },
    ],
    cta: 'Consultar proyecto',
    ctaHref: 'https://wa.me/5491171311465?text=Hola,%20necesito%20una%20automatizacion%20personalizada',
    price: 'Presupuesto a medida',
    priceNote: 'Proyectos desde $50.000',
  },
]

export function ProductsSection() {
  return (
    <section id="productos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Nuestros productos
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Soluciones que trabajan por vos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Cada producto resuelve un problema real. Elegí el que necesitás o combiná varios.
          </motion.p>
        </div>

        {/* Product cards */}
        <div className="space-y-8">
          {products.map((product, i) => {
            const Icon = product.icon
            const isReversed = i % 2 === 1
            return (
              <motion.div
                key={product.id}
                id={`producto-${product.id}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-surface-50 rounded-3xl border border-surface-100 overflow-hidden hover:shadow-card transition-shadow duration-300 scroll-mt-24"
              >
                <div className={`grid lg:grid-cols-2 gap-0 ${isReversed ? 'lg:[direction:rtl]' : ''}`}>
                  {/* Content side */}
                  <div className={`p-8 lg:p-12 flex flex-col justify-center ${isReversed ? 'lg:[direction:ltr]' : ''}`}>
                    {/* Badge */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r ${product.gradient} text-white`}>
                        {product.badge}
                      </span>
                    </div>

                    <h3 className="text-3xl font-extrabold text-surface-900 mb-2">
                      {product.title}
                    </h3>
                    <p className="text-lg text-brand-600 font-medium mb-4">
                      {product.subtitle}
                    </p>
                    <p className="text-surface-500 leading-relaxed mb-6">
                      {product.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {product.features.map((f) => {
                        const FIcon = f.icon
                        return (
                          <li key={f.text} className="flex items-center gap-3 text-sm text-surface-700">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${product.gradient} flex items-center justify-center shrink-0`}>
                              <FIcon className="w-4 h-4 text-white" />
                            </div>
                            {f.text}
                          </li>
                        )
                      })}
                    </ul>

                    {/* Price + CTA */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Link href={product.ctaHref}>
                        <Button variant="gradient" className="gap-2">
                          {product.cta}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <div>
                        <p className="text-sm font-bold text-surface-900">{product.price}</p>
                        <p className="text-xs text-surface-400">{product.priceNote}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual side */}
                  <div className={`relative hidden lg:flex items-center justify-center p-12 ${isReversed ? 'lg:[direction:ltr]' : ''}`}>
                    <div className={`absolute inset-0 ${product.bgGlow} opacity-50`} />
                    <div className={`relative w-32 h-32 rounded-3xl bg-gradient-to-br ${product.gradient} flex items-center justify-center shadow-2xl`}>
                      <Icon className="w-16 h-16 text-white" />
                    </div>
                    {/* Floating elements */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-8 right-16 bg-white rounded-xl px-3 py-2 shadow-elevated border border-surface-100 text-xs font-medium text-surface-700 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {product.features[0].text}
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute bottom-8 left-16 bg-white rounded-xl px-3 py-2 shadow-elevated border border-surface-100 text-xs font-medium text-surface-700 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {product.features[2].text}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
