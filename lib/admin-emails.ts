/**
 * Admin email allowlist.
 *
 * Kept in its own module with no imports on purpose: both `lib/auth.ts` (to
 * stamp `isAdmin` onto the session) and `lib/admin.ts` (which imports
 * `authOptions` from `lib/auth.ts`) need it. Putting the list in `lib/admin.ts`
 * would make that a circular import.
 *
 * This module must never be imported from a Client Component — the allowlist
 * would end up in the browser bundle, telling every visitor who the admins are.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'automaticialab@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/** True when `email` is on the admin allowlist. Case-insensitive. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
