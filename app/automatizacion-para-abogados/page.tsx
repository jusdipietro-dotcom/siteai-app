'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Check, Scale, Bell, FileText, Calendar, Search,
  Brain, Receipt, MessageCircle, Instagram, ChevronDown, Shield,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20soy%20abogado%2Fa%20y%20quiero%20info%20sobre%20la%20suite%20juridica'

const productos = [
  {
    icon: Bell,
    name: 'Monitoreo Judicial automático',
    desc: 'Notificaciones del PJN y SCBA en menos de 2 horas. Conectamos con tus credenciales y revisamos tus causas cada noche. Si hay novedad, te llega un email con el detalle.',
    priceFrom: 19000,
    href: '/register?next=monitoreo',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    icon: FileText,
    name: 'Dashboard de Causas MEV',
    desc: 'Panel unificado con todas tus causas activas, partes, movimientos y estado procesal. Sincronización automática cada 2-24 hs según plan.',
    priceFrom: 10000,
    href: '/register?next=causas',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    icon: Brain,
    name: 'JurisArgentina (Jurisprudencia con IA)',
    desc: 'Base de 410.000+ fallos indexados con búsqueda semántica IA. Encontrá precedentes en segundos, no en horas. SAIJ, JUBA y CSJN integrados.',
    priceFrom: 0,
    priceLabel: 'Gratis',
    href: 'https://juris.automaticialab.com',
    external: true,
    color: 'from-violet-600 to-purple-600',
  },
  {
    icon: MessageCircle,
    name: 'Secretaria virtual con IA',
    desc: 'Bot de WhatsApp que atiende consultas iniciales 24/7, agenda turnos, transcribe audios y deriva casos según urgencia. Como tener una secretaria que nunca duerme.',
    priceFrom: 25000,
    href: '/contacto',
    color: 'from-pink-600 to-rose-600',
  },
  {
    icon: Receipt,
    name: 'Facturación electrónica ARCA',
    desc: 'Emití Facturas A, B, C, Notas de Crédito y Débito directo desde el panel. Conexión nativa con ARCA (ex AFIP). Compatible Responsable Inscripto y Monotributista.',
    priceFrom: 15000,
    href: '/register?next=facturacion',
    color: 'from-orange-600 to-red-600',
  },
  {
    icon: Calendar,
    name: 'Turnos Online',
    desc: 'Página pública con tu disponibilidad. Tus clientes reservan, te llega notificación. Integrado con Google Calendar.',
    priceFrom: 12000,
    href: '/register?next=turnos',
    color: 'from-indigo-600 to-blue-600',
  },
  {
    icon: Instagram,
    name: 'LexPost (publicaciones IG)',
    desc: 'Publicaciones automáticas en Instagram con contenido legal: jurisprudencia, novedades, tips. Mantenete activo en redes sin perder horas.',
    priceFrom: 15000,
    href: '/register?next=lexpost',
    color: 'from-fuchsia-600 to-pink-600',
  },
]

const suiteFeatures = [
  'Monitoreo judicial PJN + SCBA',
  'Dashboard de causas con sync automática',
  'Facturación electrónica ARCA',
  'Turnos online con Google Calendar',
  'Acceso a JurisArgentina (jurisprudencia IA)',
  'Soporte directo por WhatsApp',
]

const stats = [
  { num: '410K+', label: 'fallos indexados' },
  { num: '< 2hs', label: 'detección de novedades' },
  { num: 'PJN+SCBA', label: 'portales monitoreados' },
  { num: 'Sin permanencia', label: 'cancelas cuando querés' },
]

const usecases = [
  {
    title: 'Estudio unipersonal',
    desc: 'Un solo abogado con 20-50 causas activas. Plan recomendado: Suite Jurídica Abogado ($39.000/mes con 30% off).',
  },
  {
    title: 'Estudio mediano (2-5 abogados)',
    desc: '50-200 causas, varios usuarios, necesidad de coordinación. Plan recomendado: Suite Jurídica Profesional ($69.000/mes).',
  },
  {
    title: 'Estudio grande / cooperativa',
    desc: '200+ causas, múltiples usuarios, requisitos de auditoría. Plan recomendado: Suite Jurídica Estudio ($149.000/mes).',
  },
  {
    title: 'Abogado independiente recién recibido',
    desc: '5-15 causas, presupuesto ajustado. Plan recomendado: solo Monitoreo Básico ($19.000/mes) + JurisArgentina (gratis).',
  },
]

