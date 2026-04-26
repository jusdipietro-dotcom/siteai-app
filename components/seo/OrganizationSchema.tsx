import { JsonLd } from './JsonLd'

export function OrganizationSchema() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    // ProfessionalService is a subtype of LocalBusiness; valid for service-area
    // businesses (no physical storefront) like a digital agency.
    '@type': ['Organization', 'ProfessionalService'],
    '@id': 'https://automaticialab.com/#organization',
    name: 'Automatic IA Lab',
    legalName: 'Automatic IA Lab',
    alternateName: 'Automatic IA Lab — Agencia digital de IA',
    url: 'https://automaticialab.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://automaticialab.com/logo.png',
      width: 512,
      height: 341,
    },
    image: 'https://automaticialab.com/og-image.png',
    email: 'automaticialab@gmail.com',
    telephone: '+5491171311465',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Buenos Aires',
      addressRegion: 'Ciudad Autónoma de Buenos Aires',
      addressCountry: 'AR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -34.6037,
      longitude: -58.3816,
    },
    // Service-area business: we operate online across all Argentina.
    areaServed: [
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'AdministrativeArea', name: 'CABA' },
      { '@type': 'AdministrativeArea', name: 'Buenos Aires' },
    ],
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: -34.6037, longitude: -58.3816 },
      geoRadius: '5000000',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    sameAs: [
      'https://www.instagram.com/automaticialab',
      'https://github.com/jusdipietro-dotcom',
      'https://www.google.com/maps?cid=05938724930941089681',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+5491171311465',
      contactType: 'customer service',
      areaServed: 'AR',
      availableLanguage: ['Spanish', 'es-AR'],
    },
    description:
      'Agencia digital argentina especializada en cuatro pilares: inteligencia artificial aplicada, marketing digital (Meta + Google Ads), diseño web a medida y posicionamiento SEO. Cada proyecto se cotiza con un diagnóstico técnico inicial y se implementa de forma personalizada.',
    knowsAbout: [
      'Inteligencia artificial aplicada',
      'Marketing digital y performance',
      'Meta Ads y Google Ads',
      'Diseño web a medida',
      'SEO y posicionamiento',
      'Automatización de procesos con n8n',
      'Chatbots con IA',
      'Integraciones con sistemas',
    ],
    slogan: 'Crecé tu negocio con IA, marketing, diseño y SEO',
    // Catálogo de servicios con precios en USD (los 4 pilares + procesos del modelo).
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de agencia digital',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Diagnóstico inicial',
          description: 'Reunión técnica + auditoría + arquitectura propuesta + documento (15-30 páginas).',
          price: '300',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '300',
            maxPrice: '700',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'Offer',
          name: 'Implementación de proyecto',
          description: 'Desarrollo + integraciones + testing + capacitación. Descuento del diagnóstico aplicado.',
          price: '1500',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '1500',
            maxPrice: '5000',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'Offer',
          name: 'Mantenimiento mensual',
          description: 'Soporte técnico + actualizaciones + mejoras (hasta 4hs/mes). Sin permanencia.',
          price: '200',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: '200',
            maxPrice: '500',
            priceCurrency: 'USD',
            unitText: 'monthly',
          },
        },
      ],
    },
  }

  return <JsonLd data={organizationSchema} />
}
