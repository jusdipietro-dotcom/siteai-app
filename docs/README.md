# Technical documentation — `business-site-generator`

The platform behind **automaticialab.com**: a Next.js 14 (App Router) + Prisma +
PostgreSQL + NextAuth application that hosts a self-service website generator
(the primary product documented here) alongside twelve MercadoPago-billed
subscription products.

This tree is written for two readers: a developer who inherits the repo cold,
and the owner debugging a production incident at 3am. Every claim is grounded in
a real file path. Where something could not be confirmed from code, it is marked
`⚠️ unverified`.

## Index

| # | Doc | What it covers |
|---|-----|----------------|
| 1 | [Architecture](./01-architecture.md) | Request flow, multi-tenancy, the shared publish gate, the shared JurisArgentina database |
| 2 | [The website generator (product)](./02-website-generator.md) | Data model, wizard→editor→preview→publish, subdomains, the three renderers, leads, SEO tiers |
| 3 | [Billing & MercadoPago](./03-billing-mercadopago.md) | Plans, preapproval flow, the webhook, the billing lifecycle, coupons, plan-id guards |
| 4 | [Deployment & operations](./04-deployment-operations.md) | **The most valuable doc.** Manual deploy on the VPS, SSH, env-var durability, Prisma musl gotcha, migrations, DNS/TLS, health, observability, n8n jobs, backups, the OneDrive hazard |
| 5 | [Admin & operations surface](./05-admin-operations.md) | `/admin/*`, admin auth, gifting, account deletion two-phase model |
| 6 | [Security model](./06-security.md) | Server-side paywall gates, credential encryption, the honesty rule, webhook HMAC, plan-id guards |
| 7 | [Testing](./07-testing.md) | Vitest suite, coverage, mutation-testing discipline, build gates |
| 8 | [Known issues / decisions / pending](./08-known-issues.md) | The owner-facing pending list |

## Deploy runbooks (referenced by code, kept in place)

These pre-date this tree and are referenced **by exact path** from code comments
(`prisma/schema.prisma`, `instrumentation.ts`, the `Dockerfile`). They are NOT
moved — moving them would break those references. Doc 4 links into them.

- [`docs/deploy/ENVIRONMENT.md`](./deploy/ENVIRONMENT.md) — every env var, what it does, what breaks without it
- [`docs/deploy/prisma-migration-reconciliation.md`](./deploy/prisma-migration-reconciliation.md) — reconciling the `db push`-era production DB before `migrate deploy`
- [`docs/deploy/traefik-wildcard-tls.md`](./deploy/traefik-wildcard-tls.md) — wildcard TLS runbook (status corrected: **live in production**)

## Fast orientation

- **Stack:** Next.js `14.2.5`, React 18, Prisma 5, PostgreSQL, NextAuth 4, Tailwind, Zustand. See `package.json`.
- **Runtime:** a single standalone Docker image (`Dockerfile`), Alpine/musl, on a Hostinger VPS under EasyPanel (Docker Swarm + Traefik).
- **Entry points to read first:** `middleware.ts` (routing + multi-tenancy), `lib/published-site.ts` (the publish gate), `app/api/mp/webhook/route.ts` (the money path), `lib/account-deletion.ts` (deletion policy as code).
- **The database is SHARED with JurisArgentina.** See doc 1 before running any `prisma migrate diff` against production.
