# Reconciling the production database before the first `migrate deploy`

**Read this in full before deploying the image built from commit `3fc4bca` or later.**
**Do not skip to the commands.** Two of them are destructive if run in the wrong case.

---

## Why this document exists

Until now the container started with:

```sh
prisma db push --accept-data-loss
```

Two consequences, both of which have to be undone by hand:

1. **`db push` never writes to `_prisma_migrations`.** It diffs the schema against
   the live database and mutates it directly. So production almost certainly has the
   *correct tables* but an *empty or partial* migration history. `migrate deploy`
   reads only that history, so on first run it will try to apply migration `0001_initial`
   — `CREATE TABLE "User" ...` — against a database where `User` already exists, and
   abort with `P3005` / "relation already exists".

2. **`--accept-data-loss` silently hid a broken migration order.** Commit `46ea8b5`
   renamed two migration directories to fix it:

   | Old name | New name |
   |---|---|
   | `20260323_add_contacts_upload_fields` | `20260324_add_contacts_upload_fields` |
   | `20260323_add_email_marketing_indexes` | `20260324_add_email_marketing_indexes` |

   Prisma applies migrations in **lexicographic directory order**. Under the old
   names, `20260323_add_contacts_upload_fields` and `20260323_add_email_marketing_indexes`
   sorted *before* `20260323_add_email_marketing_subscription`, so an `ALTER TABLE`
   and two `CREATE INDEX` ran against a table that did not exist yet. `db push`
   never noticed because it never ran the migration files at all.

   Prisma identifies an applied migration by its **directory name**, which is stored
   verbatim in `_prisma_migrations.migration_name`. A rename is, to Prisma, a brand
   new migration. If the old names are recorded as applied, `migrate deploy` will
   try to run the renamed copies a second time — and `ADD COLUMN` / `CREATE INDEX`
   without `IF NOT EXISTS` fail on the second run.

3. **The history diverged from the schema, and then stopped replaying at all.**
   Because `db push` never executes the migration files, nobody noticed that models
   were entering `prisma/schema.prisma` with no migration behind them — nor that one
   committed migration had become unrunnable. Both are now fixed; see the next
   section.

---

## What changed in `20260722` (read this before re-reading the steps)

Two problems were closed at once. Both alter what this runbook tells you to do.

### 1. `20260321_welcome_coupon` could never execute — it is now repaired

Its `INSERT` listed a `Coupon."updatedAt"` column. `model Coupon` has never had one,
and neither did the `CREATE TABLE "Coupon"` in `20260321_add_monitoring_and_coupons`.
So `migrate deploy` against any database that actually ran the history aborted here:

```
Error: P3018 ... Database error code: 42703
ERROR: column "updatedAt" of relation "Coupon" does not exist
```

This was migration **4 of 11**. With the container `CMD` being
`prisma migrate deploy && node server.js`, a fresh environment did not come up
degraded — it **restart-looped and never served traffic at all**.

This could not be fixed forward: a later migration cannot repair a statement that
aborts the deploy before it is reached. The phantom column was therefore removed from
the `INSERT` in place. That is a deliberate, one-off exception to the "never edit an
applied migration" rule below, and it is safe here because the migration **has never
been applied by execution anywhere** — it was not capable of it. Any database that
lists it in `_prisma_migrations` got there via `migrate resolve --applied`, which runs
no SQL.

**Operator impact: none, verified.** Editing the file changes its checksum, but
neither `prisma migrate deploy` nor `prisma migrate status` validates the checksum of
an already-recorded migration — both were tested against a database holding a
deliberately corrupted checksum and reported `No pending migrations to apply.` /
`Database schema is up to date!`. If a local `prisma migrate dev` ever complains that
the file was modified, settle it with:

```sh
# only if some tool actually complains — not needed for deploy
psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260321_welcome_coupon';"
npx prisma migrate resolve --applied 20260321_welcome_coupon
```

One real behaviour change: the `BIENVENIDA10` coupon row now actually gets inserted on
a fresh database. It never did before. The statement is `ON CONFLICT ("code") DO NOTHING`,
so it will not disturb an existing production row.

