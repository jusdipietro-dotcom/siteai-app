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
 * Returns the family names verbatim. Escaping is left to the caller because it
 * depends on where the value lands: the published document interpolates it into
 * a raw CSS string it emits itself, which is a different trust boundary from a
 * React `style` object.
 */
export interface ResolvedSiteFonts {
  /** `cssFamily` of the heading font, defaulted to Inter. */
  headingFamily: string
  /** `cssFamily` of the body font, defaulted to Inter. */
  bodyFamily: string
  /** Google Fonts stylesheet URLs, de-duplicated — both ids are often equal. */
  urls: string[]
}

export function resolveSiteFonts(branding?: { fontHeading?: string; fontBody?: string }): ResolvedSiteFonts {
  const headingFont = typographyOptions.find((f) => f.id === (branding?.fontHeading || 'inter'))
  const bodyFont = typographyOptions.find((f) => f.id === (branding?.fontBody || 'inter'))
  return {
    headingFamily: headingFont?.cssFamily || 'Inter',
    bodyFamily: bodyFont?.cssFamily || 'Inter',
    urls: Array.from(new Set([headingFont?.googleUrl, bodyFont?.googleUrl].filter((u): u is string => !!u))),
  }
}
