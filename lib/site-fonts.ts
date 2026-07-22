import { typographyOptions } from '@/config/themes'

/**
 * Resolves a project's branding font ids to the family names and stylesheet
 * URLs a renderer needs.
 *
 * One copy for the three site renderers — the published document, the preview
 * page and the editor's live preview. They deliberately draw very different
 * markup, but they all read the same two ids off the same branding object, so
 * this is the one piece of that pipeline where drift is a plain bug rather than
 * a design difference: a font added to `typographyOptions` has to reach all
 * three or the preview stops predicting the published site.
 *
 * No `'use client'` and no hooks, so the module is free to be pulled into
 * either React graph.
 *
 * Family names come back already scrubbed (see `sanitizeFont`). That used to be
 * left to the caller "because escaping depends on where the value lands" — but
 * all three renderers write the family into a raw CSS string, all three want the
 * exact same scrub, and only one of them remembered to apply it. Scrubbing here
 * makes the guard impossible to forget rather than one more thing a fourth
 * renderer has to know about.
 */
export interface ResolvedSiteFonts {
  /** `cssFamily` of the heading font, scrubbed, defaulted to Inter. */
  headingFamily: string
  /** `cssFamily` of the body font, scrubbed, defaulted to Inter. */
  bodyFamily: string
  /** Google Fonts stylesheet URLs, de-duplicated — both ids are often equal. */
  urls: string[]
}

/**
 * Reduces a font family name to the characters a real one needs — letters,
 * digits, spaces and hyphens.
 *
 * Every renderer interpolates the family into a raw CSS string it emits itself
 * (`font-family: '<here>'`), where a quote or a brace would let the value escape
 * its declaration. Today's `typographyOptions` are all plain names, so this is a
 * no-op on real data; it exists so that stays true no matter what a future entry
 * — or a future branding source that is not a fixed catalogue — contains.
 */
export function sanitizeFont(family: string): string {
  return family.replace(/[^a-zA-Z0-9\s-]/g, '')
}

export function resolveSiteFonts(branding?: { fontHeading?: string; fontBody?: string }): ResolvedSiteFonts {
  const headingFont = typographyOptions.find((f) => f.id === (branding?.fontHeading || 'inter'))
  const bodyFont = typographyOptions.find((f) => f.id === (branding?.fontBody || 'inter'))
  return {
    headingFamily: sanitizeFont(headingFont?.cssFamily || 'Inter'),
    bodyFamily: sanitizeFont(bodyFont?.cssFamily || 'Inter'),
    urls: Array.from(new Set([headingFont?.googleUrl, bodyFont?.googleUrl].filter((u): u is string => !!u))),
  }
}
