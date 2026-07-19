/**
 * Narrow helpers for reading Prisma error shapes without importing the
 * generated client types into route handlers.
 */

interface PrismaKnownError {
  code?: unknown
  meta?: { target?: unknown }
}

/** True if `err` is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as PrismaKnownError).code === 'P2002'
  )
}

/**
 * True if `err` is a P2002 raised by the Project.subdomain unique index.
 *
 * `meta.target` is the column list Postgres reported. If it is missing we do
 * not claim the conflict, so an unrelated unique violation is never mislabeled
 * as a taken subdomain.
 */
export function isSubdomainConflict(err: unknown): boolean {
  if (!isUniqueConstraintError(err)) return false

  const target = (err as PrismaKnownError).meta?.target
  if (Array.isArray(target)) return target.includes('subdomain')
  if (typeof target === 'string') return target.includes('subdomain')
  return false
}
