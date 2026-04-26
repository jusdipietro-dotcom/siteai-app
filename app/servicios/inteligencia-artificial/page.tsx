'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import {
  Brain, Bot, MessageSquare, Workflow, Zap, Shield,
  ArrowRight, Check, ChevronDown, Search, Hammer, RefreshCw,
} from 'lucide-react'

const WA_LINK =
  'https://wa.me/5491171311465?text=Hola%2C%20quiero%20info%20sobre%20implementaci%C3%B3n%20de%20IA'

const useCases = [
  {
    icon: Bot,
    name: 'Chatbots con IA',
    desc: 'Asistentes inteligentes en tu web o WhatsApp que responden consultas, derivan casos, agendan turnos y capturan leads. Conectados con tu base de datos y CRM.',
    examples: 'Cascada Groq → Claude → Gemini · Memoria conversacional · Multi-idioma',
  },
  {
    icon: MessageSquare,
    name: 'Agentes autónomos',
    desc: 'Sistemas que toman decisiones multi-paso, ejecutan herramientas, leen/escriben en sistemas externos. Útiles para soporte, ventas, operaciones.',
    examples: 'Tool calling · ReAct · Multi-agent orchestration · Estado persistente',
  },
  {
    icon: Workflow,
    name: 'Automatización con LLMs',
    desc: 'Workflows en n8n combinados con LLMs para procesar emails, generar contenido, clasificar tickets, analizar documentos, traducir audios.',
    examples: 'n8n + OpenAI / Anthropic · OCR + IA · Speech-to-text',
  },
  {
    icon: Brain,
    name: 'Asistentes verticales',
    desc: 'Asistentes especializados por industria: jurídico (jurisprudencia, redacción de escritos), médico (anamnesis), ventas (cotizaciones), HR (reclutamiento).',
    examples: 'RAG con tu data · Fine-tuning · Embeddings + Pinecone',
  },
  {
    icon: Zap,
    name: 'Integración con tus sistemas',
    desc: 'Conectamos IA con tu stack actual: CRM, ERP, e-commerce, base de datos, APIs internas. La IA usa lo que ya tenés, no te hacemos migrar.',
    examples: 'Tiendanube · ARCA · MercadoPago · Google Workspace',
  },
  {
    icon: Shield,
    name: 'Cumplimiento y seguridad',
    desc: 'Implementamos con foco en privacidad: datos en Argentina, encriptación, auditoría de prompts, prevención de jailbreaks.',
    examples: 'AES-256 · Logs auditables · Filtros de contenido',
  },
]

const stack = [
  { label: 'OpenAI', desc: 'GPT-4, GPT-4o, embeddings' },
  { label: 'Anthropic Claude', desc: 'Claude Sonnet/Opus, tool use' },
  { label: 'Google Gemini', desc: 'Gemini 2.5 Flash, multimodal' },
  { label: 'Groq', desc: 'Inferencia ultrarrápida (Llama)' },
  { label: 'n8n', desc: 'Orquestación visual de workflows' },
  { label: 'LangChain / LangGraph', desc: 'Agentes y RAG' },
  { label: 'Pinecone / Weaviate', desc: 'Bases vectoriales' },
  { label: 'Replicate / Stable Horde', desc: 'Generación de imágenes' },
]

const proceso = [
  { num: '1', icon: Search, title: 'Diagnóstico técnico', price: 'USD 300 - 700', desc: 'Auditoría de procesos + arquitectura IA propuesta + documento de 15-30 páginas. Tuyo, lo uses con nosotros o no.' },
  { num: '2', icon: Hammer, title: 'Implementación', price: 'USD 1.500 - 5.000', desc: 'Desarrollo + integraciones + testing + capacitación. Avances semanales por video. Descuento del diagnóstico aplicado.' },
  { num: '3', icon: RefreshCw, title: 'Mantenimiento', price: 'USD 200 - 500/mes', desc: 'Soporte + actualizaciones + ajustes. Sin permanencia. Recomendado para sistemas en producción.' },
]

