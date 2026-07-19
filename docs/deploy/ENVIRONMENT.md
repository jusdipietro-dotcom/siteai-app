# Environment variables

Every variable the application reads, what it does, and what breaks without it.

Create a `.env` next to `docker-compose.yml`. **It is never committed.**
There is also a `.env.example` in the repo root; this document is the
authoritative reference, since it records failure modes, not just names.

## How to read this

- **Required** — the container **refuses to start** in production without it.
  See `instrumentation.ts`. In development these only warn.
- **Recommended** — the app boots, but a whole subsystem is silently dead.
- **Optional** — has a working default, or gates a feature that is simply off.

> **Build-time vs runtime.** Everything prefixed `NEXT_PUBLIC_` is **inlined into
> the JavaScript bundle when the image is built**. Setting it in `.env` and
> restarting changes nothing. It must be passed as a `build.arg` (docker-compose
> already does this) and the image rebuilt:
> `docker compose build --no-cache app`.

---

## Required — startup aborts without these

| Variable | Purpose | What breaks without it |
|---|---|---|
| `DATABASE_URL` | Postgres connection string for Prisma (`prisma/schema.prisma`). With the bundled compose stack: `postgresql://USER:PASS@db:5432/DBNAME`. | Everything. Prisma cannot connect and `migrate deploy` fails, so the container never gets past its `CMD`. |
| `NEXTAUTH_SECRET` | Signs and encrypts NextAuth session JWTs (`lib/auth.ts`). Generate with `openssl rand -base64 32`. | No one can log in or stay logged in. Rotating it invalidates every active session. |
| `MP_ACCESS_TOKEN` | MercadoPago server API token, sent as `Bearer` from ~13 `app/api/mp/create-*` routes. | Every checkout and subscription creation fails. The code uses `process.env.MP_ACCESS_TOKEN!`, which is a compile-time assertion only — at runtime it sends `Bearer undefined` and MercadoPago answers 401. |
| `MP_WEBHOOK_SECRET` | HMAC-SHA256 verification of inbound MercadoPago webhooks (`app/api/mp/webhook/route.ts`). | **The worst failure in this list.** Every webhook is rejected with 403. Customers are charged, no subscription is ever activated, no service is provisioned, and nothing in the logs looks like an error. This is the single strongest reason startup now hard-fails. |
| `CREDENTIALS_ENCRYPTION_KEY` | AES-256-GCM key for stored third-party credentials (`lib/encryption.ts`). **Minimum 32 characters.** 64 hex chars are used raw; anything else is scrypt-derived. Generate with `openssl rand -hex 32`. | `lib/encryption.ts` throws on first use — mid-request, long after deploy looked successful. Startup now catches a missing *or too-short* key at boot. **Changing this makes all previously stored credentials undecryptable.** |

---

## Recommended — app boots, a subsystem is silently dead

| Variable | Purpose | What breaks without it |
|---|---|---|
| `DIRECT_URL` | Prisma `directUrl` — bypasses a connection pooler for migrations. | Nothing if Postgres is reached directly (the compose setup). Required only behind PgBouncer/Supabase-style poolers, where `migrate deploy` otherwise hangs or errors. |
| `NEXTAUTH_URL` | Canonical app origin for NextAuth callbacks. Read in `middleware.ts` with fallback `https://automaticialab.com`. | OAuth callbacks and redirects point at the wrong origin behind a reverse proxy. Set it explicitly to the public HTTPS URL. |
| `APP_URL` | Second link in the chain `NEXT_PUBLIC_APP_URL ?? APP_URL ?? 'https://automaticialab.com'`. | Nothing, provided `NEXT_PUBLIC_APP_URL` is correct at build time. |
| `ADMIN_EMAILS` | Comma-separated admin allowlist (`lib/admin.ts`). Defaults to `automaticialab@gmail.com`. | Admin access silently falls back to that one address. Set it deliberately — it is an authorization boundary. |
| `CRON_SECRET` | Compared against the `x-cron-secret` header on `/api/admin/expire-trials`. | **Fails closed:** when unset the check returns false and the endpoint is permanently locked, so trials never expire and expired users keep full access. |
| `SMTP_USER`, `SMTP_PASS` | Nodemailer credentials (`lib/email.ts`). | All transactional email stops: password resets, booking confirmations, payment notifications. Users cannot recover accounts. |
| `SCRAPER_API_KEY` | Shared provisioning key across LinkedIn, monitoreo, trading, reseñas and the MP webhook. | Those provisioning calls fail auth. **One key, five subsystems** — rotating it affects all of them at once. |

---

## Optional — safe defaults, or a feature that stays off

| Variable | Default | Effect when unset |
|---|---|---|
| `SMTP_FROM` | `Automatic IA Lab <automaticialab@gmail.com>` | Outbound mail uses that From header. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | none | "Sign in with Google" is not registered as a provider (`lib/auth.ts` conditionally spreads it). Email/password login still works. Both are needed; one alone does nothing. |
| `N8N_WEBHOOK_URL` | `https://n8n.abogadoenquilmes.com` | Turnos availability and booking hit the default n8n host. |

### Provisioning integrations — no defaults, silent no-ops

