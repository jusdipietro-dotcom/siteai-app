# 7. Testing

## Contents
- [Runner](#runner)
- [What is covered](#what-is-covered)
- [The mutation-testing discipline](#the-mutation-testing-discipline)
- [Not in the Docker build](#not-in-the-docker-build)
- [Build gates](#build-gates)

## Runner

- **Vitest.** `npm test` → `vitest run` (`package.json`). Watch mode: `npm run test:watch`.
- Config in `vitest.config.ts`:
  - **`environment: 'node'`** — no jsdom. Nothing mounts; the React section snapshot renders through `react-dom/server`, which needs no DOM, so jsdom would be dead weight. Prisma is never reached — the DB-touching functions take an injectable delegate and tests pass fakes.
  - `esbuild.jsx: 'automatic'` — required because `tsconfig.json` sets `"jsx": "preserve"` (Next compiles JSX itself), so `.tsx` tests would otherwise fail to parse.
  - `restoreMocks: true`, `unstubEnvs: true`. Deterministic by construction: **no test reads the wall clock** — every time-dependent function under test takes an injected `now`.
  - `@/*` alias mirrors `tsconfig.json`.

**Test volume:** 18 test files under `tests/`. Statically there are ~435
`it()`/`test()` blocks, but 12 files use `test.each`/`it.each` tables that expand
into many more executed cases (770 `expect()` assertions total), consistent with
the **~833 tests** figure. To get the exact executed count, run `npm test`.

## What is covered

| Area | File(s) |
|---|---|
| Billing state machine | `tests/project-billing.test.ts`, `tests/trial-and-gate.test.ts` |
| Publish gate | `tests/published-gate.test.ts` |
| Subdomain / host isolation | `tests/subdomain.test.ts`, `tests/site-domain.test.ts` |
| Client-writable allowlist (paywall) | `tests/projectSerializer.test.ts` |
| Plan-id prototype-pollution guards | `tests/plan-guards.test.ts` |
| Account deletion (purge plan, cancellation gating) | `tests/account-deletion.test.ts` |
| `PublishedSite` render snapshot | `tests/published-site-render.test.tsx` |
| SEO output (keywords, JSON-LD, image resolution) | `tests/site-seo.test.ts` |
| Site leads (status narrowing, pagination clamp) | `tests/site-leads.test.ts` |
| MercadoPago preapproval helpers | `tests/mp-preapproval.test.ts` |
| Admin overview / products arithmetic | `tests/admin-overview.test.ts`, `tests/admin-products.test.ts` |
| Structured logger redaction | `tests/logger.test.ts` |
| Health check logic | `tests/health.test.ts` |
| Request-id resolution | `tests/request-id.test.ts` |
| Plan preference | `tests/plan-preference.test.ts` |

The design that makes this coverage possible: the security-critical logic is
extracted into **pure functions** (publish gate, billing status, purge plan,
SEO builders, plan guards) that take plain values and injected dependencies, so
they can be asserted exactly without a database, a server, or the clock.

## The mutation-testing discipline

The convention (evident throughout the test files and their comments): **a test
must be able to fail** — every assertion is written so that a plausible mutation
of the code under test would break it. This is why, for example, the account-
deletion tests assert the *exact* anonymisation payload shape (`buildAnonymisation`
returns a plain object precisely so a destructive statement's effect is
assertable), and the billing tests exercise both the open and elapsed grace
branches rather than only the happy path.

> ⚠️ There is no automated mutation-testing tool wired in (no Stryker config in
> the repo). "Mutation-testing discipline" here is a manual authoring practice,
> not a tool in CI.

## Not in the Docker build

The test suite is **deliberately not wired into the Docker build or the deploy
path** (`vitest.config.ts` header, and the `Dockerfile` runs only `next build`).
The image is produced exactly as fast as before the tests existed. `npm test` is
the single command a future CI would run — there is no CI configured in the repo
today.

## Build gates

From `next.config.js`:

- **`typescript: { ignoreBuildErrors: false }`** — a type error **blocks the build**. Since the `Dockerfile` runs `next build`, a type error now stops the container image from being produced rather than reaching production unnoticed.
- **`eslint: { ignoreDuringBuilds: true }`** — ESLint still does **not** block the build. Lint is advisory; run `npm run lint` separately.
