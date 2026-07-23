# 6. Security model

## Contents
- [The paywall, and why it is server-side](#the-paywall-and-why-it-is-server-side)
- [Credential encryption](#credential-encryption)
- [Webhook HMAC](#webhook-hmac)
- [The plan-id guards](#the-plan-id-guards)
- [The honesty rule (a hard project value)](#the-honesty-rule-a-hard-project-value)
- [Other hardening](#other-hardening)

## The paywall, and why it is server-side

The paywall is enforced entirely server-side; the client-side paywall on the
publish page is UX, not enforcement.

**History it fixes:** publishing used to be an ordinary field write, so
`PUT /api/projects/{id} {"status":"published"}` put a site live for free. The fix
is `lib/projectSerializer.ts`:

- `CLIENT_WRITABLE_FIELDS` is an allowlist: `name`, `slug`, `template`, `businessData`, `sections`, `mediaIds`, `coverImageId`, `thumbnail`, `subdomain`. **Everything else is stripped from a request body before it reaches Prisma.**
- **`status` is not in the list** — that is the paywall. `plan`, `hasPaid`, `preapprovalId`, `views`, `publishedUrl` are also excluded: they are owned by trusted server code only (the webhook, the publish pipeline, the view counter). The module comment is explicit: *"Never add a billing field here — that reopens the paywall bypass."*
- Reaching `published` now requires `POST /api/projects/[id]/publish`, which checks payment server-side: **ownership → `hasPaid` (402 if false) → not suspended (via `effectiveBillingStatus()`, 402 with `subscription_suspended`/`subscription_cancelled`)**. These two gates are exactly what `publishedGate()` requires to *serve* the site, so a publish can never succeed where serving would 404 (`app/api/projects/[id]/publish/route.ts`).
- Non-publish lifecycle transitions go through `sanitizeLifecycleStatus()`, which allows only `draft`/`generating`/`ready`/`error` and **throws loudly on `published`** so a caller can never mistake a silently-stripped field for a successful publish.

The serve-time side of the same gate is `publishedGate()` in
`lib/published-site.ts` — `status: 'published'` AND `hasPaid: true` AND
active-or-in-grace, defined once and shared by both addressing modes (see
[doc 1](./01-architecture.md#the-published-site-gate)). `hasPaid` is required
*alongside* `status`, not implied by it — defence in depth, so if any future code
flips `status` without going through the paid publish endpoint, an unpaid site
still doesn't render.

## Credential encryption

`lib/encryption.ts` — **AES-256-GCM** for third-party credentials stored at rest
(judicial-portal logins for the Monitoring/Causas products: `credentialUser`/
`credentialPass`/`credentialIv`/`credentialTag`, `mevUser`/`mevPass`/`mevIv`/`mevTag`).

- Key from `CREDENTIALS_ENCRYPTION_KEY` (**min 32 chars**; 64 hex chars used raw, anything else scrypt-derived with a fixed salt). Startup aborts on a missing-or-too-short key (`instrumentation.ts`), rather than throwing mid-request on first use.
- Each `encrypt()` uses a random 16-byte IV; the GCM auth tag is stored, so tampering is detected on `decrypt()`.
- Portal helpers pack per-portal (PJN/SCBA) creds as JSON before encryption, storing the two IVs/tags colon-joined.
- **Changing the key makes all previously stored credentials undecryptable** — it is not rotatable without re-encrypting.

## Webhook HMAC

MercadoPago webhooks are HMAC-SHA256 verified (`verifyMPSignature()` in
`app/api/mp/webhook/route.ts`), constant-time compared (`timingSafeEqual`), and
**rejected 403 when `MP_WEBHOOK_SECRET` is unset** — the worst silent failure in
the system, which is why startup hard-fails without it. The webhook also
re-fetches every resource from the MP API rather than trusting the notification
body. Full detail in [doc 3 → The webhook](./03-billing-mercadopago.md#the-webhook).

The signature manifest depends on the inbound `x-request-id`, which is why
`middleware.ts` **never rewrites that header** (`lib/request-id.ts`) — rewriting
it would fail every signature check and leave paying customers unprovisioned.

## The plan-id guards

Untrusted values (request bodies, DB columns) are narrowed by **list membership**,
never by indexing a plain object — because inherited `Object.prototype` keys
(`toString`, `constructor`) resolve truthy and can slip past an `if (!found)`
guard and reach pricing math with an `undefined` amount. Instances:
`isWebsitePlanId()`, `websitePlanRank()`, `schemaTypeForBusinessType()`
(`Object.prototype.hasOwnProperty.call`), `isSiteLeadStatus()`. Rationale and
tests in [doc 3](./03-billing-mercadopago.md#the-plan-id-prototype-pollution-guard)
(`tests/plan-guards.test.ts`).

## The honesty rule (a hard project value)

**No fabricated content on client sites.** This is a hard project value, enforced
in several places, because a fabricated claim on a client's site — or worse, in
its structured data — is one the *client* answers for, not the platform.

- **Rendering** (`components/site/PublishedSite.tsx`) — a section renders only when the owner supplied real content (`dataReady()`); empty sections are omitted, never back-filled with invented services, sample pricing, placeholder gallery tiles, or stock figures. Pricing renders only when a service has a real `price`.
- **JSON-LD** (`lib/site-seo.ts`) — emits only owner-supplied fields; **never** `aggregateRating`, `review`, `openingHours`, `geo`, or `priceRange`. In particular it will **not** average `testimonials[].rating` into a star rating: those are quotes typed into an editor, not verified reviews, and this product has no review verification. (`SiteLead`/stats history: leads and `views` are the real signals the product does surface; no synthetic metrics.)
- **Plan copy** (`lib/website-plans.ts`) — every advertised feature line names something the code actually does and points at where; the sole exception, **"Soporte prioritario"**, is kept deliberately as a human commitment with no code behind it (see [doc 8](./08-known-issues.md)).
- **Admin metrics** (`lib/admin-overview.ts`) — no metric is shown that can't be computed from data that exists; a zero is never rendered where nothing was measured (see [doc 5](./05-admin-operations.md)).

## Other hardening

- **Security headers** (`next.config.js`): a strict CSP, `Strict-Transport-Security` (HSTS preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. The CSP allows Google Tag Manager/Analytics for the GA feature; `connect-src` includes `api.automaticialab.com`.
- **www → non-www** 301 redirect; several legacy SaaS URLs 301 to `/contacto`.
- **Rate limiting** (`lib/rate-limit.ts`) on public write surfaces: webhook (30/min/IP), site-leads (5/10min/IP), coupon redeem (10/min/IP), account-delete (3/15min/IP).
- **Log redaction** (`lib/logger.ts`) — every logged value is scrubbed of secrets, with no raw escape hatch (see [doc 4 → Observability](./04-deployment-operations.md#observability)). The module header notes this codebase has leaked secrets into logs before (EasyPanel prints build secrets in plaintext), which is why redaction is mandatory rather than optional.
- **Anti-spam** — honeypot fields on `/api/site-leads` and `/api/inquiries` (a filled honeypot returns a fake success and stores nothing).
- **Uploads path-traversal guard** — `uploadFilenameFromUrl()` refuses any filename containing `..` or a separator, so a poisoned `Media.url` can't make the purge unlink outside the uploads directory.