### 2. `20260722_catchup_db_push_drift` closes the whole `db push` gap

`schema.prisma` declares 19 models; the committed history only ever `CREATE TABLE`d 7.
The catch-up migration adds the missing **12 tables, 25 indexes, 5 columns and 21
foreign keys** — `PasswordResetToken`, `Media`, and the `Trading` / `LinkedIn` /
`Leads` / `Prospeccion` / `Facturacion` / `Causas` / `Turnos` / `SuiteJuridica` /
`LexPost` subscription tables, `CausasCase`, plus `User.isFreeAccount`,
`User.freeAccountNote` and three `trialEndsAt` columns.

Like `20260721_add_inquiry`, **it is fully guarded and safe to run against a database
that already has these objects** — which production does, courtesy of `db push`.

Verified end to end on a throwaway Postgres 16: `migrate deploy` from empty applies all
12 migrations, and

```sh
npx prisma migrate diff --from-url <db> --to-schema-datamodel prisma/schema.prisma
```

reports `No difference detected.` in **both** directions. The guarded SQL was then
re-executed against the fully populated database (by deleting its history row and
re-running deploy — the exact production shape) and applied cleanly with no errors.

---

## Step 0 — Take a backup. Non-negotiable.

```sh
pg_dump "$DATABASE_URL" --format=custom --file=pre-migrate-$(date +%Y%m%d-%H%M).dump
```

Verify the dump is non-empty and restorable before continuing. Every step below is
reversible from this file and from nothing else.

---

## Step 1 — Find out which case you are in

Connect read-only and inspect the history table:

```sql
-- Does the table exist at all?
SELECT to_regclass('public._prisma_migrations');

-- If it does, what is recorded?
SELECT migration_name,
       finished_at,
       rolled_back_at,
       applied_steps_count
FROM   _prisma_migrations
ORDER  BY started_at;
```

Also confirm the schema really is current, since `db push` is what shaped it:

```sql
-- expect: googleSheetId, contactsUploadedAt
SELECT column_name
FROM   information_schema.columns
WHERE  table_name = 'EmailMarketingSubscription'
  AND  column_name IN ('googleSheetId', 'contactsUploadedAt');

-- expect: both indexes
SELECT indexname
FROM   pg_indexes
WHERE  tablename = 'EmailMarketingSubscription'
  AND  indexname IN (
         'EmailMarketingSubscription_userId_status_idx',
         'EmailMarketingSubscription_userId_businessName_idx'
       );

-- expect: subdomain (added 20260719), billing lifecycle columns (20260720)
SELECT column_name
FROM   information_schema.columns
WHERE  table_name = 'Project'
  AND  column_name IN ('subdomain', 'billingStatus');

-- Inquiry: expected to ALREADY EXIST on any db push database, even though
-- 20260721_add_inquiry has obviously never been recorded as applied.
-- Either answer is fine — see "The two guarded migrations" below.
SELECT to_regclass('public."Inquiry"');

-- The 20260722 catch-up set: also expected to ALREADY EXIST on a db push database,
-- and also never recorded. Either answer is fine, for the same reason.
-- On production expect 12; on a fresh database expect 0.
SELECT count(*)
FROM   information_schema.tables
WHERE  table_schema = 'public'
  AND  table_name IN (
         'PasswordResetToken','Media','TradingSubscription','LinkedInSubscription',
         'LeadsSubscription','ProspeccionSubscription','FacturacionSubscription',
         'CausasSubscription','CausasCase','TurnosSubscription',
         'SuiteJuridicaSubscription','LexPostSubscription'
       );

-- expect: isFreeAccount, freeAccountNote
SELECT column_name
FROM   information_schema.columns
WHERE  table_name = 'User'
  AND  column_name IN ('isFreeAccount','freeAccountNote');
```

> `billingStatus` is the column named in `20260720_add_project_billing_lifecycle`;
> if your local `migration.sql` names it differently, use the real name. Check with
> `bat prisma/migrations/20260720_add_project_billing_lifecycle/migration.sql`.

