import type { Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Implementación de Inteligencia Artificial para tu Negocio',
  description:
    'Agencia de IA en Argentina. Chatbots, agentes autónomos, automatización con n8n y LLMs, asistentes virtuales. Diagnóstico desde USD 300, implementación desde USD 1.500.',
  keywords: [
    'agencia de inteligencia artificial argentina',
    'implementación de IA',
    'chatbot con IA',
    'agentes autónomos',
    'automatización con LLM',
    'asistente virtual con IA',
    'consultoría IA argentina',
    'desarrollo IA a medida',
    'integración OpenAI Anthropic',
    'workflow IA n8n',
  ],
  alternates: { canonical: 'https://automaticialab.com/servicios/inteligencia-artificial' },
  openGraph: {
    title: 'Inteligencia Artificial aplicada a tu negocio | Automatic IA Lab',
    description:
      'Agencia argentina especializada en IA. Implementamos chatbots, agentes autónomos, automatizaciones con LLMs y workflows IA personalizados.',
    type: 'website',
    url: 'https://automaticialab.com/servicios/inteligencia-artificial',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'IA — Automatic IA Lab' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Implementación de Inteligencia Artificial',
      description:
        'Servicios de consultoría y desarrollo de soluciones IA: chatbots, agentes autónomos, automatización con LLMs (OpenAI, Anthropic), workflows con n8n.',
      provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'AI Consulting & Development',
      url: 'https://automaticialab.com/servicios/inteligencia-artificial',
      offers: [
        {
          '@type': 'Offer',
          name: 'Diagnóstico inicial IA',
          price: '300',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Reunión + relevamiento + arquitectura propuesta + documento. Desde USD 300.',
        },
        {
          '@type': 'Offer',
          name: 'Implementación IA',
          price: '1500',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Desarrollo + integraciones + testing + capacitación. Desde USD 1.500.',
        },
        {
          '@type': 'Offer',
          name: 'Mantenimiento mensual',
          price: '200',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Soporte técnico + actualizaciones + mejoras. Desde USD 200/mes.',
        },
      ],
    },
  ],
}

export default function IALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          { name: 'Servicios', url: 'https://automaticialab.com/#servicios' },
          { name: 'Inteligencia Artificial', url: 'https://automaticialab.com/servicios/inteligencia-artificial' },
        ]}
      />
      <Script
        id="ia-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
