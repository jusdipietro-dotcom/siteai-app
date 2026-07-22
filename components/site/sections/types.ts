import type { ContactData } from '@/types'

/**
 * The normalised shape the section components consume.
 *
 * Every section under this folder is pure presentation: props in, JSX out, no
 * hooks and no client-only API. That is what lets a module with no `'use
 * client'` directive be pulled into either React graph — the server component
 * that renders the published document, or a client component that renders a
 * live preview.
 *
 * The normalisation lives at the caller, never here. The published side holds a
 * Prisma row whose `businessData` is JSON-in-TEXT; a preview holds an already
 * parsed store object. Both adapt to the types below, so a section never learns
 * where its data came from — and can never grow a branch on it.
 */

/**
 * A team member whose photo URL the caller has already validated.
 *
 * `photo` is deliberately `string | null` rather than the raw `image?: string`
 * of the domain type: URL validation is a trust decision about the data source,
 * which is exactly the kind of thing a presentational component must not be
 * making. `null` means "no usable photo", and the section falls back to the
 * initial avatar.
 */
export interface SectionTeamMember {
  id: string
  name: string
  role: string
  bio?: string
  photo: string | null
}

/**
 * Contact details as rendered.
 *
 * `Partial` because this is reconstructed from parsed JSON that may predate any
 * given field, and the section renders each line only when it is present.
 */
export type SectionContact = Partial<ContactData>
