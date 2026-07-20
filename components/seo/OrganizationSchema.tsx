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
    slogan: 'Hacé crecer tu negocio con IA, marketing, diseño y SEO',
    // Catálogo de servicios (los 4 pilares). Sin precios: cotización a medida vía WhatsApp.
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de agencia digital',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Inteligencia Artificial aplicada',
            description: 'Implementación de modelos de lenguaje (GPT, Claude, Gemini), agentes autónomos, chatbots y automatizaciones inteligentes para tu operación.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Marketing Digital',
            description: 'Estrategia y gestión de campañas en Meta Ads, Google Ads y TikTok, más contenido orgánico y embudos de conversión.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Diseño Web a medida',
            description: 'Sitios web profesionales, landing pages y e-commerce en Next.js + Tailwind, sin templates genéricos.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Posicionamiento SEO',
            description: 'Auditoría técnica, SEO local con Google Business, optimización on-page y estrategia de contenido para aparecer primero en Google.',
          },
        },
      ],
    },
  }

  return <JsonLd data={organizationSchema} />
}
