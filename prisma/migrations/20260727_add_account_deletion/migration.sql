-- Account deletion lifecycle.
--
-- app/privacy/page.tsx has always promised "si eliminás tu cuenta, tus datos
-- personales serán eliminados en un plazo de 30 días" while no deletion
-- mechanism existed. These three columns are the state that makes the promise
-- keepable, and they are deliberately three columns rather than one status
-- string because each is written at a different moment and answers a different
-- question:
--
--   deletionRequestedAt   when the owner asked. Non-null blocks ALL access
--                         immediately — the account must be unusable from that
--                         instant, not 30 days later.
--   deletionScheduledFor  the earliest instant the purge may run (requestedAt
--                         + 30 days). Stored rather than derived from
--                         requestedAt so that changing the window in code can
--                         never retroactively move a deadline already promised
--                         to a specific person.
--   deletedAt             when the purge actually anonymised the row. Non-null
--                         marks a billing TOMBSTONE.
--
-- All three nullable with no default: NULL across the board is the correct
-- reading for every existing row (nobody has requested deletion).
--
-- No backfill, and deliberately no NOT NULL: an account that never asked to be
-- deleted must be indistinguishable from one that predates this migration.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deletionScheduledFor" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- The daily maintenance job (POST /api/admin/expire-trials) scans exactly
-- "scheduled on or before now AND not purged yet" once per day. Without this
-- index that sweep is a full seq-scan of User on every run.
-- CreateIndex
CREATE INDEX "User_deletionScheduledFor_deletedAt_idx" ON "User"("deletionScheduledFor", "deletedAt");
