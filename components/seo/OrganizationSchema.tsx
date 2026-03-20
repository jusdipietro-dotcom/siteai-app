import { JsonLd } from './JsonLd'

export function OrganizationSchema() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Automatic IA Lab',
    url: 'https://automaticialab.com',
    email: 'automaticialab@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Buenos Aires',
      addressCountry: 'AR',
    },
    sameAs: ['https://www.instagram.com/automaticialab'],
    description: 'Generador de sitios web con inteligencia artificial. Crea sitios web profesionales para tu negocio en minutos.',
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Automatic IA Lab',
    applicationCategory: 'WebApplication',
    offers: [
      {
        '@type': 'Offer',
        name: 'Plan Free',
        price: '0',
        priceCurrency: 'ARS',
        description: 'Plan gratuito con funcionalidades básicas',
      },
      {
        '@type': 'Offer',
        name: 'Plan Essential',
        price: '12000',
        priceCurrency: 'ARS',
        description: 'Plan esencial con funcionalidades avanzadas',
      },
      {
        '@type': 'Offer',
        name: 'Plan Professional',
        price: '29000',
        priceCurrency: 'ARS',
        description: 'Plan profesional con todas las funcionalidades',
      },
    ],
    operatingSystem: 'Web',
    description: 'Generador de sitios web con inteligencia artificial. Crea sitios web profesionales para tu negocio sin saber programar.',
  }

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareApplicationSchema} />
    </>
  )
}
