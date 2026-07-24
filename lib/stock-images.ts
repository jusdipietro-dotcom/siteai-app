/**
 * Hosts the stock-image importer is allowed to fetch from.
 *
 * Pexels serves its photo files from this single host. Keep this an allow-list:
 * the importer runs on the VPS, so anything not listed here is a URL we refuse
 * to dereference, not one we try to sanitise.
 */
export const ALLOWED_STOCK_HOSTS = ['images.pexels.com']

/**
 * Validate a stock-photo URL before the server fetches it.
 *
 * The URL originates in our own search endpoint, but it round-trips through the
 * browser, so by the time /api/stock-images/import receives it, it is
 * caller-controlled. Without this gate that endpoint is an open proxy: a
 * crafted URL would make the VPS fetch internal addresses that are unreachable
 * from the internet (cloud metadata, other containers, localhost services) and
 * hand the bytes back — server-side request forgery.
 *
 * Returns the parsed URL only for an https URL whose host matches an entry
 * EXACTLY. Exact match, not `endsWith`, so `images.pexels.com.attacker.net`
 * does not slip through.
 */
export function parseStockImageUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }

  // https only: http could be intercepted, and the non-network schemes
  // (javascript:, data:, file:) have no business reaching fetch at all.
  if (parsed.protocol !== 'https:') return null
  if (!ALLOWED_STOCK_HOSTS.includes(parsed.hostname)) return null

  return parsed
}
