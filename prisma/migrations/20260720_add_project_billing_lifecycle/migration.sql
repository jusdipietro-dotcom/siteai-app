-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "billingStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Project" ADD COLUMN     "graceUntil" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN     "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN     "suspendedReason" TEXT;

-- The public gate filters on billingStatus alongside status/hasPaid on every
-- request to a published site, so keep that lookup index-backed.
CREATE INDEX "Project_billingStatus_graceUntil_idx" ON "Project"("billingStatus", "graceUntil");
