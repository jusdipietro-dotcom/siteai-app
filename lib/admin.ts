import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Admin email(s) — only these users can access admin endpoints
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'automaticialab@gmail.com').split(',').map(e => e.trim().toLowerCase())

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return null
  return session
}
