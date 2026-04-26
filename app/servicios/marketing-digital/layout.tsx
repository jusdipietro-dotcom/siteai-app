import type { Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Marketing Digital y Performance — Meta Ads, Google Ads',
  description:
    'Agencia de marketing digital en Argentina. Meta Ads, Google Ads, contenido orgánico y análisis de métricas. Diagnóstico desde USD 300, gestión mensual desde USD 200.',
  keywords: [
    'agencia de marketing digital argentina',
    'meta ads argentina',
    'google ads argentina',
    'gestión de redes sociales',
    'performance marketing',
    'campañas facebook instagram',
    'pixel meta conversions api',
    'google analytics gtm',
    'contenido instagram linkedin',
    'agencia ads argentina',
  ],
  alternates: { canonical: 'https://automaticialab.com/servicios/marketing-digital' },
  openGraph: {
    title: 'Marketing Digital | Automatic IA Lab',
    description:
      'Estrategia + ejecución de Meta Ads, Google Ads, contenido orgánico y embudos. Reportes mensuales transparentes.',
    type: 'website',
    url: 'https://automaticialab.com/servicios/marketing-digital',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Marketing Digital — Automatic IA Lab' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Marketing Digital y Performance',
      description:
        'Agencia de marketing digital especializada en Meta Ads, Google Ads, gestión de redes y embudos de conversión.',
      provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'Digital Marketing',
      url: 'https://automaticialab.com/servicios/marketing-digital',
      offers: [
        {
          '@type': 'Offer',
          name: 'Diagnóstico de marketing',
          price: '300',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Auditoría de estrategia actual + plan + estructura de campañas. Desde USD 300.',
        },
        {
          '@type': 'Offer',
          name: 'Setup de campañas',
          price: '1500',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Pixel + CAPI + estructura cuenta + creativos + setup completo. Desde USD 1.500.',
        },
        {
          '@type': 'Offer',
          name: 'Gestión mensual',
          price: '200',
          priceCurrency: 'USD',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Optimización campañas + reportes + ajustes. Desde USD 200/mes.',
        },
      ],
    },
  ],
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          { name: 'Servicios', url: 'https://automaticialab.com/#servicios' },
          { name: 'Marketing Digital', url: 'https://automaticialab.com/servicios/marketing-digital' },
        ]}
      />
      <Script
        id="marketing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
