import { JsonLd } from './JsonLd'

/**
 * WebSite + SearchAction JSON-LD.
 * Enables the sitelinks search box in Google SERP for branded searches
 * (e.g. searching "Automatic IA Lab" shows a search box right in the result).
 *
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
 *
 * Note: Google requires a real search endpoint at the target URL. If we don't
 * have one, this still validates but may not show the search box.
 * For now we point at the blog (text search) — Google will not show the
 * search box if the endpoint doesn't accept ?q=.
 */
export function WebSiteSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Automatic IA Lab',
    alternateName: 'Automatic IA Lab — Automatización con IA',
    url: 'https://automaticialab.com',
    inLanguage: 'es-AR',
    publisher: {
      '@type': 'Organization',
      name: 'Automatic IA Lab',
      url: 'https://automaticialab.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://automaticialab.com/blog?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <JsonLd data={data} />
}
