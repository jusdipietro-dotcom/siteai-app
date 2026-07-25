import type { Project, BusinessData, SectionType } from '@/types'

/*
  "Listo para publicar" — the readiness check.

  The old checklist was five all-or-nothing items that ALL blocked publishing —
  so a missing SEO title stopped a perfectly functional site from going live,
  while a site with no photos and no WhatsApp sailed through. This splits the
  checks into two honest tiers:

  - required: the minimum for a site that works at all (name, a way to be
    contacted, a design). Only these block publishing.
  - recommended: the things that make a site not look half-built (cover image,
    WhatsApp, SEO title, an About text, and — the one nobody notices — sections
    that are switched ON but empty, which the renderer silently hides).

  Pure and client-safe: it reads the already-parsed project the store holds and
  returns a report the publish screen renders. No side effects, no I/O.
*/

export type ReadinessSeverity = 'required' | 'recommended'

export interface ReadinessItem {
  id: string
  label: string
  passed: boolean
  severity: ReadinessSeverity
  /** What to do about it — shown when the item is pending. */
  hint: string
}

export interface ReadinessReport {
  items: ReadinessItem[]
  /** True when every REQUIRED item passes; recommended items never block. */
  canPublish: boolean
  requiredPending: number
  recommendedPending: number
}

// Human labels for the sections a visitor sees, for the "empty section" hint.
const SECTION_LABELS: Partial<Record<SectionType, string>> = {
  hero: 'Portada',
  about: 'Nosotros',
  services: 'Servicios',
  features: 'Características',
  gallery: 'Galería',
  pricing: 'Precios',
  testimonials: 'Testimonios',
  team: 'Equipo',
  faq: 'Preguntas frecuentes',
  stats: 'Estadísticas',
  hours: 'Horarios y ubicación',
  contact: 'Contacto',
}

/**
 * Whether a section would actually render, mirroring the published renderer's
 * content gate (components/site/PublishedSite.tsx). A section switched on but
 * with no content is hidden on the live site — the check that catches that is
 * the whole point of this tier.
 */
function sectionHasContent(id: SectionType, bd: BusinessData): boolean {
  switch (id) {
    case 'about':
      return !!bd.description?.trim()
    case 'services':
    case 'features':
      return !!bd.services?.some((s) => s.name?.trim())
    case 'gallery':
      return !!bd.galleryImages?.length
    case 'pricing':
      return !!bd.services?.some((s) => !!s.price)
    case 'testimonials':
      return !!bd.testimonials?.length
    case 'team':
      return !!bd.team?.length
    case 'faq':
      return !!bd.faqs?.length
    case 'stats':
      return !!bd.stats?.length
    case 'hours':
      // Mirrors PublishedSite: the location section needs an address to map.
      return !!bd.contact?.address?.trim()
    // Always-render sections and anything outside the content gate.
    default:
      return true
  }
}

export function evaluatePublishReadiness(project: Project): ReadinessReport {
  const bd = (project.businessData ?? {}) as BusinessData
  const contact = bd.contact ?? {}

  // Sections that are enabled but would render nothing — named in the hint so
  // the owner knows exactly which ones to fill or turn off.
  const emptyEnabled = (project.sections ?? [])
    .filter((s) => s.enabled && s.id !== 'footer' && !sectionHasContent(s.id, bd))
    .map((s) => SECTION_LABELS[s.id] ?? s.id)

  const items: ReadinessItem[] = [
    {
      id: 'name',
      label: 'Nombre del negocio',
      severity: 'required',
      passed: !!project.name?.trim() || !!bd.name?.trim(),
      hint: 'Completá el nombre del negocio en el editor.',
    },
    {
      id: 'contact',
      label: 'Teléfono o email de contacto',
      severity: 'required',
      passed: !!(contact.phone?.trim() || contact.email?.trim()),
      hint: 'Agregá al menos un teléfono o email para que te puedan contactar.',
    },
    {
      id: 'template',
      label: 'Diseño elegido',
      severity: 'required',
      passed: !!project.template,
      hint: 'Elegí un template para tu sitio.',
    },
    {
      id: 'heroImage',
      label: 'Imagen de portada',
      severity: 'recommended',
      passed: !!bd.heroImage?.trim(),
      hint: 'Sumá una imagen de portada: generala con IA o elegila del banco de imágenes.',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp para recibir consultas',
      severity: 'recommended',
      passed: !!contact.whatsapp?.trim(),
      hint: 'Agregá tu WhatsApp: aparece como botón flotante y en los botones de contacto.',
    },
    {
      id: 'description',
      label: 'Descripción del negocio',
      severity: 'recommended',
      passed: !!bd.description?.trim(),
      hint: 'Escribí una breve descripción; es la sección "Nosotros" del sitio.',
    },
    {
      id: 'seoTitle',
      label: 'Título SEO para Google',
      severity: 'recommended',
      passed: !!bd.seo?.title?.trim(),
      hint: 'Definí el título SEO en Configuración: es lo que muestra Google en los resultados.',
    },
    {
      id: 'sectionsFilled',
      label: 'Todas las secciones activas tienen contenido',
      severity: 'recommended',
      passed: emptyEnabled.length === 0,
      hint:
        emptyEnabled.length > 0
          ? `Estas secciones están activas pero vacías y no se van a mostrar: ${emptyEnabled.join(', ')}. Cargá su contenido o desactivalas.`
          : '',
    },
  ]

  const requiredPending = items.filter((i) => i.severity === 'required' && !i.passed).length
  const recommendedPending = items.filter((i) => i.severity === 'recommended' && !i.passed).length

  return {
    items,
    canPublish: requiredPending === 0,
    requiredPending,
    recommendedPending,
  }
}
