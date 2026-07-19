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
```

> `billingStatus` is the column named in `20260720_add_project_billing_lifecycle`;
> if your local `migration.sql` names it differently, use the real name. Check with
> `bat prisma/migrations/20260720_add_project_billing_lifecycle/migration.sql`.

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
  with a new migration.
- **New migrations are authored with `npx prisma migrate dev` against a local
  database**, committed, and applied to production only via `migrate deploy`.
