/**
 * Branding accessors that tolerate incomplete `businessData`.
 *
 * `BusinessData.branding` is typed as required, but the column is JSON parsed
 * at runtime and rows predate fields that were added later — so the type says
 * "always there" while the data says otherwise. Reading
 * `businessData.branding.primaryColor` directly throws a TypeError on such a
 * row, and because the dashboard sidebar renders it on EVERY dashboard page, a
 * single malformed project blanked the whole dashboard for that user.
 *
 * The guard lives here rather than at each call site on purpose: eight separate
 * reads had to remember it and none did. Same reasoning as `resolveSiteFonts`
 * swallowing the font scrub — a rule nobody can forget is worth more than a
 * rule everybody is told about.
 *
 * Leaf module: no Prisma, no React, no server-only imports, so client
 * components can use it too.
 */

/** Fallback brand colour. Matches the wizard's default so a project with no
 *  branding looks like a fresh one rather than broken. */
export const DEFAULT_PRIMARY_COLOR = '#6366f1'

/** Shape we actually rely on. Deliberately loose: the caller may hold a parsed
 *  row, a store object, or something older than the current type. */
interface MaybeBranded {
  branding?: { primaryColor?: string | null } | null
}

/**
 * The project's primary colour, or the default when the row has no usable one.
 *
 * Accepts the `businessData` object (not the project) because callers hold it
 * in different shapes — a Prisma row, a store entry, a wizard draft.
 */
export function primaryColorOf(businessData: MaybeBranded | null | undefined): string {
  const value = businessData?.branding?.primaryColor
  return typeof value === 'string' && value.trim() !== '' ? value : DEFAULT_PRIMARY_COLOR
}
