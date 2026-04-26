import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Implementacion Premium | Sistemas a medida | Automatic IA Lab',
  description:
    'Implementacion asistida de sistemas completos: Pipeline IG multi-agente, Avatar IA Influencer, ERP Indumentaria con Tiendanube y Suite Juridica White-Label. Desde $1.200.000 ARS.',
  keywords: [
    'implementacion premium argentina',
    'sistema a medida',
    'erp indumentaria argentina',
    'erp tiendanube a medida',
    'avatar ia influencer',
    'pipeline instagram automatico',
    'saas white label argentina',
    'suite juridica white label',
    'desarrollo software a medida argentina',
    'consultor IA argentina',
  ],
  alternates: { canonical: 'https://automaticialab.com/premium' },
  openGraph: {
    title: 'Premium · Implementacion asistida | Automatic IA Lab',
    description:
      '4 sistemas completos para negocios que necesitan mas que una suscripcion. Implementacion 100% manual + capacitacion + soporte post-launch.',
    type: 'website',
    url: 'https://automaticialab.com/premium',
    images: [{ url: 'https://automaticialab.com/og-image.png', width: 1200, height: 630, alt: 'Premium · Automatic IA Lab' }],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      name: 'Implementacion Premium · Sistemas a medida',
      description:
        '4 productos premium con implementacion manual: Canal de Noticias multi-agente, Avatar IA Influencer, ERP Indumentaria, Suite Juridica White-Label.',
      provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
      areaServed: { '@type': 'Country', name: 'Argentina' },
      serviceType: 'Software development & implementation',
      url: 'https://automaticialab.com/premium',
      offers: [
        {
          '@type': 'Offer',
          name: 'Canal de Noticias multi-agente',
          price: '1200000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Pipeline n8n con investigador + redactor + imagen IA + publicacion IG + WhatsApp.',
        },
        {
          '@type': 'Offer',
          name: 'Avatar IA Influencer',
          price: '1800000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Avatar IA + bot Telegram + ComfyUI + reels + overlay productos reales.',
        },
        {
          '@type': 'Offer',
          name: 'ERP para Indumentaria',
          price: '2400000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'Stock multi-sucursal + Tiendanube sync + ARCA + dashboard ventas.',
        },
        {
          '@type': 'Offer',
          name: 'Suite Juridica White-Label',
          price: '3500000',
          priceCurrency: 'ARS',
          priceValidUntil: '2027-12-31',
          availability: 'https://schema.org/InStock',
          description: 'SaaS multi-tenant para revender a estudios juridicos bajo tu marca.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Por que cuesta tanto?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cada producto requiere entre 100 y 400 horas de trabajo profesional. Comparado con contratar un equipo (1 dev full-time = $1.5M-$2.5M/mes), implementar con nosotros sale entre 5 y 10 veces mas barato.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quien es el dueno del codigo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vos. Te entregamos codigo fuente completo + documentacion + acceso al servidor. Sin vendor lock-in.',
          },
        },
        {
          '@type': 'Question',
          name: 'Necesito tener equipo tecnico para usarlo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Nosotros operamos y mantenemos. Vos solo operas el front del sistema y te capacitamos.',
          },
        },
      ],
    },
  ],
}

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        id="premium-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
