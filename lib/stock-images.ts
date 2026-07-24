/**
 * Hosts the stock-image importer is allowed to fetch from.
 *
 * Pexels serves its photo files from this single host. Keep this an allow-list:
 * the importer runs on the VPS, so anything not listed here is a URL we refuse
 * to dereference, not one we try to sanitise.
 */
export const ALLOWED_STOCK_HOSTS = ['images.pexels.com']

/**
 * User-Agent for every server-side call to Pexels.
 *
 * Pexels sits behind Cloudflare, which answers 403 with error code 1010 to
 * clients whose User-Agent it does not recognise — Node's default is one of
 * them, so without this a perfectly valid API key looks rejected. Verified
 * against the live API: same key, no UA → 403; with this UA → 200.
 *
 * /api/ai-image already carries the same workaround for Pollinations.
 */
export const STOCK_FETCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

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