### The two guarded migrations — read before Case A

`Inquiry` was not the only model that entered `prisma/schema.prisma` without a
migration during the `db push` era, just the first one fixed. Twelve more models were
in the same position. Two migrations now close the whole gap, and **both are written
with idempotency guards** precisely because their target database may be in either
state:

| Migration | Covers |
|---|---|
| `20260721_add_inquiry` | `Inquiry` — backs `POST /api/inquiries`, the lead-capture endpoint for automaticialab.com |
| `20260722_catchup_db_push_drift` | The remaining 12 tables, 25 indexes, 5 columns, 21 foreign keys |

| Database | What they do |
|---|---|
| Production / anything that ran `db push` | Objects already present — apply as a no-op, record the history rows |
| Fresh database, new environment, restored-from-schema | Create everything |

Consequences for this runbook:

- **Do not `migrate resolve --applied` either of them.** Both are deliberately absent
  from the Case A baselining list below. Let `migrate deploy` execute them. If you
  baseline them away on a database that turns out *not* to have the objects, they are
  never created and you get runtime 500s with no error to point at.
- It is safe to let deploy run them **even if Step 1 showed the objects already
  exist**. That is the whole reason for the guards, and these are the only migrations
  here to which the "only resolve what already exists" rule does not apply in reverse.
- Guard coverage, by object type — `CREATE TABLE` and `CREATE INDEX` use
  `IF NOT EXISTS`; `ADD COLUMN` uses `IF NOT EXISTS` (Postgres supports it per clause);
  foreign keys have no `IF NOT EXISTS` form in Postgres, so each is wrapped in a
  `DO $$ ... $$` block that checks `pg_constraint` for that exact
  `(conname, conrelid)` pair first. The schema declares no enums, so no `CREATE TYPE`
  guard is needed. **Nothing was left unguarded.**
- The guards are safe rather than drift-hiding *for these objects specifically*: the
  production copies were created by `db push` from this same schema, so their shape is
  the schema's shape by construction. Note the limit though — `IF NOT EXISTS` matches
  on **name**, not shape, so a pre-existing object that differs would be silently
  accepted. Run the drift check under **Verification** to confirm rather than assume.
  Do not treat any of this as licence to write `IF NOT EXISTS` in new migrations — see
  "Rules from here on".

Now pick your case:

| What you saw | Go to |
|---|---|
| `to_regclass` returns `NULL`, or the table is empty | **Case A** |
| Rows exist, none named `20260323_add_contacts_upload_fields` or `20260323_add_email_marketing_indexes` | **Case B** |
| Rows exist and include either `20260323_` name above | **Case C** |

---

## Case A — no migration history (the expected case for a `db push` database)

The database is already at the right shape; you only need to tell Prisma that the
whole existing history is already applied. This is Prisma's **baselining** flow.
It writes rows to `_prisma_migrations` and **executes no DDL**.

Run these from a machine that has the repo checked out at the deploying commit,
with `DATABASE_URL` pointed at production:

```sh
npx prisma migrate resolve --applied 0001_initial
npx prisma migrate resolve --applied 20260321_add_monitoring_and_coupons
npx prisma migrate resolve --applied 20260321_add_notification_email
npx prisma migrate resolve --applied 20260321_welcome_coupon
npx prisma migrate resolve --applied 20260322_add_reviews_subscription
npx prisma migrate resolve --applied 20260323_add_email_marketing_subscription
npx prisma migrate resolve --applied 20260324_add_contacts_upload_fields
npx prisma migrate resolve --applied 20260324_add_email_marketing_indexes
npx prisma migrate resolve --applied 20260719_add_project_subdomain
npx prisma migrate resolve --applied 20260720_add_project_billing_lifecycle
```

> `20260721_add_inquiry` and `20260722_catchup_db_push_drift` are **intentionally not
> in that list.** Leave both unresolved and let `migrate deploy` apply them — they are
> idempotent. See "The two guarded migrations" above.

