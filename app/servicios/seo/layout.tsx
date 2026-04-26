import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Posicionamiento SEO en Google | Automatic IA Lab',
  description:
    'Servicio profesional de SEO en Argentina: SEO tecnico, local y organico. Auditorias completas, optimizacion on-page, link building white hat. Sin permanencia. Desde $45.000/mes.',
  keywords: [
    'seo argentina',
    'posicionamiento web argentina',
    'agencia seo buenos aires',
    'seo local argentina',
    'consultor seo argentina',
    'seo google maps',
    'auditoria seo',
    'seo tecnico argentina',
    'link building argentina',
    'seo para abogados',
    'seo para ecommerce',
    'seo precios argentina',
  ],
  alternates: { canonical: 'https://automaticialab.com/servicios/seo' },
  openGraph: {
    title: 'Posicionamiento SEO | Automatic IA Lab',
    description:
      'SEO profesional en Argentina. Aparece primero cuando tu cliente te busca. Sin humo, sin permanencia, sin promesas falsas.',
    type: 'website',
    url: 'https://automaticialab.com/servicios/seo',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'SEO — Automatic IA Lab' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Posicionamiento SEO',
      description:
        'Servicio profesional de SEO en Argentina: tecnico, local y organico. Sin permanencia. Reportes mensuales transparentes.',
      provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'SEO',
      url: 'https://automaticialab.com/servicios/seo',
      offers: [
        {
          '@type': 'Offer',
          name: 'Auditoria SEO',
          price: '80000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Diagnostico completo + plan de accion. Pago unico, sin compromiso mensual.',
        },
        {
          '@type': 'Offer',
          name: 'SEO Local',
          price: '45000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Google Business Profile, reviews, citas locales, optimizacion para "near me".',
        },
        {
          '@type': 'Offer',
          name: 'SEO Organico',
          price: '90000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Posicionamiento integral con contenido, on-page, autoridad y reportes mensuales.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'En cuanto tiempo voy a ver resultados?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cambios tecnicos se ven en 2-4 semanas. Posicionamiento real (top 10) demora 3-6 meses. Top 3 puede tardar 6-12 meses dependiendo de la competencia.',
          },
        },
        {
          '@type': 'Question',
          name: 'Pueden garantizarme el #1 en Google?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nadie puede garantizar posiciones especificas porque Google es quien decide. Lo que si garantizamos es trabajo profesional, transparente y medible.',
          },
        },
        {
          '@type': 'Question',
          name: 'Hay permanencia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sin permanencia. Trabajamos mes a mes. Si decidis cortar, nos avisas con 30 dias y te entregamos toda la documentacion.',
          },
        },
      ],
    },
  ],
}

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="seo-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
