import { JsonLd } from './JsonLd'

export interface BreadcrumbItem {
  /** Label visible (e.g. "Servicios") */
  name: string
  /** Absolute URL for the breadcrumb item */
  url: string
}

/**
 * BreadcrumbList JSON-LD for inner pages.
 * Helps Google show breadcrumbs in SERP and improves IA understanding of
 * site hierarchy (e.g. /servicios/diseno-web sits under /servicios under /).
 *
 * Always include the home as first item.
 */
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <JsonLd data={data} />
}
