import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title:
    'AlertaJudicial — Monitoreo automatico PJN + SCBA por email',
  description:
    'Nunca mas pierdas un plazo judicial. AlertaJudicial revisa los portales judiciales argentinos por vos y te manda el texto completo de cada proveido. Desde $15.000 ARS/mes. 60 dias gratis.',
  keywords: [
    'alertajudicial',
    'notificaciones judiciales argentina',
    'monitoreo pjn',
    'monitoreo scba',
    'alertas judiciales por email',
    'automatizacion abogados argentina',
    'portal pjn alerta',
    'portal scba notificaciones',
    'saas abogados argentina',
    'control de plazos judiciales',
  ],
  alternates: { canonical: 'https://automaticialab.com/alertajudicial' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Automatic IA Lab',
    title: 'AlertaJudicial — Monitoreo PJN + SCBA por email',
    description:
      'Cada proveido, directo a tu email. Monitoreo automatico de los portales judiciales argentinos. Desde $15.000/mes con 60 dias gratis.',
    url: 'https://automaticialab.com/alertajudicial',
    images: [
      {
        url: 'https://automaticialab.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AlertaJudicial · Monitoreo PJN + SCBA por email',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlertaJudicial — Monitoreo PJN + SCBA por email',
    description:
      'Cada proveido, directo a tu email. Monitoreo automatico de los portales judiciales argentinos.',
    images: ['https://automaticialab.com/og-image.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'AlertaJudicial',
      description:
        'SaaS de monitoreo automatizado de notificaciones judiciales argentinas (PJN + SCBA) con entrega del texto completo del proveido por email.',
      provider: {
        '@type': 'Organization',
        name: 'Automatic IA Lab',
        url: 'https://automaticialab.com',
      },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'Legal tech / Judicial notifications SaaS',
      url: 'https://automaticialab.com/alertajudicial',
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Basico',
          price: '15000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: '1 CUIT, 1 portal (PJN o SCBA), 6 revisiones/dia.',
        },
        {
          '@type': 'Offer',
          name: 'Plan Profesional',
          price: '35000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description:
            'Hasta 5 CUIT, PJN + SCBA, 3 destinatarios, horarios custom, soporte prioritario.',
        },
        {
          '@type': 'Offer',
          name: 'Plan Estudio',
          price: '75000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description:
            'CUIT ilimitados, todos los portales, destinatarios ilimitados, API REST, onboarding personalizado.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Es legal automatizar el acceso a portales judiciales?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Si. El sistema accede con tus credenciales legitimas, de la misma forma que lo harias vos manualmente. No se vulnera ningun sistema ni se accede a informacion de terceros.',
          },
        },
        {
          '@type': 'Question',
          name: 'Mis credenciales estan seguras?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Se almacenan encriptadas en servidores propios. No usamos servicios de terceros para almacenarlas. El acceso es exclusivamente interno y automatizado.',
          },
        },
        {
          '@type': 'Question',
          name: 'Puedo cancelar en cualquier momento?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Si. No hay contratos de permanencia. La cancelacion es efectiva al final del periodo facturado. Los primeros 60 dias son gratis.',
          },
        },
      ],
    },
  ],
}

export default function AlertaJudicialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        id="alertajudicial-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
