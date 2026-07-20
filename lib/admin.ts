import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { isAdminEmail } from './admin-emails'

/**
 * Returns the session when the caller is an admin, otherwise `null`.
 *
 * The allowlist lives in `lib/admin-emails.ts` and is re-read from the session
 * email on every call — never from a client-supplied flag. `session.user.isAdmin`
 * exists only to decide whether to render admin navigation; it is not an
 * authorization decision and must not be used as one.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  if (!isAdminEmail(session.user.email)) return null
  return session
}