> `20260321_welcome_coupon` **stays** in the list. Resolving it is still correct: the
> `Coupon` table exists in production, and the coupon row either exists (in which case
> the repaired `INSERT` would no-op on `ON CONFLICT` anyway) or is not wanted. If you
> would rather production actually get the `BIENVENIDA10` row, leave it unresolved —
> the repaired statement is safe to execute and self-skips on conflict.

> **Only mark a migration `--applied` if Step 1 confirmed its objects already exist.**
> If, say, `Project.subdomain` is *missing*, do **not** resolve `20260719_add_project_subdomain`
> — leave it unresolved so `migrate deploy` actually applies it. Baseline the prefix
> that is genuinely present, stop there, and let deploy handle the tail.

Then go to **Verification**.

---

## Case B — history exists and is already consistent

Nothing to reconcile. The renamed directories were never recorded under their old
names. Go straight to **Verification**.

---

## Case C — the old, pre-rename names are recorded

You must rewrite the two stale rows so Prisma sees the new directory names as
already applied. There is no `prisma migrate` command that renames a history entry,
so this is direct SQL. It touches only Prisma's bookkeeping table — **no application
data**.

Wrap it in a transaction and inspect the row counts before committing:

```sql
BEGIN;

UPDATE _prisma_migrations
SET    migration_name = '20260324_add_contacts_upload_fields'
WHERE  migration_name = '20260323_add_contacts_upload_fields';
-- expect: UPDATE 1

UPDATE _prisma_migrations
SET    migration_name = '20260324_add_email_marketing_indexes'
WHERE  migration_name = '20260323_add_email_marketing_indexes';
-- expect: UPDATE 1

-- Sanity: no duplicates, nothing left under an old name.
SELECT migration_name, count(*)
FROM   _prisma_migrations
GROUP  BY migration_name
HAVING count(*) > 1;
-- expect: 0 rows

COMMIT;
```

If either `UPDATE` reports `0` rows, **`ROLLBACK`** and re-read Step 1 — you are
not in Case C.

If a `SELECT` shows a duplicate (both the old and the new name already present),
`ROLLBACK` and instead delete the stale row rather than renaming it:

```sql
BEGIN;
DELETE FROM _prisma_migrations
WHERE  migration_name IN ('20260323_add_contacts_upload_fields',
                          '20260323_add_email_marketing_indexes');
-- expect: DELETE 1 or 2
COMMIT;
```

### If a row has `finished_at IS NULL` or `rolled_back_at IS NOT NULL`

That migration is recorded as *failed*, and `migrate deploy` refuses to run until
it is settled. Decide from the Step 1 schema queries whether its objects actually
landed:

```sh
# objects ARE present in the schema — record it as done, run no DDL
npx prisma migrate resolve --applied <migration_name>

# objects are NOT present — clear the failed marker so deploy retries it
npx prisma migrate resolve --rolled-back <migration_name>
```

Never use `--rolled-back` on a migration whose objects exist; deploy will then
re-run its DDL and fail on "already exists".

---

## Verification — do this before letting the new image serve traffic

Still from the repo, with production `DATABASE_URL`:

```sh
npx prisma migrate status
```

You want exactly:

```
Database schema is up to date!
```

Anything else — `Following migrations have not yet been applied`, `drift detected`,
`P3005` — means you are not done. **Do not deploy.** Re-read Step 1.

If you see *drift*, the live schema diverged from the migration history under
`db push` (a hand-edited column, an index added in psql). Inspect it without
changing anything:

```sh
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel  prisma/schema.prisma \
  --script
```

An empty script means no drift. A non-empty one is the exact DDL gap; resolve it
deliberately — usually by adding a new, forward-only migration — rather than by
reaching for `db push` again.

