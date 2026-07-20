-- Catch-up migration: everything the `prisma db push` era created in production but
-- never recorded as a migration.
--
-- Until commit 3fc4bca the container CMD was `prisma db push --accept-data-loss`.
-- `db push` mutates the database directly and never writes to `_prisma_migrations`,
-- so models kept landing in prisma/schema.prisma with no migration behind them.
-- The result: schema.prisma declares 19 models, but the whole committed migration
-- history only CREATE TABLEs 7 of them. A fresh `migrate deploy` produced a database
-- missing 12 tables, 25 indexes, 5 columns and 21 foreign keys.
--
-- 20260721_add_inquiry closed that gap for `Inquiry` alone (it backs a live public
-- endpoint). This migration closes the remaining 12 models and the stray columns, so
-- that `migrate deploy` against an empty database now yields a schema that
-- `migrate diff` reports as identical to schema.prisma.
--
-- WHAT IS IN HERE
--   CREATE TABLE  x12  PasswordResetToken, Media, TradingSubscription,
--                      LinkedInSubscription, LeadsSubscription, ProspeccionSubscription,
--                      FacturacionSubscription, CausasSubscription, CausasCase,
--                      TurnosSubscription, SuiteJuridicaSubscription, LexPostSubscription
--   ADD COLUMN    x5   User.isFreeAccount, User.freeAccountNote,
--                      {Monitoring,Reviews,EmailMarketing}Subscription.trialEndsAt
--   CREATE INDEX  x25  (3 of them UNIQUE)
--   ADD CONSTRAINT x21 foreign keys
--
-- HOW IT WAS GENERATED -- this DDL was not hand-written:
--   npx prisma migrate diff \
--     --from-migrations       prisma/migrations \
--     --to-schema-datamodel   prisma/schema.prisma \
--     --shadow-database-url   <scratch db> \
--     --script
-- Only the idempotency guards below were added on top of that output.
--
-- IDEMPOTENCY -- same reasoning as 20260721_add_inquiry.
-- Production ran `db push` for months, so it ALREADY HAS every object below; it just
-- has no history row for any of them. Guarding each statement means this migration is
-- correct in both worlds -- fresh database (creates everything) and db-push database
-- (applies as a no-op) -- so no operator has to make a per-object judgement call about
-- `migrate resolve --applied`. Guards used, by object type:
--   CREATE TABLE / CREATE INDEX  -> IF NOT EXISTS
--   ADD COLUMN                   -> IF NOT EXISTS (Postgres supports this per clause)
--   ADD CONSTRAINT               -> Postgres has NO `IF NOT EXISTS` for constraints,
--                                   so each foreign key is wrapped in a DO $$ block
--                                   that checks pg_constraint for that exact
--                                   (conname, conrelid) pair first.
-- The schema declares no enums and no CREATE TYPE, so no enum guard is needed.
-- Nothing in the generated diff was left unguarded.
--
-- KNOWN LIMIT OF THE GUARDS: `IF NOT EXISTS` matches on NAME, not on shape. If a
-- pre-existing table or index differs from the definition below, this migration
-- silently accepts the divergence. That is acceptable here for the same reason it was
-- for Inquiry: every one of these objects was created by `db push` FROM THIS SCHEMA,
-- so its shape is the schema's shape by construction. Operators should still run the
-- drift check in docs/deploy/prisma-migration-reconciliation.md ("Verification") to
-- confirm rather than assume.
--
-- Do NOT copy this IF NOT EXISTS style into genuinely new migrations -- see
-- "Rules from here on" in docs/deploy/prisma-migration-reconciliation.md.

