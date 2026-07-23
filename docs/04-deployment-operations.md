# 4. Deployment & operations

**The most valuable doc in this tree, and most of it is not in the code.** Much
of what follows are operational facts about the running VPS, EasyPanel, DNS, and
the scheduled jobs. Where a claim is grounded in a repo file, the path is cited.
Where it is an operational fact that a reader can verify on the box, the
verification command is given. Items marked `⚠️ unverified` could not be
confirmed from this repo.

## Contents
- [The topology](#the-topology)
- [Deploying: EasyPanel does NOT build](#deploying-easypanel-does-not-build)
- [SSH to the VPS (IPv6, not IPv4)](#ssh-to-the-vps-ipv6-not-ipv4)
- [Env vars are ephemeral on `docker service update`](#env-vars-are-ephemeral-on-docker-service-update)
- [The Prisma standalone / musl gotcha](#the-prisma-standalone--musl-gotcha)
- [Migrations: onboarding a fresh DB vs the existing prod DB](#migrations-onboarding-a-fresh-db-vs-the-existing-prod-db)
- [DNS & wildcard TLS](#dns--wildcard-tls)
- [Health](#health)
- [Observability](#observability)
- [Scheduled jobs (n8n, NOT the Dockerfile)](#scheduled-jobs-n8n-not-the-dockerfile)
- [Backups](#backups)
- [The OneDrive git hazard](#the-onedrive-git-hazard)

## The topology

- **Host:** Hostinger VPS, `76.13.71.141`, hostname `srv1281000.hstgr.cloud`.
- **Orchestration:** EasyPanel (Docker Swarm + Traefik).
- **Image:** one Next.js standalone container (`Dockerfile`, Alpine/musl, Node 20). `CMD` = `prisma migrate deploy && node server.js` — a failed migration leaves the container down rather than serving a half-applied schema.
- **DNS/TLS:** Cloudflare zone + Traefik with a DNS-01 wildcard resolver.

## Deploying: EasyPanel does NOT build

> **This is the single most important operational fact.** EasyPanel's
> `deployService` action and the deploy webhook **only run `git pull`. They do
> NOT build the image.** A real deploy must build manually on the VPS.

There is a script on the VPS at **`/root/deploy-siteai.sh`** that does the full
flow. Run it:

```sh
ssh vps-hostinger
/root/deploy-siteai.sh
```

What the script does (in order):

1. **Baseline check** — capture current state before touching anything.
2. `git reset --hard origin/main` — force the checkout to the deployed commit.
3. `docker buildx build` with **build-args read from the Swarm service env** — so the `NEXT_PUBLIC_*` values baked into the image match what the running service expects (these are build-time inlined; see the Prisma/musl and env sections).
4. **Verify the Prisma musl engine is present in the built image — aborts if missing** (see [the musl gotcha](#the-prisma-standalone--musl-gotcha)).
5. `docker service update --force` — roll the service onto the new image.
6. **Post-deploy baseline** — confirm the new state.

> ⚠️ **unverified from this repo:** the script itself lives on the VPS, not in
> this checkout, so the exact commands/flags above come from the deployment
> notes, not from a file here. Read `/root/deploy-siteai.sh` on the box for the
> authoritative version. The *reason* a manual build is needed IS grounded: the
> `Dockerfile` runs `next build` at image-build time and the `CMD` only runs
> `migrate deploy` + `node server.js` — nothing in the repo builds on a git
> pull.

## SSH to the VPS (IPv6, not IPv4)

SSH works **over IPv6**, not the raw IPv4 address — the IPv4 is filtered from the
dev network. The working config in `~/.ssh/config`:

```
Host vps-hostinger
    HostName srv1281000.hstgr.cloud
    AddressFamily inet6
    IdentityFile ~/.ssh/vps_n8n_backup
```

So `ssh vps-hostinger` works; `ssh root@76.13.71.141` (IPv4) does not from the
dev network. The private key is `~/.ssh/vps_n8n_backup` (value never reproduced
here).

> ⚠️ **unverified from this repo:** `~/.ssh/config` is on the developer machine,
> not in this checkout. Grounded only as a session/operational note.

## Env vars are ephemeral on `docker service update`

> **Env vars set via `docker service update --env-add` are EPHEMERAL.** EasyPanel
> regenerates the service spec on its own deploys and **wipes them.**

The **durable** place for an env var is EasyPanel's stored env, set through the
tRPC call `services.app.updateEnv`. Because that call replaces the whole
multiline env string, you must **read-modify-write the entire block** — a naive
overwrite drops the other ~44 variables the service needs.

For **immediate** effect (without waiting for a redeploy) you also apply the var
with `docker service update --env-add`, understanding it will be wiped on the
next EasyPanel deploy unless it is also in the stored env.

This exact trap bit `CRON_SECRET` and `ADMIN_EMAILS`: set only via
`--env-add`, they vanished on the next panel deploy. Both must live in the stored
env. Their failure modes:
- `CRON_SECRET` missing/unset → `hasValidCronSecret()` fails closed, the `expire-trials` endpoint is permanently locked, trials never expire and grace never persists (`app/api/admin/expire-trials/route.ts`).
- `ADMIN_EMAILS` missing → admin allowlist silently falls back to the single default address (`lib/admin.ts`, `lib/admin-emails.ts`).

Full variable reference: [`docs/deploy/ENVIRONMENT.md`](./deploy/ENVIRONMENT.md).

> ⚠️ **unverified from this repo:** the exact tRPC method name
> `services.app.updateEnv` and the "~44 vars" count are operational notes; the
> `--env-add` ephemerality is a Docker Swarm + EasyPanel behaviour, not a repo
> fact. The env-var *names and failure modes* ARE grounded (`instrumentation.ts`,
> `ENVIRONMENT.md`, the route handlers).

## The Prisma standalone / musl gotcha

`prisma/schema.prisma` **must** list the Alpine engine in `binaryTargets`:

```prisma
generator client {
  binaryTargets = ["native", "rhel-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}
```

The runtime image is Alpine (musl) with OpenSSL 3. The Next standalone build only
traces the engines Prisma actually generated, so a **missing `linux-musl-openssl-3.0.x`
target fails at request time, not at build time** — the image builds clean and
then throws on the first query. This is why `/root/deploy-siteai.sh` verifies the
musl engine is in the image and aborts if it isn't. The `Dockerfile` also
installs `openssl` in the runner stage and copies the generated Prisma client /
engines out of the builder rather than re-installing.

## Migrations: onboarding a fresh DB vs the existing prod DB

The container runs `prisma migrate deploy` (never `db push`). The full runbook is
[`docs/deploy/prisma-migration-reconciliation.md`](./deploy/prisma-migration-reconciliation.md);
read it before deploying against production. Summary:

**Existing production DB** (came from a long `db push` era):
- `_prisma_migrations` may be empty while the tables exist, so a naive `migrate deploy` loops (tries to `CREATE TABLE "User"` where it exists).
- **Baseline** the history through `20260720_add_project_billing_lifecycle` with `prisma migrate resolve --applied ...` (writes history rows, runs no DDL).
- Leave `20260721_add_inquiry` and `20260722_catchup_db_push_drift` **unresolved** — they are idempotently guarded (`IF NOT EXISTS`, `DO $$` FK checks) and safe to execute against a populated DB; they add the missing 12 tables etc. and finally align history with the schema.
- Verify with `prisma migrate diff` (must come back empty in both directions) before serving traffic.

**Fresh DB** (new environment): `migrate deploy` from empty applies all migrations cleanly — verified end to end on a throwaway Postgres 16.

**Standing rules:** never `db push` against production; never rename/edit an
applied migration (the `20260321_welcome_coupon` repair was a one-off exception);
don't copy the `IF NOT EXISTS` style into genuinely-new migrations. `migrate
status` is not evidence — trust `migrate diff`.

> The migration set in `prisma/migrations/` currently extends past what the
> runbook enumerates (through `20260727_add_account_deletion`). The runbook's
> reconciliation logic still applies; the later migrations are ordinary
> forward-only ones (`gift_provenance`, `project_indexes`, `site_lead`,
> `coupon_redemption`, `account_deletion`).

Remember the [shared JurisArgentina tables](./01-architecture.md#the-database-is-shared-with-jurisargentina):
`fallos` / `import_stats` show as "extra" in a diff and must not be dropped.

## DNS & wildcard TLS

- **`automaticialab.com` DNS is on Cloudflare.** API token in `06-CREDENCIALES/CLOUDFLARE.txt` (value never reproduced here; that file also records the zone id).
- Wildcard `*.sitios.automaticialab.com` → `A 76.13.71.141`, **DNS-only (grey cloud)**. A bare `sitios` A record too, so the apex resolves.
- **Wildcard TLS is LIVE** (an earlier runbook said "not applied" — that was stale and is now corrected). It is issued via **Traefik DNS-01** using the Cloudflare resolver env vars set on the `easypanel-traefik` Swarm service, with the router created through EasyPanel's `domains.createDomain`.
- **The `wildcard:true` gotcha:** pass the router host **WITHOUT** the leading `*.` (i.e. `sitios.automaticialab.com`). The `wildcard:true` flag prepends the `*.` itself — passing `*.sitios...` yields `*.*.sitios...`, which ACME rejects.

Full runbook, verification checklist, and renewal notes:
[`docs/deploy/traefik-wildcard-tls.md`](./deploy/traefik-wildcard-tls.md). The
app-side host mapping is `lib/site-domain.ts`; do not let any proxy rewrite the
`Host` header — `extractSiteSubdomain()` derives the tenant from it.

> ⚠️ **unverified from this repo:** the Cloudflare zone id, the exact resolver
> env-var names on `easypanel-traefik`, and the specific `A` record values live
> on Cloudflare/the VPS, not in this checkout. The *app requirement* for a
> wildcard and the one-level-only constraint ARE grounded (`lib/site-domain.ts`,
> `lib/subdomain.ts`).

## Health

`GET /api/health` (`app/api/health/route.ts` + `lib/health.ts`) — for uptime
monitoring. **No auth, no secrets.** Returns `{ status, db, uptime, commit }`.

- `pingDb` runs `SELECT 1` (cheapest round trip, no table, no lock), bounded by `HEALTH_DB_TIMEOUT_MS = 2000`.
- **DB unreachable → HTTP 503** (not just a JSON field) so a monitor can alert on the status code alone. A 200 from a process whose DB is down is worse than no check.
- `commit` is `GIT_SHA` **validated to look like a git sha** (`normalizeCommit()`, hex 7–40, truncated to 12) before being echoed — so a mis-set `GIT_SHA` can't leak an env value on a public endpoint.
- `Cache-Control: no-store` — a cached 200 would outlive the outage it should report.

## Observability

- **Structured logger** — `lib/logger.ts`. Zero-dependency. **JSON one-line-per-entry in production** (greppable with `jq`), pretty lines in dev. **Redaction is the point:** every value goes through `redact()` — key-based (`token`, `secret`, `password`, `apikey`, `authorization`, `databaseurl`, `encryptionkey`, …) and value-based scrubbers (MercadoPago `APP_USR-`/`TEST-` tokens, credentials inside any URL, `Bearer`/`Basic` header values). There is **no raw escape hatch** by design. Note `auth` alone is deliberately not redacted so the MP `authorized` status stays visible.
- **Error sink seam for a future Sentry** — `setErrorSink()` at the bottom of `lib/logger.ts` is the one place a Sentry/Bugsnag/OTLP exporter attaches; it receives already-redacted entries. **Not installed today — there is no DSN yet.** Wiring one is a single call in `instrumentation.ts`.
- **Request ids** — `middleware.ts` + `lib/request-id.ts`. `x-request-id` is accepted inbound and always returned outbound (`REQUEST_ID_HEADER`), so a customer complaint ("no me anda", a screenshot) can be tied to exact log lines. It is **never rewritten inbound**, because MercadoPago signs its webhook over a manifest that includes the header it sent (see [doc 3](./03-billing-mercadopago.md)); the internal `x-correlation-id` is what middleware overwrites unconditionally. `lib/request-log.ts` gives route handlers a request-scoped logger.
- **Coverage caveat:** the payment and provisioning paths were converted to the structured logger, but **~180 `console.*` calls remain across `app/` and `lib/`** (measured: 180 lines). Those are not redacted or correlated. (The session note put this at "458+"; the current tree measures ~180 — see the report.)

## Scheduled jobs (n8n, NOT the Dockerfile)

There is **no scheduler in the container.** The `Dockerfile` `CMD` is only
`migrate deploy && node server.js`. Two jobs live in **n8n**:

1. **Daily maintenance** → `POST /api/admin/expire-trials` with the `x-cron-secret` header (`CRON_SECRET`). It (a) expires trials past `trialEndsAt`, (b) **persists generator grace suspension** (`expireStaleGrace()` — so a customer past grace is actually recorded suspended and emailed, since the gate is otherwise read-time only), and (c) **purges accounts past their 30-day deletion window** (folded in on purpose rather than a second cron that could silently stop). See `app/api/admin/expire-trials/route.ts` and [doc 5](./05-admin-operations.md).
2. **Uptime monitor** (every ~10 min) → probes the services + `GET /api/health`, alerts via the **Hermes Telegram bot**.

Gotcha: **env vars written into n8n Code nodes must not be set from bash** —
newline escaping corrupts them. Set them through the n8n UI.

> ⚠️ **unverified from this repo:** the n8n workflow ids are not discoverable in
> this checkout — these workflows live in n8n. The endpoint contract they call IS
> grounded: `expire-trials` requires the `x-cron-secret` header
> (`hasValidCronSecret()`), and `/api/health` is the documented probe. If you
> need the ids, they are in the n8n instance.

## Backups

A daily **VPS cron** (`/opt/backup/vps-backup.sh`, **05:00 UTC**) does a
`pg_dumpall` of every Postgres container plus a restic snapshot.

- **Check it ran:** `/var/log/backup/backup-YYYYMMDD.log`
- **Dumps land in:** `/var/backups/dbs/`

```sh
ssh vps-hostinger
tail -n 40 /var/log/backup/backup-$(date +%Y%m%d).log
ls -la /var/backups/dbs/
```

> ⚠️ **unverified from this repo:** the backup script, its schedule, and the log
> path are on the VPS, not in this checkout. Grounded only as an operational note.

## The OneDrive git hazard

**The repo lives inside a OneDrive-synced folder**, and OneDrive **live-syncs the
`.git` directory.** When two write-agents ran against this checkout concurrently,
OneDrive's sync tangled the commits and corrupted the repository (the reason this
documentation task forbids `git add -A` / `git commit -a` and staging anything
but explicit paths).

- **Do not run concurrent writers** against this checkout.
- The `.gitignore` excludes OneDrive conflict files (`*-DESKTOP-*.tsx`, `*-DESKTOP-*.ts`, …) — you will see stale `*-DESKTOP-7VLBDRD.*` copies of several files in the tree; they are untracked conflict artifacts, not real source.
- **The real fix is moving the repo out of OneDrive.** See [doc 8](./08-known-issues.md).
