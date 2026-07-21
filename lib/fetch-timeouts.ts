/**
 * Per-request budgets for outbound `fetch` calls made from server code.
 *
 * Node's `fetch` has NO default timeout. Without an explicit signal a hung
 * upstream (MercadoPago, n8n, the Flask billing backend, the causas scraper)
 * holds a request handler — and its DB connection — open indefinitely, which is
 * how a single slow dependency turns into a site-wide outage.
 *
 * The numbers below are deliberately generous: they are circuit breakers for a
 * genuinely stuck connection, NOT latency SLOs. Every budget is at least an
 * order of magnitude above the call's observed happy-path latency, so a call
 * that succeeds today still succeeds.
 *
 * Apply them with `signal: AbortSignal.timeout(MS)` — the same pattern already
 * used by app/api/ai-image/route.ts. Use an explicit `AbortController` only when
 * the call must also be abortable for some other reason.
 */

/**
 * MercadoPago REST API (api.mercadopago.com): read a preapproval/payment, open
 * or cancel a preapproval. A single JSON round-trip against a hosted payments
 * API — normally well under a second.
 *
 * NOTE: the two `cancelMpPreapproval()` helpers (app/api/mp/create-subscription
 * and app/api/projects/[id]/cancel) predate this file and use their own 8s
 * AbortController. Left as-is: they are already bounded, and 8s vs 10s makes no
 * practical difference for a best-effort cancel.
 */
export const MP_API_TIMEOUT_MS = 10_000

/**
 * n8n provisioning / deprovisioning webhooks (the `N8N_*_WEBHOOK` env vars, and
 * the alj-tenants-remove webhook). n8n runs the workflow synchronously and only
 * then answers, so these are slower than a plain API call: cloning a workflow
 * or wiring a tenant does real work upstream.
 */
export const N8N_WEBHOOK_TIMEOUT_MS = 15_000

/**
 * n8n management REST API (`${N8N_API_URL}/api/v1/...`), e.g. activating or
 * deactivating a workflow. Control-plane only — a flag flip in n8n's own
 * database, not a workflow execution — so it gets the shorter API budget rather
 * than the webhook one.
 */
export const N8N_ADMIN_API_TIMEOUT_MS = 10_000

/**
 * Flask billing backend (`FLASK_BACKEND_URL`, facturación): tenant provision and
 * deprovision. Creates/disables a tenant plus its user rows, so it is heavier
 * than a read but still a single bounded transaction.
 */
export const FLASK_BACKEND_TIMEOUT_MS = 15_000

/**
 * Causas scraper — tenant registration (`POST /api/tenant`). The slowest call in
 * the codebase: the scraper validates the tenant's MEV credentials by actually
 * logging in to the judicial portal before answering.
 */
export const SCRAPER_REGISTER_TIMEOUT_MS = 30_000

/**
 * Causas scraper — control-plane calls (`/scrape`, `/deactivate`). These only
 * enqueue or flag work and return immediately; the scraping itself happens
 * out-of-band ("los resultados estarán disponibles en unos minutos").
 */
export const SCRAPER_CONTROL_TIMEOUT_MS = 20_000

/**
 * Self-call from the MercadoPago webhook to our own /api/causas/provision.
 *
 * MUST stay strictly larger than SCRAPER_REGISTER_TIMEOUT_MS: that route's own
 * scraper call is the bulk of its work, and a caller budget below the callee's
 * would abort every slow-but-successful provision, orphaning a tenant the
 * scraper did in fact create. The extra 5s covers auth, credential decryption
 * and the DB write around it.
 */
export const INTERNAL_PROVISION_TIMEOUT_MS = 35_000
