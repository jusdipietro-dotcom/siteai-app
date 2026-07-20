import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Automatización para Abogados y Estudios Jurídicos en Argentina',
  description:
    'Software para abogados en Argentina: monitoreo judicial PJN+SCBA, dashboard MEV, secretaria IA, facturación ARCA, JurisArgentina y publicaciones IG. Desde $19.000/mes.',
  keywords: [
    'automatización para abogados argentina',
    'software para abogados',
    'software para estudios jurídicos',
    'sistema de gestión jurídico argentina',
    'monitoreo judicial automático',
    'notificaciones judiciales pjn scba',
    'secretaria virtual abogados',
    'facturación ARCA abogados',
    'jurisprudencia argentina IA',
    'dashboard causas judiciales',
    'turnos online abogados',
    'asistente IA abogados',
  ],
  alternates: { canonical: 'https://automaticialab.com/automatizacion-para-abogados' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: 'Automatización para Abogados y Estudios Jurídicos | Automatic IA Lab',
    description:
      'Suite completa de IA para abogados argentinos: monitoreo judicial, dashboard MEV, secretaria virtual, facturación ARCA, jurisprudencia IA, publicaciones IG legales.',
    url: 'https://automaticialab.com/automatizacion-para-abogados',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Automatización IA para Abogados — Automatic IA Lab',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automatización para Abogados y Estudios Jurídicos | Automatic IA Lab',
    description:
      'Suite completa de IA para abogados: monitoreo PJN+SCBA, dashboard MEV, secretaria virtual, facturación ARCA. Desde $19.000/mes.',
    images: ['/og-image.png'],
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Automatización IA para Abogados y Estudios Jurídicos',
  description:
    'Software profesional para abogados argentinos: monitoreo judicial automático (PJN, SCBA), dashboard de causas MEV, secretaria virtual con IA, facturación electrónica ARCA, jurisprudencia con IA y publicaciones automatizadas en Instagram.',
  provider: { '@type': 'Organization', name: 'Automatic IA Lab', url: 'https://automaticialab.com' },
  areaServed: { '@type': 'Country', name: 'Argentina' },
  serviceType: 'Legal Tech / SaaS para abogados',
  url: 'https://automaticialab.com/automatizacion-para-abogados',
  offers: [
    {
      '@type': 'Offer',
      name: 'Monitoreo Judicial Básico',
      price: '19000',
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
      description: 'Notificaciones automáticas PJN + SCBA (1 CUIL, sync diario).',
    },
    {
      '@type': 'Offer',
      name: 'Suite Jurídica Plan Abogado',
      price: '39000',
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
      description: 'Combo completo con 30% off: monitoreo + facturación ARCA + dashboard causas + turnos online.',
    },
    {
      '@type': 'Offer',
      name: 'Suite Jurídica Plan Estudio',
      price: '149000',
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
      description: 'Plan para estudios jurídicos: monitoreo ilimitado, multi-usuario, soporte dedicado.',
    },
  ],
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué portales judiciales monitorean?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PJN (Poder Judicial de la Nación) y SCBA (Suprema Corte de Buenos Aires). Detectamos novedades en tus causas y te enviamos notificación por email en menos de 2 horas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es legal usar un sistema automático para acceder al portal del PJN?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El sistema usa tus credenciales legítimas (las que vos ya usás manualmente) para consultar tus propias causas, igual que si entraras vos. No hay scraping de cuentas ajenas ni acceso no autorizado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo se cobra? ¿Hay permanencia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Suscripción mensual via MercadoPago. Sin permanencia, sin contratos, sin penalidad por baja. Cancelas cuando quieras desde tu panel.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cumple con la facturación electrónica de AFIP/ARCA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El módulo de facturación está integrado directamente con ARCA (ex AFIP). Genera Facturas A, B, C, Notas de Crédito y Débito según tu condición fiscal (Responsable Inscripto o Monotributista).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Funciona en cualquier estudio jurídico de Argentina?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, en todo el país. El monitoreo PJN cubre las 24 jurisdicciones federales. SCBA cubre Buenos Aires Provincia. Para CABA, JurisArgentina indexa la jurisprudencia de la CSJN, CNCiv, CNCrim y todos los fueros nacionales.',
      },
    },
  ],
}

export default function AutomatizacionAbogadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: 'https://automaticialab.com' },
          {
            name: 'Automatización para Abogados',
            url: 'https://automaticialab.com/automatizacion-para-abogados',
          },
        ]}
      />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={faqJsonLd} />
      {children}
    </>
  )
}