Each of these is skipped when unset. The user's payment succeeds and their
service is simply never provisioned, with no error surfaced. If you sell the
corresponding product, treat the variable as required.

| Variable | Subsystem |
|---|---|
| `N8N_API_URL`, `N8N_API_KEY` | n8n REST API (workflow create/delete). `N8N_API_KEY` also serves as the fallback for `TURNOS_PROVISION_SECRET`. |
| `N8N_PROVISIONING_WEBHOOK` | Generic provisioning |
| `N8N_REVIEWS_PROVISIONING_WEBHOOK`, `N8N_REVIEWS_DEPROVISION_WEBHOOK` | Reseñas |
| `N8N_LEADS_PROVISIONING_WEBHOOK`, `N8N_LEADS_DEPROVISION_WEBHOOK` | Leads |
| `N8N_EMAIL_MARKETING_PROVISIONING_WEBHOOK` | Email marketing |
| `N8N_PROSPECCION_PROVISIONING_WEBHOOK` | Prospección |
| `CAUSAS_SCRAPER_URL`, `CAUSAS_SCRAPER_API_KEY` | Causas scraper. The API key is **dual-purpose**: it authenticates inbound calls to `/api/causas/ingest` and `/api/causas/active-tenants`, *and* is sent outbound. |
| `FLASK_BACKEND_URL`, `FLASK_PROVISION_SECRET` | Facturación ARCA service. The secret must equal `PORTAL_PROVISION_SECRET` in `facturacion-arca/`. |
| `TURNOS_PROVISION_SECRET` | Turnos inbound auth. Falls back to `N8N_API_KEY`; if neither is set the expected value is `undefined`. |
| `LEADS_PROVISION_SECRET` | `/api/leads/provision-callback` inbound auth |
| `PROSPECCION_PROVISION_SECRET` | `/api/prospeccion/provision-callback` inbound auth |

---

## Build-time only — `NEXT_PUBLIC_*`

Passed via `build.args`, **not** `environment`. Changing any of these requires
`docker compose build --no-cache app`.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://automaticialab.com` | Public origin. Used for MercadoPago `back_urls` / `notification_url` and links in email. Read with `??`, so an **empty string wins over the default** — never set it blank. |
| `NEXT_PUBLIC_SITES_DOMAIN` | `sites.automaticialab.com` | Host for path-based published sites (`/s/[slug]`). |
| `NEXT_PUBLIC_SITES_SUBDOMAIN_BASE` | `sitios.automaticialab.com` | Base for subdomain-routed published sites (`/sub/[subdomain]`). This is what the wildcard TLS certificate must cover — see `docs/deploy/traefik-wildcard-tls.md`. |
| `NEXT_PUBLIC_FLASK_URL` | `https://facturacion.automaticialab.com` | Client-side redirect target for the facturación portal. |

`NODE_ENV`, `NEXT_RUNTIME`, `PORT`, `HOSTNAME` and `NEXT_TELEMETRY_DISABLED` are
set by Next.js or by the Dockerfile. `BUILD_STANDALONE` is set in the builder
stage; do not set it at runtime.

---

## Compose-only

| Variable | Purpose |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | Required. Credentials for the bundled `db` service; must match `DATABASE_URL`. |
| `POSTGRES_DB` | Database name, defaults to `business_site_generator`. Must match `DATABASE_URL`. |

---

## Sibling services

These run as separate processes and read their own environment.

**`facturacion-arca/`** (Flask): `SECRET_KEY`, `DATABASE_URL`, `ENCRYPTION_KEY`,
`PDF_DIR`, `JWT_EXPIRATION_HOURS`, `PRODUCTION_ARCA`, `PORTAL_PROVISION_SECRET`.

> `PRODUCTION_ARCA` defaults to `"true"` in `config.py` but `app.py` does
> `setdefault("PRODUCTION_ARCA", "false")`. Set it explicitly — do not rely on
> which one wins.

**`causas-scraper/`** (FastAPI): `API_KEY` (pairs with `CAUSAS_SCRAPER_API_KEY`),
`PORTAL_URL`.

---

## Minimum viable `.env`

Enough to boot. Provisioning integrations stay off.

```dotenv
POSTGRES_USER=bsg
POSTGRES_PASSWORD=<openssl rand -base64 24>
POSTGRES_DB=business_site_generator

DATABASE_URL=postgresql://bsg:<same password>@db:5432/business_site_generator

NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://automaticialab.com

MP_ACCESS_TOKEN=<from the MercadoPago dashboard>
MP_WEBHOOK_SECRET=<from the MercadoPago webhook config>
CREDENTIALS_ENCRYPTION_KEY=<openssl rand -hex 32>

ADMIN_EMAILS=you@example.com
CRON_SECRET=<openssl rand -hex 32>
```

URL-encode any `@`, `:`, `/` or `#` inside the Postgres password, or
`DATABASE_URL` will not parse.

Verify after `docker compose up -d`:

```sh
docker compose logs app | grep STARTUP
```

`[STARTUP] All required env vars validated OK` means the required set is
complete. A `[STARTUP ABORT]` names exactly what is missing.
