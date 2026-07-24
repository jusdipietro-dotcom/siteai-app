/**
 * Single source of truth for the manually-implemented products.
 *
 * These twelve products are NOT self-service: they need per-client provisioning
 * (cloning n8n workflows, configuring tenants, judicial-portal credentials…), so
 * they are sold through a personalised WhatsApp conversation rather than an
 * automatic MercadoPago checkout. This file is what keeps the dashboard screens
 * and the public landing in sync — every name, blurb and WhatsApp message lives
 * HERE and nowhere else. Change a word once; it updates in every surface that
 * reads from this catalog.
 *
 * The website generator (creador-de-sitios) is deliberately absent: it keeps its
 * automatic self-checkout. This catalog is only for the WhatsApp-sold products.
 */

/** WhatsApp line the whole business already publishes (see app/contacto). */
export const WHATSAPP_NUMBER = '5491171311465'

export interface ProductCatalogEntry {
  /** Dashboard route segment and stable key, e.g. `monitoreo` → /monitoreo. */
  slug: string
  /** Product name, shown as the heading. */
  name: string
  /** One short line for landing cards. */
  tagline: string
  /** One or two sentences explaining what it does. */
  description: string
  /** Pre-filled WhatsApp message for the "request implementation" CTA. */
  whatsappMessage: string
}

export const PRODUCT_CATALOG: ProductCatalogEntry[] = [
  {
    slug: 'monitoreo',
    name: 'Monitoreo Judicial',
    tagline: 'Alertas automáticas de notificaciones judiciales',
    description:
      'Recibí en tu email cada nueva notificación judicial de PJN y SCBA, con el texto completo del PDF y sin duplicados. Configurado a medida para los CUITs y portales de tu estudio.',
    whatsappMessage: 'Hola, quiero implementar el Monitoreo Judicial en mi estudio. ¿Me pasás los detalles?',
  },
  {
    slug: 'resenas',
    name: 'Gestión de Reseñas',
    tagline: 'Respuestas a reseñas de Google con IA',
    description:
      'Respondemos automáticamente las reseñas de tu Google Business con IA que cuida el tono de tu marca, para que tu reputación online trabaje sola.',
    whatsappMessage: 'Hola, quiero implementar la Gestión de Reseñas de Google en mi negocio. ¿Me pasás los detalles?',
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn Optimizer',
    tagline: 'Perfil y contenido de LinkedIn optimizados',
    description:
      'Optimizamos tu perfil de LinkedIn y generamos publicaciones pensadas para tu industria, para posicionarte como referente y atraer oportunidades.',
    whatsappMessage: 'Hola, quiero implementar el LinkedIn Optimizer. ¿Me pasás los detalles?',
  },
  {
    slug: 'crypto',
    name: 'Señales de Trading',
    tagline: 'Bot de señales de criptomonedas',
    description:
      'Bot de señales de criptomonedas con alertas de entrada y salida. Se configura según tu perfil de riesgo y los pares que operás.',
    whatsappMessage: 'Hola, quiero implementar el bot de Señales de Trading. ¿Me pasás los detalles?',
  },
  {
    slug: 'leads',
    name: 'Generación de Leads',
    tagline: 'Prospección B2B automatizada',
    description:
      'Prospección B2B automatizada con mensajes personalizados (icebreakers) para conseguir reuniones con clientes ideales, sin trabajo manual.',
    whatsappMessage: 'Hola, quiero implementar la Generación de Leads B2B. ¿Me pasás los detalles?',
  },
  {
    slug: 'email-marketing',
    name: 'Email Marketing',
    tagline: 'Campañas de email con anti-spam',
    description:
      'Campañas de email marketing con gestión de listas, anti-spam, baja automática y automatización de envíos. Montado y configurado para tu negocio.',
    whatsappMessage: 'Hola, quiero implementar el Email Marketing. ¿Me pasás los detalles?',
  },
  {
    slug: 'prospeccion',
    name: 'Prospección IA',
    tagline: 'Lead gen + icebreakers con IA',
    description:
      'Búsqueda de leads e icebreakers generados con IA, listos para escalar tu prospección comercial con contacto personalizado a cada prospecto.',
    whatsappMessage: 'Hola, quiero implementar la Prospección con IA. ¿Me pasás los detalles?',
  },
  {
    slug: 'turnos',
    name: 'Turnos Online',
    tagline: 'Reserva de turnos para tu negocio',
    description:
      'Sistema de reserva de turnos online para que tus clientes agenden solos, con recordatorios automáticos y tu agenda siempre ordenada.',
    whatsappMessage: 'Hola, quiero implementar el sistema de Turnos Online. ¿Me pasás los detalles?',
  },
  {
    slug: 'causas',
    name: 'Gestión de Causas',
    tagline: 'Dashboard de causas judiciales con IA',
    description:
      'Dashboard de tus causas judiciales con seguimiento y análisis por IA: detecta pases a sentencia, altas en MEV y convenios, y te avisa qué accionar.',
    whatsappMessage: 'Hola, quiero implementar la Gestión de Causas. ¿Me pasás los detalles?',
  },
  {
    slug: 'facturacion',
    name: 'Facturación AFIP',
    tagline: 'Facturación electrónica integrada',
    description:
      'Facturación electrónica integrada con AFIP/ARCA, sin salir de tu panel. Emitís comprobantes válidos en segundos, con tu punto de venta configurado.',
    whatsappMessage: 'Hola, quiero implementar la Facturación electrónica AFIP. ¿Me pasás los detalles?',
  },
  {
    slug: 'lexpost',
    name: 'LexPost',
    tagline: 'Contenido automático en redes para estudios',
    description:
      'Publicación automática de contenido en redes para estudios jurídicos: mantené presencia constante en Instagram sin dedicarle tiempo.',
    whatsappMessage: 'Hola, quiero implementar LexPost para mi estudio. ¿Me pasás los detalles?',
  },
  {
    slug: 'suite-juridica',
    name: 'Suite Jurídica',
    tagline: 'Todo el estudio automatizado',
    description:
      'Todo tu estudio automatizado en un solo lugar: monitoreo judicial, gestión de causas, turnos online y facturación electrónica, integrados y funcionando.',
    whatsappMessage: 'Hola, quiero implementar la Suite Jurídica completa en mi estudio. ¿Me pasás los detalles?',
  },
]

/** Lookup by slug. Returns undefined for an unknown slug. */
export function getProduct(slug: string): ProductCatalogEntry | undefined {
  return PRODUCT_CATALOG.find((p) => p.slug === slug)
}

/** Builds the wa.me link with the product's pre-filled message. */
export function whatsappHrefFor(entry: ProductCatalogEntry): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(entry.whatsappMessage)}`
}