> **This script should now come back EMPTY.** Earlier revisions of this runbook warned
> that it would be large, and listed `PasswordResetToken`, the `Prospeccion` /
> `Facturacion` / `Causas` / `Turnos` / `SuiteJuridica` / `LexPost` subscription
> tables, `User.isFreeAccount` and the `trialEndsAt` columns as known, tracked debt
> each needing its own forward-only migration. **`20260722_catchup_db_push_drift`
> supersedes that note — the debt is paid.** A fresh environment can now be stood up
> from migrations alone; that is verified by the acceptance test described in
> "What changed in `20260722`" above.
>
> So a non-empty script here no longer means "expected backlog". It means **new,
> genuine drift** that appeared after `20260722` — investigate it, do not wave it
> through, and do not paste it into production as one ad-hoc migration.

### What to do with an existing production database that already has these tables

This is the expected case, and the short answer is **nothing special**.

1. Baseline the history through `20260720_add_project_billing_lifecycle` (Case A),
   leaving `20260721_add_inquiry` and `20260722_catchup_db_push_drift` unresolved.
2. Run `migrate deploy`. Both guarded migrations execute for real against your existing
   objects. Every statement in them is guarded, so each one finds its object already
   present and does nothing. What you gain is the two `_prisma_migrations` rows — the
   history finally matches the database.
3. Run the drift check above. It should print nothing.

Do **not** `db push`, do **not** drop anything, and do **not** try to hand-pick which
statements inside the catch-up migration to run. It is designed to be executed whole
against exactly your situation.

The one thing worth checking first, because the guards match on name and not on shape:
if you ever hand-edited a column or index in psql during the `db push` era, that
divergence will survive this migration silently. Step 3's drift check is what catches
it — which is why it is a step and not a suggestion.

---

## Then deploy

The container's `CMD` is now:

```sh
prisma migrate deploy && node server.js
```

The `&&` is deliberate. A failed migration leaves the container **down** instead of
serving traffic against a half-applied schema. On the first boot after this
reconciliation, watch the logs:

```sh
docker compose logs -f app
```

Expect `No pending migrations to apply.` (Case A/B/C, already reconciled) or a list
of applied migrations. If you instead see the container restart-looping on a
migration error, the reconciliation was incomplete — stop, restore the Step 0 dump
if any DDL landed, and start over.

---

## Rules from here on

- **Never run `db push` against production again.** It is not in the container
  `CMD` any more; do not reintroduce it, and do not run it by hand "just this once".
  `npm run db:push` is a local-development convenience only.
- **Never rename or edit a migration directory that has already been applied
  anywhere.** Prisma keys on the directory name and stores a checksum of the SQL;
  either change turns into a phantom migration or a checksum failure. Fix forward
  with a new migration. The `20260321_welcome_coupon` repair described above is the
  single exception ever granted, and only because that migration was *incapable* of
  having been applied by execution. That is a very high bar. Do not reuse it.
- **The history replays cleanly again.** The `P3006` failure that used to break
  `prisma migrate dev` in this repo is fixed — it was the `welcome_coupon` bug. Both
  `migrate dev` and `migrate diff --from-migrations` work now.
- **New migrations are authored with `npx prisma migrate dev` against a local
  database**, committed, and applied to production only via `migrate deploy`.
- **Never hand-write migration DDL.** Generate it. To check what a fresh database
  would get versus the schema — the check that would have caught this entire class of
  bug years earlier:

  ```sh
  npx prisma migrate diff \
    --from-migrations      prisma/migrations \
    --to-schema-datamodel  prisma/schema.prisma \
    --shadow-database-url  <a scratch db url> \
    --script
  ```

  Note `--from-migrations`, not `--from-schema-datasource`. It compares the schema to
  **what the migration files actually build**, which is the thing that was drifting.
- **`prisma migrate status` is not evidence.** It only compares the migrations folder
  to `_prisma_migrations`. It reported `Database schema is up to date!` throughout the
  entire period when the migrations built a database missing 12 of 19 tables — it is
  precisely the signal that hid this problem. Trust `migrate diff` instead.
- **Do not copy the `IF NOT EXISTS` style of `20260721_add_inquiry` or
  `20260722_catchup_db_push_drift` into new migrations.** They exist only to reconcile
  objects that the `db push` era already created in production. For genuinely new
  objects, plain `CREATE TABLE` is correct — you *want* it to fail loudly if something
  unexpected is already there.