const faqs = [
  {
    q: '¿Qué portales judiciales monitorean?',
    a: 'PJN (Poder Judicial de la Nación) y SCBA (Suprema Corte de Buenos Aires). Detectamos novedades en tus causas y te enviamos notificación por email en menos de 2 horas. Para CABA y otras jurisdicciones provinciales, JurisArgentina indexa la jurisprudencia y resoluciones públicas.',
  },
  {
    q: '¿Es legal usar un sistema automático para acceder al portal del PJN?',
    a: 'Sí. El sistema usa tus credenciales legítimas (las que ya usás manualmente) para consultar tus propias causas. Es exactamente lo mismo que si vos entraras al portal — solo que automatizado. No hay scraping de cuentas ajenas ni acceso no autorizado.',
  },
  {
    q: '¿Mis credenciales del PJN/SCBA están seguras?',
    a: 'Sí. Se almacenan encriptadas con AES-256-GCM en una base de datos separada del resto del sistema. La clave de encriptación está en el servidor, no en el código. Solo el scraper las lee al momento de consultar tus causas.',
  },
  {
    q: '¿Cómo se cobra? ¿Hay permanencia?',
    a: 'Suscripción mensual via MercadoPago (preapproval recurrente). Sin permanencia, sin contratos, sin penalidad por baja. Cancelas cuando quieras desde tu panel y la baja se efectiviza al final del período pago.',
  },
  {
    q: '¿La facturación electrónica cumple con AFIP/ARCA?',
    a: 'Sí. El módulo está integrado directamente con ARCA (ex AFIP) usando el web service oficial. Emite Facturas A, B, C, Notas de Crédito y Débito según tu condición fiscal (Responsable Inscripto, Monotributista, Exento).',
  },
  {
    q: '¿Cuánto tarda en activarse?',
    a: 'Productos automáticos (monitoreo, causas, turnos): activación inmediata tras el pago. Suite Jurídica completa: 24-48 hs porque requiere setup de credenciales PJN/SCBA + ARCA. Te contactamos para coordinar.',
  },
  {
    q: '¿Funciona en cualquier provincia?',
    a: 'Sí. PJN cubre las 24 jurisdicciones federales (todo el país). SCBA cubre Buenos Aires Provincia. CABA, Córdoba, Santa Fe, Mendoza, etc. tienen sus portales propios — actualmente NO los monitoreamos automáticamente, pero JurisArgentina indexa la jurisprudencia pública nacional. Para necesidades específicas, contactanos.',
  },
  {
    q: '¿Puedo migrar mis causas actuales al sistema?',
    a: 'Sí. Tenemos un importador desde Excel/CSV con CUIL del cliente, número de causa y fuero. En menos de 30 min tenés todas tus causas cargadas y siendo monitoreadas.',
  },
  {
    q: '¿Qué pasa si tengo problemas técnicos un domingo?',
    a: 'Soporte por WhatsApp +54 9 11 7131-1465. Respondemos consultas en horario comercial (L-V 9-18 ART) y emergencias críticas fuera de horario (sistema caído, error que bloquea trabajo).',
  },
]

export default function AutomatizacionAbogadosPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Scale className="w-4 h-4" /> Automatización para abogados — Argentina
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Software para abogados<br />y estudios jurídicos
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-xl leading-relaxed"
            >
              7 productos integrados para gestionar tu estudio: monitoreo PJN/SCBA, dashboard de causas, facturación ARCA, jurisprudencia con IA, secretaria virtual y más. Construido por abogados, para abogados argentinos.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#productos">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-blue-700 hover:bg-white/90 font-bold text-base px-8">
                  Ver los 7 productos <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register?next=suite-juridica">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Empezar Suite Jurídica <ChevronDown className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-surface-50 border-b border-surface-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-blue-700">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Productos */}
      <section id="productos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Nuestra suite</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              7 productos para tu estudio jurídico
            </h2>
            <p className="text-surface-500">
              Activá los que necesites o llevá la <Link href="#suite" className="text-blue-700 font-semibold hover:underline">Suite Jurídica completa</Link> con descuento.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productos.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  <div className={`bg-gradient-to-br ${p.color} h-2`} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-surface-900 mb-2">{p.name}</h3>
                    <p className="text-sm text-surface-500 leading-relaxed mb-4 flex-1">{p.desc}</p>
                    <div className="mb-4">
                      {p.priceLabel ? (
                        <p className="text-2xl font-extrabold text-surface-900">{p.priceLabel}</p>
                      ) : (
                        <>
                          <span className="text-xs text-surface-400">Desde</span>
                          <p className="text-2xl font-extrabold text-surface-900">
                            ${p.priceFrom.toLocaleString('es-AR')}<span className="text-sm text-surface-400 font-normal">/mes</span>
                          </p>
                        </>
                      )}
                    </div>
                    {p.external ? (
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:gap-2.5 transition-all">
                        Acceder a JurisArgentina <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link href={p.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:gap-2.5 transition-all">
                        Activar producto <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Suite Juridica destacada */}
      <section id="suite" className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-3">Combo recomendado</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Suite Jurídica completa</h2>
            <p className="text-white/85 text-lg max-w-xl mx-auto">
              Todos los productos esenciales en un único plan, con hasta 38% de descuento sobre la suma individual.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-white/70 text-sm uppercase tracking-wider mb-2">Plan Abogado</p>
              <p className="text-3xl font-extrabold mb-1">$39.000<span className="text-base font-normal opacity-70">/mes</span></p>
              <p className="text-sm text-white/60 line-through mb-4">$56.000/mes</p>
              <ul className="space-y-1.5 mb-6 text-sm">
                {suiteFeatures.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />{f}</li>
                ))}
              </ul>
              <Link href="/register?next=suite-juridica&plan=abogado">
                <Button variant="secondary" className="w-full bg-white text-blue-700 hover:bg-white/90 font-bold">Empezar</Button>
              </Link>
            </div>
            <div className="bg-white text-surface-900 rounded-2xl p-6 ring-4 ring-white/30 transform sm:scale-105 shadow-2xl">
              <div className="inline-block bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full mb-2">Más elegido</div>
              <p className="text-surface-500 text-sm uppercase tracking-wider mb-2">Plan Profesional</p>
              <p className="text-3xl font-extrabold mb-1">$69.000<span className="text-base font-normal text-surface-400">/mes</span></p>
              <p className="text-sm text-surface-400 line-through mb-4">$112.000/mes</p>
              <ul className="space-y-1.5 mb-6 text-sm">
                {suiteFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />{f}</li>
                ))}
              </ul>
              <Link href="/register?next=suite-juridica&plan=profesional">
                <Button variant="gradient" className="w-full font-bold">Empezar Profesional</Button>
              </Link>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-white/70 text-sm uppercase tracking-wider mb-2">Plan Estudio</p>
              <p className="text-3xl font-extrabold mb-1">$149.000<span className="text-base font-normal opacity-70">/mes</span></p>
              <p className="text-sm text-white/60 line-through mb-4">$230.000/mes</p>
              <ul className="space-y-1.5 mb-6 text-sm">
                {suiteFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />{f}</li>
                ))}
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />Multi-usuario (5 cuentas)</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />Soporte dedicado</li>
              </ul>
              <Link href="/register?next=suite-juridica&plan=estudio">
                <Button variant="secondary" className="w-full bg-white text-blue-700 hover:bg-white/90 font-bold">Empezar</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Para vos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">
              ¿Qué plan recomendamos según tu estudio?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {usecases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-100"
              >
                <h3 className="font-bold text-surface-900 mb-2">{uc.title}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seguridad */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-blue-700" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Seguridad y privacidad
            </h2>
            <p className="text-surface-500">
              Tus credenciales del PJN/SCBA y datos de causas son sensibles. Lo tratamos como tal.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-8 space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-surface-900">Encriptación AES-256-GCM</p>
                <p className="text-sm text-surface-600">Credenciales encriptadas en DB con clave separada del código.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-surface-900">Acceso solo a tus causas</p>
                <p className="text-sm text-surface-600">Usamos tus credenciales legítimas para consultar tus propias causas. Nada de scraping de cuentas ajenas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-surface-900">HTTPS + HSTS preload</p>
                <p className="text-sm text-surface-600">Toda la comunicación encriptada en tránsito. Cumplimiento de buenas prácticas web.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-surface-900">Datos en Argentina</p>
                <p className="text-sm text-surface-600">Servidor en Buenos Aires (Hostinger). No salen del país.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-surface-900">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details key={f.q} className="bg-surface-50 rounded-xl p-5 border border-surface-100 group">
                <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between gap-2">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-surface-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-sm text-surface-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Scale className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Concentrate en litigar. Lo demás lo hacemos nosotros.
          </h2>
          <p className="text-white/85 text-lg mb-8">
            7 productos integrados, una sola plataforma, sin permanencia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?next=suite-juridica">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-blue-700 hover:bg-white/90 font-bold text-base px-8">
                Empezar Suite Jurídica <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
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
