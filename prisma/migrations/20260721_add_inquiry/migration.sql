-- The `Inquiry` model reached `prisma/schema.prisma` without a migration: it was
-- only ever materialised by the `prisma db push` that used to run as the container
-- CMD. Every database that booted that image therefore ALREADY HAS this table,
-- shaped exactly as below, but has no `_prisma_migrations` row for it.
--
-- This migration is deliberately written with IF NOT EXISTS so it is correct in
-- both worlds:
--   * fresh database (no `db push` history)  -> creates the table and indexes
--   * `db push` database (table already there) -> applies cleanly as a no-op
--
-- That means operators do NOT need to decide whether to `migrate resolve --applied`
-- this one during reconciliation; letting `migrate deploy` run it is always safe.
-- See docs/deploy/prisma-migration-reconciliation.md.
--
-- The DDL below is the verbatim output of:
--   prisma migrate diff --from-empty --to-schema-datamodel <Inquiry model> --script
-- with only the IF NOT EXISTS guards added.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "packageId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "website" TEXT,
    "budget" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Inquiry_service_status_idx" ON "Inquiry"("service", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");
