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
    alternateName: 'Automatic IA Lab — Automatización con IA',
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
      geoRadius: '5000000', // 5000km — covers all of Argentina + LATAM neighbors
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
      // Google Business Profile (links the website to the verified GBP)
      'https://www.google.com/maps?cid=05938724930941089681',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+5491171311465',
      contactType: 'customer service',
      areaServed: 'AR',
      availableLanguage: ['Spanish', 'es-AR'],
      contactOption: 'TollFree',
    },
    description:
      'Agencia y plataforma de automatización con IA en Argentina. Sitios web con IA, monitoreo judicial automático (PJN/SCBA), captación de leads B2B, email marketing, reseñas Google, LinkedIn y automatizaciones a medida para PyMEs y estudios jurídicos.',
    knowsAbout: [
      'Automatización con IA',
      'Inteligencia artificial generativa',
      'Software para abogados',
      'Monitoreo judicial PJN SCBA',
      'Email marketing automatizado',
      'Captación de leads B2B',
      'Generación de sitios web con IA',
      'Workflow automation n8n',
      'Reseñas Google Business',
    ],
    slogan: 'Automatizá tu negocio con inteligencia artificial',
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Automatic IA Lab',
    applicationCategory: 'WebApplication',
    offers: [
      {
        '@type': 'Offer',
        name: 'Sitio Web — Plan Free',
        price: '0',
        priceCurrency: 'ARS',
        description: 'Sitio web profesional generado con IA, plan gratuito',
      },
      {
        '@type': 'Offer',
        name: 'Sitio Web — Plan Essential',
        price: '12000',
        priceCurrency: 'ARS',
        description: 'Sitio web con dominio propio y funcionalidades avanzadas',
      },
      {
        '@type': 'Offer',
        name: 'Sitio Web — Plan Professional',
        price: '29000',
        priceCurrency: 'ARS',
        description: 'Sitio web profesional con todas las funcionalidades',
      },
      {
        '@type': 'Offer',
        name: 'Monitoreo Judicial — Básico',
        price: '19000',
        priceCurrency: 'ARS',
        description: 'Monitoreo automático de notificaciones judiciales PJN/SCBA, 1 CUIT',
      },
      {
        '@type': 'Offer',
        name: 'Monitoreo Judicial — Profesional',
        price: '35000',
        priceCurrency: 'ARS',
        description: 'Monitoreo judicial para hasta 3 CUITs con soporte prioritario',
      },
      {
        '@type': 'Offer',
        name: 'Monitoreo Judicial — Estudio',
        price: '75000',
        priceCurrency: 'ARS',
        description: 'Monitoreo judicial para estudios jurídicos, hasta 8 CUITs',
      },
      {
        '@type': 'Offer',
        name: 'Captación de Leads IA',
        price: '18000',
        priceCurrency: 'ARS',
        description: 'Sistema automatizado de captación de leads con emails verificados para negocios de toda Argentina, 24/7',
      },
    ],
    operatingSystem: 'Web',
    description: 'Plataforma de automatización con IA: generador de sitios web, monitoreo judicial automático y automatizaciones personalizadas.',
  }

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
    </>
  )
}