const faqs = [
  {
    q: '¿Qué tipos de proyectos de IA hacen?',
    a: 'Cualquier proyecto que requiera IA aplicada al negocio: chatbots, agentes autónomos, automatización con LLMs, asistentes verticales (jurídico/médico/ventas), análisis de documentos con IA, generación de contenido, OCR + IA, transcripción y traducción. Si tu caso no está, contanos: probablemente lo podemos.',
  },
  {
    q: '¿Trabajan con OpenAI, Anthropic o ambos?',
    a: 'Ambos, y también Google Gemini, Groq (Llama), DeepSeek y modelos open source. Elegimos el modelo según el caso: a veces conviene Claude por contexto largo, a veces Groq por velocidad, a veces GPT-4o por multimodalidad. Lo recomendamos en el diagnóstico.',
  },
  {
    q: '¿Mis datos son seguros? ¿Se usan para entrenar modelos?',
    a: 'No. Usamos los modos enterprise/business de las APIs (OpenAI Business, Anthropic Workspaces, Google Cloud Vertex) que NO usan tus datos para entrenar. Encriptamos credenciales con AES-256. Si necesitás 100% on-premise, podemos usar modelos open source desplegados en tu infraestructura.',
  },
  {
    q: '¿Cuánto tarda en estar listo?',
    a: 'Diagnóstico: 5-10 días. Implementación: depende del alcance. Casos típicos: chatbot web 2-3 semanas, agente autónomo 4-6 semanas, sistema RAG con tu documentación 6-8 semanas, asistente vertical 8-12 semanas.',
  },
  {
    q: '¿Quién es el dueño del código?',
    a: 'Vos. Te entregamos código fuente + documentación + acceso al servidor. Sin vendor lock-in. Si decidís discontinuar el contrato, te llevás todo y podés operarlo internamente o con otra agencia.',
  },
  {
    q: '¿Cómo se cobra? ¿En USD o pesos?',
    a: 'Cobramos en USD por estabilidad pero aceptamos pago en pesos al tipo de cambio MEP/CCL del día. Aceptamos transferencia bancaria, MercadoPago o crypto (USDT/USDC). 50% al arrancar, 30% a mitad, 20% contra entrega.',
  },
]

export default function IAServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-700 text-white py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <Brain className="w-4 h-4" /> Servicio de agencia
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Inteligencia Artificial<br />aplicada a tu negocio
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 mb-8 max-w-2xl leading-relaxed"
            >
              Implementamos chatbots, agentes autónomos, automatizaciones con LLMs y asistentes verticales personalizados. Desde el diagnóstico hasta el mantenimiento, todo con un equipo argentino especializado.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#cotizar">
                <Button variant="secondary" size="lg" className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-bold text-base px-8">
                  Solicitar diagnóstico <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#casos">
                <Button variant="outline" size="lg" className="gap-2 border-white/40 text-white hover:bg-white/10 font-medium">
                  Ver casos de uso <ChevronDown className="w-4 h-4" />
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
            { num: '5-10d', label: 'diagnóstico' },
            { num: '15-60d', label: 'implementación' },
            { num: '100%', label: 'código propio entregado' },
            { num: 'USD', label: 'tarifas estables' },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-3xl font-extrabold text-violet-700">{s.num}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section id="casos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Qué implementamos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4">
              Casos de uso de IA aplicada
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((u, i) => {
              const Icon = u.icon
              return (
                <motion.div
                  key={u.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:shadow-lg transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-2">{u.name}</h3>
                  <p className="text-sm text-surface-600 leading-relaxed mb-3">{u.desc}</p>
                  <p className="text-xs text-violet-600 font-medium border-t border-surface-200 pt-3">
                    {u.examples}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Stack técnico</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">Tecnologías que dominamos</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stack.map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-surface-100 text-center">
                <p className="font-bold text-surface-900 text-sm">{s.label}</p>
                <p className="text-xs text-surface-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Cómo trabajamos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900">3 pasos del diagnóstico al producto vivo</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {proceso.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface-50 rounded-2xl p-6 border border-surface-100"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-extrabold mb-4">
                    {p.num}
                  </div>
                  <Icon className="w-5 h-5 text-violet-600 mb-2" />
                  <h3 className="font-bold text-surface-900 mb-1">{p.title}</h3>
                  <p className="text-violet-700 font-extrabold text-lg mb-2">{p.price}</p>
                  <p className="text-sm text-surface-600 leading-relaxed">{p.desc}</p>
                </motion.div>
              )
            })}
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
      <section id="cotizar" className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-wider mb-3">Solicitar diagnóstico</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-3">
              Hablemos de tu proyecto IA
            </h2>
            <p className="text-surface-500">
              Reunión inicial gratis de 30 min. Te respondemos en menos de 24 horas.
            </p>
          </div>
          <InquiryForm
            service="custom"
            source="/servicios/inteligencia-artificial"
            accentClass="bg-violet-600 hover:bg-violet-700"
            budgetOptions={[
              'USD 300-700 — solo diagnóstico',
              'USD 1.500-3.000 — proyecto chico',
              'USD 3.000-5.000 — proyecto mediano',
              'USD 5.000+ — proyecto grande',
              'Necesito asesoramiento',
            ]}
            description="Contanos qué proceso querés mejorar con IA y armamos una propuesta concreta. El diagnóstico inicial cuesta USD 300-700 y se descuenta de la implementación si avanzás."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            ¿Tu negocio está listo para IA?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Empezamos con un diagnóstico técnico de USD 300-700. Hablemos.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#cotizar">
              <Button variant="secondary" size="lg" className="gap-2 bg-white text-violet-700 hover:bg-white/90 font-bold text-base px-8">
                Solicitar diagnóstico <ArrowRight className="w-4 h-4" />
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
