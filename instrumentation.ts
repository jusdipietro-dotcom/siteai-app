/**
 * Next.js instrumentation — runs once at server startup.
 * Validates that all critical environment variables are set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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

    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k)

    const missingRecommended = Object.entries(recommended)
      .filter(([, v]) => !v)
      .map(([k]) => k)

    if (missing.length > 0) {
      console.error(
        `\n[STARTUP ERROR] Missing REQUIRED env vars: ${missing.join(', ')}\n` +
        `The app may not work correctly. Check your .env or Docker environment.\n`
      )
    }

    if (missingRecommended.length > 0) {
      console.warn(
        `[STARTUP WARN] Missing recommended env vars: ${missingRecommended.join(', ')}\n` +
        `Some features (email, provisioning, admin) may be unavailable.\n`
      )
    }

    // Validate encryption key length
    const encKey = process.env.CREDENTIALS_ENCRYPTION_KEY
    if (encKey && encKey.length < 32) {
      console.error(
        `[STARTUP ERROR] CREDENTIALS_ENCRYPTION_KEY is too short (${encKey.length} chars, needs 32+)\n`
      )
    }

    if (missing.length === 0) {
      console.log('[STARTUP] All required env vars validated OK')
    }
  }
}
