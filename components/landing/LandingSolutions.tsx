'use client'
import { motion } from 'framer-motion'
import {
  Globe,
  Scale,
  FileText,
  Target,
  Search,
  MessageSquare,
  Linkedin,
  Send,
  CandlestickChart,
  Instagram,
  CalendarCheck,
  Bot,
  BookOpen,
  MessageCircle,
  LucideIcon,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { waLink } from '@/lib/whatsapp'

type Solution = {
  id: string
  badge: string
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  highlights: string[]
  gradient: string
  bgGlow: string
  waMsg: string
  /**
   * Optional self-service alternative. Only "sitios web" has one today: the
   * same need can be covered either by us (WhatsApp) or by the customer using
   * the site generator. When present, the card offers both paths.
   */
  selfServe?: {
    href: string
    label: string
    note: string
  }
}

const solutions: Solution[] = [
  {
    id: 'sitios-web',
    badge: 'Diseno web',
    icon: Globe,
    title: 'Sitios web profesionales con IA',
    subtitle: 'Tu negocio online listo en dias, no en meses',
    description:
      'Disenamos e implementamos sitios web profesionales con tecnologia moderna (Next.js + Tailwind). SEO base, SSL, dominio propio, formularios conectados a WhatsApp/email y panel para que actualices contenido.',
    highlights: [
      'Diseno responsive adaptado a tu rubro',
      'SEO optimizado para Google desde el dia 1',
      'WhatsApp, formularios y CRM integrados',
    ],
    gradient: 'from-brand-500 to-cyan-500',
    bgGlow: 'bg-brand-500/10',
    waMsg: 'Hola! Me interesa el desarrollo de un sitio web profesional. Quiero recibir mas informacion.',
    selfServe: {
      href: '/servicios/creador-de-sitios',
      label: 'Armarlo yo mismo con IA',
      note: 'Gratis hasta publicarlo',
    },
  },
  {
    id: 'jurisprudencia',
    badge: 'Para abogados',
    icon: BookOpen,
    title: 'JurisArgentina - Buscador de jurisprudencia',
    subtitle: 'Mas de 285.000 fallos con texto completo',
    description:
      'Plataforma propia con fallos de SAIJ, JUBA, SCBA y Corte Suprema. Busqueda avanzada con operadores booleanos, filtros por jurisdiccion, materia y tribunal. Exportacion PDF y cita automatica. Actualizada todos los dias.',
    highlights: [
      '+285.000 fallos indexados con texto completo',
      'Busqueda booleana, filtros y favoritos',
      'Exportar a PDF y copiar cita lista',
    ],
    gradient: 'from-blue-600 to-indigo-700',
    bgGlow: 'bg-blue-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre JurisArgentina (buscador de jurisprudencia).',
  },
  {
    id: 'monitoreo-judicial',
    badge: 'Para abogados',
    icon: Scale,
    title: 'Monitoreo judicial (PJN y SCBA)',
    subtitle: 'Cada proveido y notificacion, directo a tu email',
    description:
      'Monitoreamos automaticamente las notificaciones del Poder Judicial de la Nacion y la Suprema Corte de Buenos Aires. Recibis alertas por email con el texto completo de cada documento, sin necesidad de entrar al portal.',
    highlights: [
      'Alertas multiples veces por dia (L-V)',
      'Texto completo del PDF extraido',
      'Deduplicacion inteligente, cero ruido',
    ],
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre el servicio de monitoreo judicial (PJN/SCBA).',
  },
  {
    id: 'lexpost',
    badge: 'Para abogados',
    icon: FileText,
    title: 'LexPost - Publicacion legal en Instagram',
    subtitle: 'De la sentencia al posteo en 5 minutos',
    description:
      'Subis un PDF de sentencia, resolucion o dictamen. La IA censura datos personales automaticamente (Ley 25.326), genera una caratula profesional con el branding de tu estudio, escribe el copy y lo publica como carousel en Instagram.',
    highlights: [
      'Censura automatica de datos personales (OCR + IA)',
      'Caratula profesional con tu branding',
      'Publicacion directa como carousel en Instagram',
    ],
    gradient: 'from-indigo-600 to-blue-800',
    bgGlow: 'bg-indigo-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre LexPost (publicacion legal automatizada en Instagram).',
  },
  {
    id: 'prospeccion',
    badge: 'Ventas B2B',
    icon: Target,
    title: 'Prospeccion B2B con IA',
    subtitle: 'Leads reales y emails personalizados en piloto automatico',
    description:
      'Sistema que busca prospectos en tu nicho, extrae emails verificados de sus webs y envia mensajes unicos generados por IA. Cada email menciona datos reales del negocio destinatario. Todo automatico, con seguimiento centralizado.',
    highlights: [
      'Captacion automatica por nicho y ciudad',
      'Emails personalizados generados por IA',
      'Anti-spam profesional con unsubscribe',
    ],
    gradient: 'from-orange-500 to-red-600',
    bgGlow: 'bg-orange-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre Prospeccion B2B con IA.',
  },
  {
    id: 'captacion-leads',
    badge: 'LeadGen',
    icon: Search,
    title: 'Captacion automatica de leads',
    subtitle: 'Base de datos de prospectos reales, sin mover un dedo',
    description:
      'Sistema que busca negocios reales en toda Argentina, extrae sus datos de contacto y arma una base de leads lista para vender. Trabaja 24/7: elegis nichos, ciudades y valida cada email contra el dominio del negocio.',
    highlights: [
      'Emails verificados contra dominio real',
      'Cobertura de mas de 45 nichos y 25 ciudades',
      'Captura automatica 24/7 sin limites',
    ],
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'bg-rose-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre Captacion Automatica de Leads.',
  },
  {
    id: 'resenas-google',
    badge: 'Reputacion online',
    icon: MessageSquare,
    title: 'Resenas de Google con IA',
    subtitle: 'Responde cada resena en minutos, no en dias',
    description:
      'Un agente de IA monitorea tus resenas de Google Business y responde automaticamente con el tono de tu marca. Respuestas personalizadas segun la puntuacion, el contenido y el nombre del cliente. Tu reputacion online, siempre atendida.',
    highlights: [
      'Respuestas automaticas con IA',
      'Monitoreo cada pocos minutos',
      'Tono personalizado por negocio',
    ],
    gradient: 'from-amber-500 to-orange-500',
    bgGlow: 'bg-amber-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre las respuestas automaticas a resenas de Google.',
  },
  {
    id: 'linkedin-optimizer',
    badge: 'Marca personal',
    icon: Linkedin,
    title: 'LinkedIn Optimizer IA',
    subtitle: 'Publicaciones que posicionan, perfil que convierte',
    description:
      'Un asistente de IA analiza tu perfil de LinkedIn, genera recomendaciones de optimizacion y crea publicaciones profesionales de alto impacto. Confirmas desde Telegram y se publica automaticamente.',
    highlights: [
      'Optimizacion completa de perfil con IA',
      'Publicaciones automaticas previa aprobacion',
      'Plan de contenido semanal personalizado',
    ],
    gradient: 'from-blue-600 to-sky-500',
    bgGlow: 'bg-blue-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre LinkedIn Optimizer IA.',
  },
  {
    id: 'email-marketing',
    badge: 'Marketing',
    icon: Send,
    title: 'Email marketing automatizado',
    subtitle: 'Llega a toda tu base sin plataformas en dolares',
    description:
      'Sistema que envia emails promocionales personalizados a toda tu base de contactos, de forma automatica. Template profesional con tu marca, anti-spam integrado, desuscripcion automatica y seguimiento en tiempo real.',
    highlights: [
      'Personalizado por nombre del contacto',
      'Anti-spam: ritmo controlado y template optimizado',
      'Desuscripcion automatica en cada email',
    ],
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre el servicio de Email Marketing Automatizado.',
  },
  {
    id: 'senales-crypto',
    badge: 'Trading',
    icon: CandlestickChart,
    title: 'Senales crypto con IA',
    subtitle: 'Trading inteligente con analisis tecnico automatizado',
    description:
      'Bot de senales crypto que analiza multiples pares con 7 indicadores tecnicos (RSI, MACD, EMA, Bollinger, ADX, volumen, velas) mas 3 indicadores macro (Fear & Greed, Funding Rate, BTC Dominance). Alertas en Telegram con Stop Loss y Take Profit.',
    highlights: [
      'Mas de 18 pares analizados 24/7',
      '7 indicadores tecnicos + 3 macro',
      'Alertas Telegram con SL/TP y score de confianza',
    ],
    gradient: 'from-emerald-500 to-green-600',
    bgGlow: 'bg-emerald-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre las Senales Crypto con IA.',
  },
  {
    id: 'redes-sociales',
    badge: 'Social media',
    icon: Instagram,
    title: 'Automatizacion de redes sociales',
    subtitle: 'Contenido en Instagram todos los dias, sin tocar el celular',
    description:
      'Sistema 100% automatizado que busca noticias o contenido de tu nicho, lo procesa con IA, genera imagenes y lo publica en Instagram automaticamente. Ideal para canales de noticias, marcas y cuentas tematicas.',
    highlights: [
      'Publicaciones diarias programadas y automaticas',
      'Imagenes generadas con IA',
      'Contenido curado de multiples fuentes',
    ],
    gradient: 'from-fuchsia-500 to-purple-600',
    bgGlow: 'bg-fuchsia-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre la Automatizacion de Redes Sociales.',
  },
  {
    id: 'turnos-online',
    badge: 'Agenda digital',
    icon: CalendarCheck,
    title: 'Turnos online',
    subtitle: 'Tus clientes reservan solos, vos atendes',
    description:
      'Plataforma web de reserva de turnos con confirmacion automatica, integracion con Google Calendar y notificaciones por email. Tus clientes eligen dia, hora y servicio desde el celular.',
    highlights: [
      'Integracion con Google Calendar',
      'Confirmacion por email al instante',
      'Disponibilidad en tiempo real',
    ],
    gradient: 'from-teal-500 to-cyan-600',
    bgGlow: 'bg-teal-500/10',
    waMsg: 'Hola! Quiero recibir informacion sobre el sistema de Turnos Online.',
  },
  {
    id: 'automatizaciones',
    badge: 'A medida',
    icon: Bot,
    title: 'Automatizaciones IA a medida',
    subtitle: 'Flujos inteligentes para tu operacion',
    description:
      'Disenamos e implementamos automatizaciones personalizadas con IA: scraping, procesamiento de datos, integraciones API, agentes LLM, notificaciones y mas. Pensado para empresas que quieren escalar sin sumar personal.',
    highlights: [
      'Integraciones API ilimitadas',
      'Agentes IA con GPT, Claude, Gemini y Groq',
      'Workflows 24/7 corriendo en la nube',
    ],
    gradient: 'from-slate-600 to-slate-800',
    bgGlow: 'bg-slate-500/10',
    waMsg: 'Hola! Necesito una automatizacion a medida. Quiero recibir mas informacion.',
  },
]

export function LandingSolutions() {
  return (
    <section id="soluciones" className="py-24 bg-surface-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Soluciones especificas
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Productos listos para resolver problemas reales
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Implementaciones que ya hicimos para otros clientes y que adaptamos a tu negocio. Cada
            solucion se cotiza segun tu caso.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.05 }}
                className="group bg-white rounded-2xl border border-surface-100 p-6 flex flex-col hover:shadow-card hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${s.gradient} text-white`}
                  >
                    {s.badge}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-surface-900 mb-1 leading-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-brand-600 font-medium mb-3">{s.subtitle}</p>
                <p className="text-sm text-surface-500 leading-relaxed mb-4 flex-1">
                  {s.description}
                </p>

                <ul className="space-y-1.5 mb-5 text-xs text-surface-600">
                  {s.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${s.gradient} shrink-0`}
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {s.selfServe && (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-2">
                      Dos formas de tenerlo
                    </p>
                  )}

                  {s.selfServe && (
                    <p className="text-xs text-surface-500 mb-1.5">Que lo hagamos nosotros:</p>
                  )}
                  <a href={waLink(s.waMsg)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full gap-1.5 text-sm">
                      <MessageCircle className="w-4 h-4" />
                      Consultar por WhatsApp
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </a>

                  {s.selfServe && (
                    <>
                      <p className="text-xs text-surface-500 mt-3 mb-1.5">O hacerlo vos mismo:</p>
                      <Link href={s.selfServe.href}>
                        <Button variant="gradient" className="w-full gap-1.5 text-sm">
                          {s.selfServe.label}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <p className="text-[11px] text-surface-400 text-center mt-1.5">
                        {s.selfServe.note}
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
