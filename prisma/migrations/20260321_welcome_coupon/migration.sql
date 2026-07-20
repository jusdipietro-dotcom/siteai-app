-- EDITED (see docs/deploy/prisma-migration-reconciliation.md, "The welcome_coupon repair").
-- This INSERT originally listed an "updatedAt" column. `model Coupon` has never had
-- one, and neither did the `CREATE TABLE "Coupon"` in 20260321_add_monitoring_and_coupons,
-- so this statement could never execute: `migrate deploy` aborted here with
-- `42703 column "updatedAt" of relation "Coupon" does not exist`, and `migrate dev`
-- aborted with P3006 for the same reason. The migration therefore has NEVER been
-- applied by execution anywhere -- only ever recorded via `migrate resolve --applied`.
-- Removing the phantom column is the only fix; a later migration cannot repair a
-- statement that aborts the deploy before it is reached.

-- Insert BIENVENIDA10 coupon: 10% off first month, unlimited uses, valid 1 year
INSERT INTO "Coupon" ("id", "code", "discount", "maxUses", "usedCount", "validFrom", "validUntil", "createdBy", "active", "createdAt")
VALUES (
  'coupon_bienvenida10',
  'BIENVENIDA10',
  10,
  999999,
  0,
  NOW(),
  NOW() + INTERVAL '1 year',
  'system',
  true,
  NOW()
)
ON CONFLICT ("code") DO NOTHING;