-- AlterTable
ALTER TABLE "EmailMarketingSubscription" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MonitoringSubscription" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReviewsSubscription" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freeAccountNote" TEXT,
ADD COLUMN IF NOT EXISTS "isFreeAccount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'image',
    "category" TEXT NOT NULL DEFAULT 'misc',
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TradingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "symbols" TEXT NOT NULL DEFAULT 'BTC/USDT,ETH/USDT,SOL/USDT,BNB/USDT,XRP/USDT',
    "timeframe" TEXT NOT NULL DEFAULT '1h',
    "telegramChatId" TEXT,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "signalsSent" INTEGER NOT NULL DEFAULT 0,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LinkedInSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "linkedinName" TEXT,
    "linkedinHeadline" TEXT,
    "industry" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "postsGenerated" INTEGER NOT NULL DEFAULT 0,
    "postsPublished" INTEGER NOT NULL DEFAULT 0,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LeadsSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "googleSheetUrl" TEXT,
    "nichesList" TEXT NOT NULL DEFAULT '[]',
    "citiesList" TEXT NOT NULL DEFAULT '[]',
    "captureFrequency" TEXT NOT NULL DEFAULT '5min',
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "n8nWorkflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadsSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProspeccionSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "nichesList" TEXT NOT NULL DEFAULT '[]',
    "citiesList" TEXT NOT NULL DEFAULT '[]',
    "serviciosDesc" TEXT NOT NULL DEFAULT '',
    "colorPrimario" TEXT NOT NULL DEFAULT '#2563eb',
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "n8nLeadWorkflowId" TEXT,
    "n8nIcebreakerWorkflowId" TEXT,
    "googleSheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspeccionSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FacturacionSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "puntoVenta" INTEGER NOT NULL,
    "condicionIva" TEXT NOT NULL DEFAULT 'Responsable Inscripto',
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "flaskTenantId" INTEGER,
    "flaskUserEmail" TEXT,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturacionSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CausasSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "mevUser" TEXT NOT NULL,
    "mevPass" TEXT NOT NULL,
    "mevIv" TEXT NOT NULL,
    "mevTag" TEXT NOT NULL,
    "dptoTipo" TEXT NOT NULL DEFAULT 'CC',
    "dptoId" TEXT NOT NULL,
    "dptoNombre" TEXT NOT NULL DEFAULT '',
    "totalCausas" INTEGER NOT NULL DEFAULT 0,
    "lastScrapeAt" TIMESTAMP(3),
    "scrapeFrequency" TEXT NOT NULL DEFAULT '24h',
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "scraperTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CausasSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CausasCase" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "caratula" TEXT NOT NULL,
    "nroExpediente" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT '',
    "courtName" TEXT NOT NULL DEFAULT '',
    "setName" TEXT NOT NULL DEFAULT '',
    "pidJuzgado" TEXT NOT NULL DEFAULT '',
    "nidCausa" TEXT NOT NULL,
    "fechaInicio" TEXT NOT NULL DEFAULT '',
    "movimientos" TEXT NOT NULL DEFAULT '[]',
    "totalMovimientos" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CausasCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TurnosSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL DEFAULT 'Estudio Juridico',
    "logoUrl" TEXT,
    "colorPrimary" TEXT NOT NULL DEFAULT '#1a365d',
    "colorAccent" TEXT NOT NULL DEFAULT '#c9a84c',
    "scheduleDays" TEXT NOT NULL DEFAULT '[]',
    "scheduleSlots" TEXT NOT NULL DEFAULT '{}',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "practiceAreas" TEXT NOT NULL DEFAULT '[]',
    "holidays" TEXT NOT NULL DEFAULT '[]',
    "n8nWorkflowId" TEXT,
    "googleCalendarId" TEXT,
    "googleSheetId" TEXT,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnosSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SuiteJuridicaSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "monitoringSubId" TEXT,
    "facturacionSubId" TEXT,
    "causasSubId" TEXT,
    "turnosSubId" TEXT,
    "preapprovalId" TEXT,
    "payerEmail" TEXT NOT NULL,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuiteJuridicaSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LexPostSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "igUsername" TEXT,
    "igAccountCount" INTEGER NOT NULL DEFAULT 1,
    "publicationsUsed" INTEGER NOT NULL DEFAULT 0,
    "publicationsLimit" INTEGER NOT NULL DEFAULT 10,
    "lexpostTenantId" TEXT,
    "lexpostUserEmail" TEXT,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "trialEndsAt" TIMESTAMP(3),
    "provisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LexPostSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TradingSubscription_userId_status_idx" ON "TradingSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LinkedInSubscription_userId_status_idx" ON "LinkedInSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeadsSubscription_userId_status_idx" ON "LeadsSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProspeccionSubscription_userId_status_idx" ON "ProspeccionSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FacturacionSubscription_userId_status_idx" ON "FacturacionSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FacturacionSubscription_userId_cuit_idx" ON "FacturacionSubscription"("userId", "cuit");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FacturacionSubscription_preapprovalId_idx" ON "FacturacionSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CausasSubscription_userId_status_idx" ON "CausasSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CausasSubscription_preapprovalId_idx" ON "CausasSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CausasCase_subscriptionId_idx" ON "CausasCase"("subscriptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CausasCase_subscriptionId_estado_idx" ON "CausasCase"("subscriptionId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CausasCase_subscriptionId_nidCausa_key" ON "CausasCase"("subscriptionId", "nidCausa");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TurnosSubscription_slug_key" ON "TurnosSubscription"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TurnosSubscription_userId_status_idx" ON "TurnosSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TurnosSubscription_slug_idx" ON "TurnosSubscription"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TurnosSubscription_preapprovalId_idx" ON "TurnosSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SuiteJuridicaSubscription_userId_status_idx" ON "SuiteJuridicaSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SuiteJuridicaSubscription_preapprovalId_idx" ON "SuiteJuridicaSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LexPostSubscription_userId_status_idx" ON "LexPostSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LexPostSubscription_preapprovalId_idx" ON "LexPostSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MonitoringSubscription_userId_status_idx" ON "MonitoringSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MonitoringSubscription_userId_cuil_idx" ON "MonitoringSubscription"("userId", "cuil");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MonitoringSubscription_preapprovalId_idx" ON "MonitoringSubscription"("preapprovalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReviewsSubscription_userId_status_idx" ON "ReviewsSubscription"("userId", "status");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'PasswordResetToken_userId_fkey' AND conrelid = '"PasswordResetToken"'::regclass
  ) THEN
    ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Media_userId_fkey' AND conrelid = '"Media"'::regclass
  ) THEN
    ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TradingSubscription_userId_fkey' AND conrelid = '"TradingSubscription"'::regclass
  ) THEN
    ALTER TABLE "TradingSubscription" ADD CONSTRAINT "TradingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TradingSubscription_couponId_fkey' AND conrelid = '"TradingSubscription"'::regclass
  ) THEN
    ALTER TABLE "TradingSubscription" ADD CONSTRAINT "TradingSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LinkedInSubscription_userId_fkey' AND conrelid = '"LinkedInSubscription"'::regclass
  ) THEN
    ALTER TABLE "LinkedInSubscription" ADD CONSTRAINT "LinkedInSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LinkedInSubscription_couponId_fkey' AND conrelid = '"LinkedInSubscription"'::regclass
  ) THEN
    ALTER TABLE "LinkedInSubscription" ADD CONSTRAINT "LinkedInSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LeadsSubscription_userId_fkey' AND conrelid = '"LeadsSubscription"'::regclass
  ) THEN
    ALTER TABLE "LeadsSubscription" ADD CONSTRAINT "LeadsSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LeadsSubscription_couponId_fkey' AND conrelid = '"LeadsSubscription"'::regclass
  ) THEN
    ALTER TABLE "LeadsSubscription" ADD CONSTRAINT "LeadsSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProspeccionSubscription_userId_fkey' AND conrelid = '"ProspeccionSubscription"'::regclass
  ) THEN
    ALTER TABLE "ProspeccionSubscription" ADD CONSTRAINT "ProspeccionSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ProspeccionSubscription_couponId_fkey' AND conrelid = '"ProspeccionSubscription"'::regclass
  ) THEN
    ALTER TABLE "ProspeccionSubscription" ADD CONSTRAINT "ProspeccionSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FacturacionSubscription_userId_fkey' AND conrelid = '"FacturacionSubscription"'::regclass
  ) THEN
    ALTER TABLE "FacturacionSubscription" ADD CONSTRAINT "FacturacionSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FacturacionSubscription_couponId_fkey' AND conrelid = '"FacturacionSubscription"'::regclass
  ) THEN
    ALTER TABLE "FacturacionSubscription" ADD CONSTRAINT "FacturacionSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CausasSubscription_userId_fkey' AND conrelid = '"CausasSubscription"'::regclass
  ) THEN
    ALTER TABLE "CausasSubscription" ADD CONSTRAINT "CausasSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CausasSubscription_couponId_fkey' AND conrelid = '"CausasSubscription"'::regclass
  ) THEN
    ALTER TABLE "CausasSubscription" ADD CONSTRAINT "CausasSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'CausasCase_subscriptionId_fkey' AND conrelid = '"CausasCase"'::regclass
  ) THEN
    ALTER TABLE "CausasCase" ADD CONSTRAINT "CausasCase_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CausasSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TurnosSubscription_userId_fkey' AND conrelid = '"TurnosSubscription"'::regclass
  ) THEN
    ALTER TABLE "TurnosSubscription" ADD CONSTRAINT "TurnosSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TurnosSubscription_couponId_fkey' AND conrelid = '"TurnosSubscription"'::regclass
  ) THEN
    ALTER TABLE "TurnosSubscription" ADD CONSTRAINT "TurnosSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SuiteJuridicaSubscription_userId_fkey' AND conrelid = '"SuiteJuridicaSubscription"'::regclass
  ) THEN
    ALTER TABLE "SuiteJuridicaSubscription" ADD CONSTRAINT "SuiteJuridicaSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SuiteJuridicaSubscription_couponId_fkey' AND conrelid = '"SuiteJuridicaSubscription"'::regclass
  ) THEN
    ALTER TABLE "SuiteJuridicaSubscription" ADD CONSTRAINT "SuiteJuridicaSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LexPostSubscription_userId_fkey' AND conrelid = '"LexPostSubscription"'::regclass
  ) THEN
    ALTER TABLE "LexPostSubscription" ADD CONSTRAINT "LexPostSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LexPostSubscription_couponId_fkey' AND conrelid = '"LexPostSubscription"'::regclass
  ) THEN
    ALTER TABLE "LexPostSubscription" ADD CONSTRAINT "LexPostSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

