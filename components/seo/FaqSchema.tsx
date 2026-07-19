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
          text: 'No, solo completás un formulario con la información de tu negocio y armamos tu sitio web automáticamente con plantillas profesionales.',
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
          text: 'En nuestros servidores, con una URL pública propia y certificado SSL incluido. Con un plan pago podés además elegir tu propio subdominio.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo elegir mi dirección?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Con un plan pago podés elegir tu propio subdominio. Los dominios propios todavía no están disponibles.',
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
        name: '¿Quién escribe el contenido?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Los textos salen de la información que cargás sobre tu negocio y podés editarlos cuando quieras. Las imágenes sí se pueden generar con IA desde el editor.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué pasa si cancelo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tu proyecto y todo su contenido quedan guardados en tu cuenta y podés seguir editándolos. El sitio deja de estar online hasta que vuelvas a activar un plan.',
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
      {
        '@type': 'Question',
        name: '¿Qué es el Monitoreo Judicial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Es un servicio que revisa automáticamente los portales PJN y SCBA cada 2 horas y te envía por email las nuevas notificaciones con el texto completo del PDF. Ideal para abogados y estudios jurídicos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta el monitoreo judicial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Desde $19.000/mes por CUIT monitoreado en el plan Básico. También ofrecemos planes Profesional (3 CUITs, $35.000/mes) y Estudio (8 CUITs, $75.000/mes).',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué portales judiciales monitorean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Actualmente monitoreamos PJN (Poder Judicial de la Nación) y SCBA (Suprema Corte de Buenos Aires), con expansión planificada a otros portales durante 2026.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo funciona la Captación de Leads IA?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nuestro sistema busca automáticamente negocios reales en toda Argentina, extrae sus datos de contacto (email, teléfono, web) y valida cada email contra el dominio del negocio. Captura entre 50 y 150 leads únicos por día en tu Google Sheets, 24/7.',
        },
      },
    ],
  }

  return <JsonLd data={faqSchema} />
}
