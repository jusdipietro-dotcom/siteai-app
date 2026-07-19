/**
 * Next.js instrumentation — runs once at server startup.
 * Validates that all critical environment variables are set.
 *
 * In production a missing REQUIRED var aborts startup. This is deliberate:
 * every one of them fails *silently* at runtime otherwise. The worst case is
 * MP_WEBHOOK_SECRET — without it signature verification rejects every
 * MercadoPago webhook with a 403, so customers are charged and never
 * provisioned, and nothing in the logs looks like an error. A container that
 * refuses to boot is a loud, immediate, trivially fixable failure; a container
 * that boots and quietly drops payments is neither.
 *
 * In development the same checks only warn, so the app still runs without
 * MercadoPago or SMTP credentials.
 */

/** Treats empty and whitespace-only values as missing. */
function isBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const isProduction = process.env.NODE_ENV === 'production'

  const required: Record<string, string | undefined> = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
    MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
    CREDENTIALS_ENCRYPTION_KEY: process.env.CREDENTIALS_ENCRYPTION_KEY,
  }

  const recommended: Record<string, string | undefined> = {
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    N8N_PROVISIONING_WEBHOOK: process.env.N8N_PROVISIONING_WEBHOOK,
    SCRAPER_API_KEY: process.env.SCRAPER_API_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  }

  const problems: string[] = []

  const missing = Object.entries(required)
    .filter(([, v]) => isBlank(v))
    .map(([k]) => k)

  if (missing.length > 0) {
    problems.push(`Missing REQUIRED env vars: ${missing.join(', ')}`)
  }

  // lib/encryption.ts throws on a short key, but only on first use — which is
  // mid-request, long after deploy. Catch it at boot instead.
  const encKey = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!isBlank(encKey) && encKey!.length < 32) {
    problems.push(
      `CREDENTIALS_ENCRYPTION_KEY is too short (${encKey!.length} chars, needs 32+)`
    )
  }

  const missingRecommended = Object.entries(recommended)
    .filter(([, v]) => isBlank(v))
    .map(([k]) => k)

  if (missingRecommended.length > 0) {
    console.warn(
      `[STARTUP WARN] Missing recommended env vars: ${missingRecommended.join(', ')}\n` +
      `Some features (email, provisioning, admin) may be unavailable.\n`
    )
  }

  if (problems.length === 0) {
    console.log('[STARTUP] All required env vars validated OK')
    return
  }

  const detail = problems.map((p) => `  - ${p}`).join('\n')

  if (!isProduction) {
    console.error(
      `\n[STARTUP ERROR] Environment is incomplete:\n${detail}\n` +
      `Continuing anyway because NODE_ENV is not "production". ` +
      `This WOULD abort startup in production.\n`
    )
    return
  }

  // Production: refuse to serve traffic. See docs/deploy/ENVIRONMENT.md.
  throw new Error(
    `[STARTUP ABORT] Refusing to start in production with an incomplete environment:\n${detail}\n` +
    `Each of these fails silently at runtime rather than loudly. ` +
    `Set them in .env (see docs/deploy/ENVIRONMENT.md) and redeploy.`
  )
}
