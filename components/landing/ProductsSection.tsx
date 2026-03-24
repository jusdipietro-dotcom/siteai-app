'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Globe, Scale, Bot, Check, Zap, Bell, FileText, Shield, Clock, Mail, Webhook, MessageSquare, Linkedin, TrendingUp, Users, PenTool, CandlestickChart, Activity, BarChart3, Search, Send, UserCheck, MailX } from 'lucide-react'
import { Button } from '@/components/ui/button'

const products = [
  {
    id: 'sitios-web',
    badge: 'Producto estrella',
    title: 'Sitios Web con IA',
    subtitle: 'Tu negocio online en 60 segundos',
    description: 'Generá un sitio web profesional completando un formulario simple. Nuestra IA crea el contenido, diseño y estructura adaptada a tu rubro. Publicado con SSL, SEO y WhatsApp integrado.',
    icon: Globe,
    gradient: 'from-brand-500 to-cyan-500',
    bgGlow: 'bg-brand-500/10',
    features: [
      { icon: Zap, text: 'Generación instantánea con IA' },
      { icon: Globe, text: 'URL propia con SSL incluido' },
      { icon: FileText, text: 'SEO optimizado para Google' },
    ],
    cta: 'Crear mi sitio gratis',
    ctaHref: '/register',
    price: 'Desde $0/mes',
    priceNote: 'Plan gratuito disponible',
  },
  {
    id: 'monitoreo-judicial',
    badge: 'Nuevo',
    title: 'Monitoreo Judicial',
    subtitle: 'Cada proveído, directo a tu email',
    description: 'Monitoreo automático de notificaciones en PJN y SCBA. Recibí alertas por email con el texto completo de cada documento, sin entrar al portal. Ideal para abogados y estudios jurídicos.',
    icon: Scale,
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
    features: [
      { icon: Bell, text: 'Alertas cada 2 horas (L-V)' },
      { icon: FileText, text: 'Texto completo del PDF extraído' },
      { icon: Shield, text: 'Deduplicación inteligente' },
    ],
    cta: 'Activar monitoreo',
    ctaHref: '/register?next=monitoreo',
    price: 'Desde $19.000/mes',
    priceNote: 'Por CUIT monitoreado',
  },
  {
    id: 'resenas-google',
    badge: 'Nuevo',
    title: 'Reseñas Google IA',
    subtitle: 'Respondé cada reseña en minutos, no en días',
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
    badge: 'Nuevo',
    title: 'LinkedIn Optimizer IA',
    subtitle: 'Publicaciones que posicionan, perfil que convierte',
    description: 'Un asistente de IA analiza tu perfil de LinkedIn, genera recomendaciones de optimizacion y crea publicaciones profesionales de alto impacto. Confirmás, se publica automaticamente. Todo desde Telegram.',
    icon: Linkedin,
    gradient: 'from-blue-600 to-sky-500',
    bgGlow: 'bg-blue-500/10',
    features: [
      { icon: TrendingUp, text: 'Optimizacion de perfil con IA' },
      { icon: PenTool, text: 'Posts virales auto-publicados' },
      { icon: Users, text: 'Plan de contenido semanal' },
    ],
    cta: 'Activar LinkedIn IA',
    ctaHref: '/register?next=linkedin',
    price: 'Desde $12.000/mes',
    priceNote: 'Por perfil de LinkedIn',
  },
  {
    id: 'senales-crypto',
    badge: 'Nuevo',
    title: 'Señales Crypto IA',
    subtitle: 'Trading inteligente con análisis técnico automatizado',
    description: 'Bot de señales de criptomonedas que analiza 30 pares en tiempo real usando 6 indicadores técnicos (RSI, MACD, EMA, Bollinger, Volumen, Multi-timeframe). Recibí alertas de compra y venta directamente en tu Telegram con niveles de Stop Loss y Take Profit calculados automáticamente.',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
    features: [
      { icon: Activity, text: '30 criptomonedas analizadas 24/7 en tiempo real' },
      { icon: Shield, text: 'Stop Loss y Take Profit automáticos con gestión de riesgo' },
      { icon: MessageSquare, text: 'Alertas instantáneas en Telegram con score de confianza' },
    ],
    cta: 'Activar señales crypto',
    ctaHref: '/register?next=crypto',
    price: '$20.000/mes',
    priceNote: '30 pares | Señales 24/7',
  },
  {
    id: 'captacion-leads',
    badge: 'Nuevo',
    title: 'Captación de Leads IA',
    subtitle: 'Prospectos reales con email verificado, en piloto automático',
    description: 'Sistema automatizado que busca negocios reales en toda Argentina, extrae sus datos de contacto y te arma una base de leads lista para vender. Funciona 24/7 sin intervención: elige nichos, ciudades y valida cada email contra el dominio del negocio. Ideal para agencias, vendedores B2B y freelancers.',
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
    id: 'email-marketing',
    badge: 'Nuevo',
    title: 'Email Marketing Automatizado',
    subtitle: 'Llegá a todos tus clientes sin Mailchimp ni dólares',
    description: 'Sistema que envía emails promocionales personalizados a toda tu base de contactos, de forma automática. Template profesional con tu marca, anti-spam integrado, desuscripción automática y seguimiento en tiempo real. Sin plataformas costosas, sin suscripciones en dólares.',
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
    id: 'automatizaciones',
    badge: 'A medida',
    title: 'Automatizaciones IA',
    subtitle: 'Flujos inteligentes para tu operación',
    description: 'Diseñamos e implementamos automatizaciones personalizadas con IA: scraping, procesamiento de datos, integraciones API, agentes LLM, notificaciones y más. Pensado para empresas que quieren escalar.',
    icon: Bot,
    gradient: 'from-emerald-500 to-teal-600',
    bgGlow: 'bg-emerald-500/10',
    features: [
      { icon: Webhook, text: 'Integraciones API ilimitadas' },
      { icon: Bot, text: 'Agentes con IA (GPT, Gemini, Groq)' },
      { icon: Clock, text: 'Workflows 24/7 en la nube' },
    ],
    cta: 'Consultar proyecto',
    ctaHref: 'https://wa.me/5491171311465?text=Hola,%20necesito%20una%20automatización%20personalizada',
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
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-surface-50 rounded-3xl border border-surface-100 overflow-hidden hover:shadow-card transition-shadow duration-300"
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
