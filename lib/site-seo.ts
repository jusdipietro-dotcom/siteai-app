/**
 * SEO output for published sites: keywords, share-card images and JSON-LD.
 *
 * Split from lib/published-site.ts because that module constructs a Prisma
 * client at import time. Everything here is pure — it takes plain values and
 * returns plain values — so it can be unit-tested without a database and reused
 * by the renderer, the metadata builder and the robots route alike.
 *
 * ── The honesty rule ────────────────────────────────────────────────────────
 * Structured data is a set of machine-readable claims about a REAL business,
 * submitted to search engines under that business's name. A fabricated field
 * here is worse than fabricated visible copy: the owner cannot see it, and it is
 * the owner — not this platform — who answers for it.
 *
 * So every builder below emits ONLY what the owner actually supplied. A missing
 * field is omitted from the payload entirely; it is never defaulted, guessed or
 * back-filled. In particular:
 *
 *   - No `aggregateRating` and no `review`, ever. `BusinessData.testimonials`
 *     carries a `rating` per entry and averaging them is one line of code — but
 *     those are quotes the owner typed into an editor, not verifiable reviews
 *     from identified customers. Emitting them as an aggregate rating would put
 *     star ratings in Google's search results on the strength of self-reported
 *     numbers. This product has no review verification, so it makes no rating
 *     claims. Do not add one.
 *   - No `openingHours`. `contact.schedule` is free text ("Lun a Sáb 7 a 20"),
 *     and schema.org expects a machine format ("Mo-Sa 07:00-20:00"). Converting
 *     one to the other means guessing whether "7" is 07:00 or 19:00, so the
 *     hours are omitted until the editor collects them as structured input.
 *   - No `geo`. BusinessData has no latitude/longitude field at all.
 *   - No `priceRange`. Service prices are free-text strings for individual
 *     services, not a range the owner declared for the business.
 */

import { safeImg } from './site-images'
import type { BusinessData, ContactData } from '@/types'

/** Trims a possibly-absent owner value, returning undefined when it is empty. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

// ─── Plan gate ───────────────────────────────────────────────────────────────

/**
 * The Professional-only SEO gate, defined once.
 *
 * Reads the plan off the project ROW, exactly like the Google Analytics gate in
 * PublishedSite — server-side state loaded from the database. It is not
 * derivable from anything the client sends: `plan` is absent from
 * CLIENT_WRITABLE_FIELDS (lib/projectSerializer.ts), so a crafted request body
 * cannot escalate into it.
 *
 * `hasPaid` is required alongside the plan rather than assumed from it, the same
 * way `publishedGate` requires it alongside `status`. Both public routes already
 * gate on it before a row reaches here; repeating it costs nothing and means a
 * future caller that forgets the gate still cannot emit paid-tier markup.
 */
export function hasProfessionalSeo(project: {
  plan?: string | null
  hasPaid?: boolean | null
}): boolean {
  return project.plan === 'professional' && project.hasPaid === true
}

// ─── Keywords ────────────────────────────────────────────────────────────────

/**
 * Splits the owner's comma-separated `seo.keywords` into a metadata array.
 *
 * These were collected by the wizard and the settings screen from day one and
 * never emitted anywhere — which made "SEO básico (título, descripción,
 * keywords)" false for Essential too. This is the fix, and it is not gated on
 * plan: both paid tiers advertise keywords.
 *
 * Duplicates are dropped case-insensitively while keeping the owner's own
 * casing and ordering for the first occurrence of each.
 */
export function parseSeoKeywords(raw: unknown): string[] {
  const value = text(raw)
  if (!value) return []

  const seen = new Set<string>()
  const keywords: string[] = []
  for (const part of value.split(',')) {
    const keyword = part.trim()
    if (!keyword) continue
    const key = keyword.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    keywords.push(keyword)
  }
  return keywords
}

// ─── Share-card image ────────────────────────────────────────────────────────

/**
 * Resolves the owner's hero image to an absolute URL for OpenGraph/Twitter.
 *
 * Validation is delegated to `safeImg` — the single image-URL validator the
 * three renderers already share — so this cannot drift into a second, laxer
 * definition of "safe".
 *
 * Two narrowings on top of it, both because a share card is fetched by a crawler
 * rather than rendered by the visitor's browser:
 *   - Root-relative paths are resolved against the site's canonical origin.
 *     OpenGraph requires an absolute URL; a relative one is silently dropped by
 *     every scraper.
 *   - `data:image/` payloads are rejected. `safeImg` allows them because an
 *     inline <img src> works fine, but no crawler will read a data URI out of
 *     an og:image tag.
 *
 * Returns null when there is nothing usable, and the caller omits the tags
 * rather than emitting an empty or broken one.
 */
