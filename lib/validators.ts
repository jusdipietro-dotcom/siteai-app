/**
 * Lightweight validators reused across API endpoints.
 * Prefer these over ad-hoc `.includes('@')` checks.
 */

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 254) return false
  return EMAIL_RE.test(trimmed)
}

const CUIT_RE = /^\d{11}$/

export function isValidCuit(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const digitsOnly = value.replace(/[-\s]/g, '')
  if (!CUIT_RE.test(digitsOnly)) return false

  const mults = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digitsOnly[i], 10) * mults[i]
  const rem = sum % 11
  const expected = rem === 0 ? 0 : rem === 1 ? 9 : 11 - rem
  return parseInt(digitsOnly[10], 10) === expected
}
