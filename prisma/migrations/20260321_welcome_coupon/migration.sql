-- Insert BIENVENIDA10 coupon: 10% off first month, unlimited uses, valid 1 year
INSERT INTO "Coupon" ("id", "code", "discount", "maxUses", "usedCount", "validFrom", "validUntil", "createdBy", "active", "createdAt", "updatedAt")
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
  NOW(),
  NOW()
)
ON CONFLICT ("code") DO NOTHING;
