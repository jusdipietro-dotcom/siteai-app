import type { Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Email Marketing Automatizado | Automatic IA Lab',
  description: 'Enviá emails promocionales personalizados a todos tus contactos de forma automática. Sin Mailchimp, sin dólares. Anti-spam integrado, desuscripción automática y seguimiento en tiempo real. Desde $15.000/mes en pesos argentinos.',
  keywords: [
    'email marketing automatizado',
    'email marketing argentina',
    'alternativa mailchimp argentina',
    'email marketing pesos argentinos',
    'email marketing sin dolares',
    'email masivo automatico',
    'email marketing para pymes',
    'email marketing tiendanube',
    'enviar emails masivos',
    'automatic ia lab email marketing',
    'email marketing profesional',
    'email marketing automatico buenos aires',
  ],
  openGraph: {
    title: 'Email Marketing Automatizado | Automatic IA Lab',
    description: 'Enviá emails promocionales personalizados a toda tu base de contactos. Automático, profesional, en pesos argentinos.',
    type: 'website',
    url: 'https://automaticialab.com/servicios/email-marketing',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'Email Marketing Automatizado',
      description: 'Sistema de email marketing automatizado con anti-spam, desuscripción automática y seguimiento en tiempo real.',
      brand: { '@type': 'Brand', name: 'Automatic IA Lab' },
      url: 'https://automaticialab.com/servicios/email-marketing',
      offers: [
        {
          '@type': 'Offer',
          name: 'Plan Básico',
          price: '15000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: '1 campaña, hasta 5.000 contactos, Gmail como remitente',
        },
        {
          '@type': 'Offer',
          name: 'Plan Profesional',
          price: '25000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: '3 campañas, hasta 20.000 contactos, Gmail + Workspace',
        },
        {
          '@type': 'Offer',
          name: 'Plan Premium',
          price: '45000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Campañas ilimitadas, hasta 100.000 contactos, onboarding asistido',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Los emails caen en spam?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. El sistema usa técnicas anti-spam profesionales: envío a ritmo controlado, personalización por nombre, templates optimizados y link de desuscripción en cada email.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuántos emails por día puedo enviar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Con Gmail gratuito: hasta 360 por día. Con Google Workspace: hasta 1.440 por día.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Necesito saber de tecnología?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Nosotros configuramos todo. Vos solo nos pasás los contactos y el contenido.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Es legal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, siempre que tus contactos hayan dado consentimiento. Cada email incluye opción de desuscripción, como exige la ley.',
          },
        },
      ],
    },
  ],
}

export default function EmailMarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          { name: 'Servicios', url: 'https://automaticialab.com/#servicios' },
          { name: 'Email Marketing', url: 'https://automaticialab.com/servicios/email-marketing' },
        ]}
      />
      <Script
        id="email-marketing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
