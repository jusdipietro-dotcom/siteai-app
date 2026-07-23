# 8. Known issues / decisions / pending

The owner-facing list of what is unfinished, deliberately deferred, or a
conscious tradeoff. Each item says whether it is grounded in code or is a
session/operational note.

## Blocking before the first real customer

- **⚠️ MercadoPago has never been tested against the real API.** Do a full **sandbox subscription** end-to-end (preapproval → authorized → recurring charge → failed charge → cancellation) before onboarding a paying customer. The webhook is idempotent, HMAC-verified, and re-fetches from MP, but none of it has been exercised live. See [doc 3](./03-billing-mercadopago.md). *(Session note; the code is real and reviewable but unverified end-to-end.)*

## Content honesty debts

- **`data/blog-posts.ts` contains false-AI copy.** Blog content presents AI-generated claims as if genuine. *(Session note — this file is on the protected list and was NOT touched by this documentation pass; confirm and rewrite before relying on it publicly.)*
- **"Soporte prioritario" is unbacked.** It is the one Professional-plan feature line in `lib/website-plans.ts` with no code behind it — kept deliberately as a human commitment. Honour it operationally or drop the line; it is the only unverifiable claim left on that plan. *(Grounded: `lib/website-plans.ts` comment.)*

## Lifecycle gaps

- **External-tenant deprovision on cancel is not fully done.** When a subscription is cancelled, the local status flips and *some* products trigger deprovisioning (n8n `alj-tenants-remove`, Flask, scraper, Turnos n8n deactivate), but coverage is uneven and several paths no-op with only a warning when their webhook env var is unset. Audit each product's deprovision path before assuming a cancelled tenant is actually torn down externally. *(Grounded: `app/api/mp/webhook/route.ts` — `trigger*Deprovisioning` helpers and the unset-env warnings.)*
- **Grace→suspended is read-time only.** The public gate and `effectiveBillingStatus()` take a site down the instant grace elapses, but the *stored* row, the suspension email, and operator reports depend on either a failed-charge webhook arriving after expiry or the daily `expire-trials` job running (`expireStaleGrace()`). There is no scheduler in the container. If the n8n job stops, sites still go dark correctly but owners may not be emailed and reports drift. *(Grounded: `lib/project-billing.ts`, `app/api/admin/expire-trials/route.ts`.)*

## Data-model limitations (no analytics)

- **`Project.views` has no time dimension** — a single cumulative counter, no per-visit table anywhere in the schema. "Visits in the last 30 days" cannot be computed and is deliberately not shown.
- **Subscription cancellations have no timestamp** — the 12 subscription products carry `status: 'cancelled'` but no cancellation date (`updatedAt` moves on any write). Only the website generator's cancellations are dated (`suspendedAt` + `suspendedReason`).
- **Therefore no churn / retention / trend metrics.** Adding them requires a per-visit table and a dated cancellation column. *(All grounded: `lib/admin-overview.ts` header, `prisma/schema.prisma`.)*

## Infrastructure hazards

- **The repo lives inside OneDrive**, which live-syncs `.git` and has already tangled commits when two writers ran concurrently. Do not run concurrent writers against this checkout; the real fix is moving the repo out of OneDrive. Stale `*-DESKTOP-7VLBDRD.*` conflict copies exist in the tree (git-ignored). *(Session note + `.gitignore` evidence.)*
- **Sentry seam awaiting a DSN.** `lib/logger.ts` `setErrorSink()` is the one attach point for an error tracker; it is intentionally not installed because there is no account/DSN yet — a half-configured tracker is a silent failure. Wiring it is a single call in `instrumentation.ts`. *(Grounded: `lib/logger.ts`.)*
- **~180 `console.*` calls remain** across `app/` and `lib/` — not redacted, not correlated. The payment and provisioning paths were converted to the structured logger; the rest were not. *(Grounded: measured in the tree. The session note said "458+"; the current checkout measures ~180 — see the report's contradictions section.)*

## Product decisions (not bugs)

- **Preview-vs-published convergence is a deliberate product decision.** Three renderers exist (one published server component with its own `<html>`, two client previews that show unsaved state) and they converge by composing the same shared section components in `components/site/sections/`. The duplication is intentional — the previews must render unsaved state a server component can't see — and the shared components are how they are kept visually identical. Treat any divergence as a bug in the shared components, not a reason to collapse the three. *(Grounded: `components/site/PublishedSite.tsx`, `components/site/sections/`.)*

## Migration/runbook drift (minor)

- `docs/deploy/prisma-migration-reconciliation.md` enumerates migrations through `20260722`; the tree now has more (through `20260727_add_account_deletion`). The reconciliation logic still applies — the later migrations are ordinary forward-only ones. *(Grounded: `prisma/migrations/`.)*
