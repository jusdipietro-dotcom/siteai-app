import { JsonLd } from './JsonLd'

export function FaqSchema() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué tipos de proyectos hacen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cuatro pilares: inteligencia artificial aplicada (chatbots, agentes autónomos, automatización con LLMs), marketing digital (Meta Ads, Google Ads, contenido), diseño web a medida y posicionamiento SEO. Cada proyecto se cotiza según alcance.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo es el proceso de contratación?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tres pasos. Primero diagnóstico técnico (USD 300-700, 5-10 días). Después implementación a medida (USD 1.500-5.000, 15-45 días, descuenta el diagnóstico). Finalmente mantenimiento opcional (USD 200-500/mes, sin permanencia).',
        },
      },
      {
        '@type': 'Question',
        name: '¿Por qué cobran el diagnóstico?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Porque requiere 5-15 horas de trabajo profesional (relevamiento + arquitectura + documentación de 15-30 páginas). El documento es tuyo. Si avanzás con la implementación, descontamos el 100% del diagnóstico.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cobran en pesos o en USD?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cobramos en USD por estabilidad pero aceptamos pago en pesos al MEP/CCL del día. Aceptamos transferencia, MercadoPago o crypto (USDT/USDC). 50% al arrancar, 30% a mitad, 20% contra entrega.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hay permanencia en el mantenimiento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Trabajamos mes a mes. Si decidís cortar, nos avisás con 30 días y te entregamos toda la documentación, accesos y aprendizajes. Sin penalidad.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Quién es dueño del código y los activos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vos. Te entregamos código fuente, documentación, acceso al servidor y cuentas de ads bajo tu nombre. Sin vendor lock-in.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Trabajan con cualquier rubro?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, pero somos especialistas en estudios jurídicos (suite con monitoreo PJN/SCBA), e-commerce de indumentaria, gastronomía, clínicas, inmobiliarias, servicios B2B y profesionales independientes.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto tarda en estar listo un proyecto?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Diagnóstico: 5-10 días. Implementación según tipo: landing simple 5-7 días, sitio institucional 10-15 días, tienda online 15-25 días, sistema con IA 4-8 semanas, integración compleja 8-12 semanas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo es el soporte?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Soporte directo por WhatsApp y email. Sin bots ni tickets. Respondemos consultas en horario L-V 9-18 ART y emergencias críticas fuera de horario.',
        },
      },
    ],
  }

  return <JsonLd data={faqSchema} />
}
