'use client'
import { motion } from 'framer-motion'

const faqs = [
  {
    q: 'Como empezamos a trabajar juntos?',
    a: 'Simple: nos escribis por WhatsApp y coordinamos una reunion inicial sin costo (por video o llamada). En esa reunion entendemos tu negocio, tu situacion y tus objetivos. Despues te enviamos una propuesta clara con alcance, plazos y costos.',
  },
  {
    q: 'Trabajan con negocios chicos o solo con empresas grandes?',
    a: 'Trabajamos con todo tipo de negocios: profesionales independientes, PyMEs, estudios juridicos, comercios, e-commerces y empresas medianas. Lo que importa es que haya un problema concreto para resolver y voluntad de invertir en una solucion profesional.',
  },
  {
    q: 'Que pasa si no estoy seguro de que servicio necesito?',
    a: 'Justamente para eso esta la reunion inicial. Te ayudamos a diagnosticar la situacion, identificamos donde estan las oportunidades y te recomendamos por donde conviene empezar. Sin compromiso de avanzar.',
  },
  {
    q: 'Cuanto tarda una implementacion?',
    a: 'Depende del alcance. Un sitio web puede estar listo en 2 a 4 semanas, una automatizacion sencilla en pocos dias, y proyectos mas complejos pueden llevar 1 a 3 meses. En el diagnostico te damos plazos concretos.',
  },
  {
    q: 'Hace falta firmar un contrato de permanencia?',
    a: 'No. Trabajamos sin contratos de permanencia. Si en algun momento la solucion no esta funcionando como esperabas, lo conversamos y ajustamos, o cerramos. Vos decidis hasta cuando.',
  },
  {
    q: 'Pueden integrar con los sistemas que ya uso?',
    a: 'Si. Trabajamos con todo tipo de integraciones: WhatsApp Business, MercadoPago, Google Workspace, CRMs (HubSpot, Pipedrive), e-commerce (Tiendanube, Shopify), ERPs, planillas de calculo, APIs propias y mucho mas.',
  },
  {
    q: 'Donde estan ubicados?',
    a: 'Somos una agencia argentina con base en Buenos Aires. Trabajamos remoto con clientes de todo el pais y la region. Atendemos en castellano y nos manejamos en USD o pesos segun el caso.',
  },
  {
    q: 'Como sigue el proyecto despues de implementado?',
    a: 'Te acompaniamos con soporte tecnico, actualizaciones, mejoras continuas y monitoreo proactivo. Comunicacion directa por WhatsApp con el equipo que implemento tu proyecto, sin tickets ni call centers.',
  },
  {
    q: 'Como hago para empezar?',
    a: 'Escribinos por WhatsApp con una breve descripcion de lo que necesitas. Te respondemos en menos de 24 horas para coordinar la primera reunion sin compromiso.',
  },
]

export function LandingFaq() {
  return (
    <section id="faq" className="py-24 bg-white scroll-mt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3"
          >
            Preguntas frecuentes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-surface-900 mb-4"
          >
            Lo que mas nos consultan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-surface-500"
          >
            Si tu pregunta no esta aca, escribinos por WhatsApp y te respondemos.
          </motion.p>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl p-5 border border-surface-100 group hover:border-surface-200 transition-colors"
            >
              <summary className="font-semibold text-surface-900 cursor-pointer flex items-center justify-between gap-4">
                {f.q}
                <span className="text-surface-400 group-open:rotate-45 transition-transform text-2xl leading-none shrink-0">
                  +
                </span>
              </summary>
              <p className="text-sm text-surface-600 leading-relaxed mt-3">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}