export function absoluteSiteImageUrl(
  raw: string | null | undefined,
  canonical: string
): string | null {
  const safe = safeImg(raw)
  if (!safe) return null
  if (/^https?:\/\//i.test(safe)) return safe
  if (!safe.startsWith('/')) return null

  try {
    // Root-relative resolves against the ORIGIN, dropping the canonical's path.
    // That matches what a browser does with the same `/uploads/x.jpg` in a src,
    // so the card image and the rendered image are always the same file.
    return new URL(safe, canonical).toString()
  } catch {
    return null
  }
}

// ─── Structured data (JSON-LD) ───────────────────────────────────────────────

/**
 * Maps the wizard's `businessType` id (data/mockBusinessTypes.ts) to a
 * schema.org type that is a genuine subtype of LocalBusiness.
 *
 * Only unambiguous rubros are mapped. `agencia` ("Agencia / Startup"),
 * `arquitectura` ("Arquitectura / Diseño"), `fotografo` and `profesional` are
 * deliberately absent: schema.org has no clean subtype for them, and picking an
 * approximate one would be a claim about the business the owner never made.
 * Anything unmapped falls back to plain LocalBusiness, which is always true of
 * a business with a street address.
 *
 * `boutique` is "Tienda / Boutique" in the wizard — it covers any shop, not
 * only clothing — so it maps to Store rather than ClothingStore.
 */
const SCHEMA_TYPE_BY_BUSINESS_TYPE: Readonly<Record<string, string>> = {
  restaurante: 'Restaurant',
  abogado: 'LegalService',
  consultorio: 'MedicalBusiness',
  contable: 'AccountingService',
  inmobiliaria: 'RealEstateAgent',
  gimnasio: 'ExerciseGym',
  peluqueria: 'BeautySalon',
  boutique: 'Store',
}

export function schemaTypeForBusinessType(businessType: unknown): string {
  const id = text(businessType)?.toLocaleLowerCase()
  if (!id) return 'LocalBusiness'

  // Own-property check rather than a bare index, for the reason spelled out in
  // lib/website-plans.ts: the map is a plain object, so `map['toString']`
  // resolves through Object.prototype and returns a truthy *function*. A
  // businessType of "toString" or "constructor" would otherwise put that
  // function's source into `@type`.
  if (!Object.prototype.hasOwnProperty.call(SCHEMA_TYPE_BY_BUSINESS_TYPE, id)) {
    return 'LocalBusiness'
  }
  return SCHEMA_TYPE_BY_BUSINESS_TYPE[id]
}

/**
 * Builds a schema.org PostalAddress from the owner's contact block.
 *
 * Returns null when the owner supplied no address component at all, so the
 * business node omits `address` entirely rather than carrying an empty shell.
 * Present components are emitted; absent ones are simply not keys.
 */
function buildPostalAddress(contact: Partial<ContactData> | undefined) {
  const streetAddress = text(contact?.address)
  const addressLocality = text(contact?.city)
  const addressRegion = text(contact?.province)
  const addressCountry = text(contact?.country)

  if (!streetAddress && !addressLocality && !addressRegion && !addressCountry) {
    return null
  }

  return {
    '@type': 'PostalAddress',
    ...(streetAddress && { streetAddress }),
    ...(addressLocality && { addressLocality }),
    ...(addressRegion && { addressRegion }),
    ...(addressCountry && { addressCountry }),
  }
}

export interface SiteStructuredDataInput {
  /** Display name already resolved by the caller (businessData.name || project.name). */
  name: string
  businessData: Partial<BusinessData>
  /** The site's canonical URL — the same one used for `alternates.canonical`. */
  canonical: string
  /** Absolute image URL, or null. Produced by `absoluteSiteImageUrl`. */
  image: string | null
  /**
   * Already-normalised absolute social profile URLs. Passed in rather than
   * re-derived so `sameAs` and the rendered footer links can never disagree
   * about where a handle points.
   */
  sameAs: string[]
}

/**
 * Builds the LocalBusiness node for a published site, or null.
 *
 * Null when the business has no name: a structured-data node without an
 * identity says nothing, and emitting one anyway is how a placeholder ends up
 * in a search index. Callers skip the <script> entirely on null.
 *
 * Every optional field follows the same rule — present only when the owner
 * actually filled it in. See the module header for what is deliberately never
 * emitted.
 */
export function buildSiteStructuredData(
  input: SiteStructuredDataInput
): Record<string, unknown> | null {
  const name = text(input.name)
  if (!name) return null

  const bd = input.businessData ?? {}
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaTypeForBusinessType(bd.businessType),
    name,
    url: input.canonical,
  }

  // The SEO description is the owner's deliberate search-result copy; the
  // business description is the fallback the page itself renders.
  const description = text(bd.seo?.description) ?? text(bd.description)
  if (description) data.description = description

  const telephone = text(bd.contact?.phone)
  if (telephone) data.telephone = telephone

  const email = text(bd.contact?.email)
  if (email) data.email = email

  const address = buildPostalAddress(bd.contact)
  if (address) data.address = address

  if (input.image) data.image = input.image

  const sameAs = (input.sameAs ?? []).map(text).filter((u): u is string => !!u)
  if (sameAs.length > 0) data.sameAs = sameAs

  return data
}

/**
 * Serialises a JSON-LD payload for embedding in a <script> element.
 *
 * `JSON.stringify` alone is NOT enough here, which is the one place this differs
 * from the Google Analytics snippet next to it. That value is safe because it is
 * regex-narrowed to `/^(G|GT|UA)-[A-Za-z0-9-]+$/` first, so it can never contain
 * a `<`. These fields are free-form owner text: a business literally named
 * `Bar </script><script>alert(1)</script>` would otherwise close the element and
 * execute, because the HTML tokenizer looks for `</script` inside script data
 * without caring that it sits inside a JSON string.
 *
 * Escaping every `<` as the JSON escape `<` removes the vector completely —
 * it also kills the `<!--` sequence that switches the tokenizer into
 * escaped-script-data — and costs nothing: `<` is standard JSON, so any
 * parser reads the original `<` back out unchanged.
 *
 * U+2028/U+2029 are escaped for the same class of reason: JSON.stringify emits
 * them raw, and they are line terminators to a JavaScript parser. JSON-LD is
 * parsed as JSON here, but the payload is routinely copied into JS contexts by
 * SEO tooling, and escaping them keeps it valid there too.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
