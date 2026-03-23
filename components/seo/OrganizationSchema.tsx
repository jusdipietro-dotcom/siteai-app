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
    description: 'Plataforma de automatización inteligente. Sitios web con IA, monitoreo judicial automático, captación de leads y automatizaciones a medida para negocios de Argentina.',
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
