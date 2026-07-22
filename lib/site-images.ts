/**
 * Image-URL validation for the three site renderers.
 *
 * One copy for the published document, the preview page and the editor's live
 * preview. Image URLs are owner input (pasted into the editor, or restored from
 * a `businessData` blob written long ago), so "is this a URL a browser may be
 * handed" is a trust decision, and a trust decision that only one of three
 * renderers makes is a hole rather than a design difference.
 *
 * Deliberately a leaf module with no imports: `lib/published-site.ts` — the
 * other place shared site logic lives — reaches Prisma, and pulling that into
 * the two `'use client'` previews would drag the server graph into the client
 * bundle.
 */

/**
 * Narrows an owner-supplied image URL to something safe to put in a `src`.
 *
 * Allows only absolute http(s), site-root-relative paths, and `data:image/`
 * payloads. Anything else — most importantly `javascript:`, which React already
 * warns it will block in a future version — yields `null`, and the caller skips
 * the image rather than rendering a dead or executable one.
 *
 * Returns `string | null` rather than a boolean so callers get the trimmed
 * value back and cannot accidentally render the untrimmed original.
 */
export function safeImg(u?: string | null): string | null {
  if (!u) return null
  const t = u.trim()
  return /^(https?:\/\/|\/|data:image\/)/i.test(t) ? t : null
}
