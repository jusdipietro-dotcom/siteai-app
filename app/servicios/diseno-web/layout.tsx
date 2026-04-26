import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Diseno Web a Medida en Argentina | Automatic IA Lab',
  description:
    'Diseno y desarrollo de paginas web a medida con Next.js + Tailwind. Landing pages, sitios institucionales y tiendas online. Codigo propio, mobile-first, listo para Google. Desde $180.000 ARS.',
  keywords: [
    'diseno web argentina',
    'diseno paginas web buenos aires',
    'desarrollo web a medida',
    'diseno landing page argentina',
    'tienda online a medida',
    'diseno web profesional',
    'web nextjs argentina',
    'pagina web responsive',
    'diseno web mobile first',
    'desarrollo web pesos argentinos',
    'agencia diseno web argentina',
    'web design argentina',
  ],
  alternates: { canonical: 'https://automaticialab.com/servicios/diseno-web' },
  openGraph: {
    title: 'Diseno Web a Medida | Automatic IA Lab',
    description:
      'Sitios web profesionales a medida con codigo propio, diseno unico y carga ultra rapida. Sin templates. Sin WordPress.',
    type: 'website',
    url: 'https://automaticialab.com/servicios/diseno-web',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Diseno Web — Automatic IA Lab' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Diseno y desarrollo de paginas web',
      description:
        'Servicio de diseno y desarrollo web a medida en Argentina. Landing pages, sitios institucionales y tiendas online con Next.js + Tailwind.',
      provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'Diseno Web',
      url: 'https://automaticialab.com/servicios/diseno-web',
      offers: [
        {
          '@type': 'Offer',
          name: 'Landing Page',
          price: '180000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Una pagina con scroll, hasta 6 secciones, mobile-first, formulario y WhatsApp.',
        },
        {
          '@type': 'Offer',
          name: 'Sitio Institucional',
          price: '350000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Hasta 8 paginas, blog editable, SEO on-page, hosting y dominio incluidos.',
        },
        {
          '@type': 'Offer',
          name: 'Tienda Online',
          price: '650000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'E-commerce completo con MercadoPago, panel admin y opcion de sincronizacion con Tiendanube.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Cuanto tarda en estar lista mi web?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Una landing page tarda entre 5 y 7 dias habiles. Un sitio institucional entre 10 y 15. Una tienda online entre 15 y 25 dias.',
          },
        },
        {
          '@type': 'Question',
          name: 'Trabajan con WordPress?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Usamos Next.js y Tailwind, que son la tecnologia mas moderna y rapida del mercado. Sitios estaticos cargan 5x mas rapido que WordPress y son mas seguros.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como cobran?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '50% al arrancar y 50% contra entrega. Aceptamos MercadoPago, transferencia o efectivo. Tambien planes en cuotas con tarjeta.',
          },
        },
      ],
    },
  ],
}

export default function DisenoWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="diseno-web-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
