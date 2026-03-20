import { JsonLd } from './JsonLd'

export function FaqSchema() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Necesito saber programar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, solo completás un formulario con la información de tu negocio y nuestra IA genera tu sitio web automáticamente.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto tarda en generarse?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Menos de 60 segundos. Tu sitio web profesional estará listo en poco tiempo.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Dónde se publica?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En GitHub Pages con URL propia. Tu sitio es completamente tuyo y está disponible en internet.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo usar mi dominio?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, puedes usar tu dominio personalizado con configuración DNS. Te guiaremos en el proceso.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Incluye WhatsApp?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, tu sitio incluye un botón integrado de WhatsApp para que tus clientes te contacten directamente.',
        },
      },
      {
        '@type': 'Question',
        name: '¿La IA genera el contenido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, la IA genera textos optimizados para SEO basados en la información que proporcionas de tu negocio.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué pasa si cancelo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tu sitio sigue publicado en el plan free. No pierdes tu sitio, solo pierdes acceso a funcionalidades premium.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Es gratis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, tenemos un plan gratuito con funcionalidades básicas. También ofrecemos planes premium con más características.',
        },
      },
    ],
  }

  return <JsonLd data={faqSchema} />
}
