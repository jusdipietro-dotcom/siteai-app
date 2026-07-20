-- Read-path indexes for Project.
--
-- Project carried only @@index([billingStatus, graceUntil]), so three of the
-- hottest lookups in the app were sequential scans:
--
--   preapprovalId  Every 'payment' / 'subscription_authorized_payment' webhook
--                  resolves the project with findFirst({ where: { preapprovalId } }).
--                  That fires for all 13 products, so a payment for any other
--                  product still seq-scanned the whole Project table. Every other
--                  subscription model already has this index.
--   userId         The owner lookup behind every project route.
--   slug           lib/published-site.ts resolves a published site by slug on
--                  every public page view.
--
-- None of the three is unique (subdomain already has its own unique index), so
-- these are plain btree indexes. Written by hand rather than by `prisma migrate
-- dev` so the folder sorts after 20260723_add_project_gift_provenance; the
-- statements are what Prisma would emit, and the matching @@index entries are in
-- schema.prisma so this does not read as drift.

-- CreateIndex
CREATE INDEX "Project_preapprovalId_idx" ON "Project"("preapprovalId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_slug_idx" ON "Project"("slug");
