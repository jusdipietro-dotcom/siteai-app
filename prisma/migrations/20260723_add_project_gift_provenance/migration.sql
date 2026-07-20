-- Gift provenance for projects comped by an admin.
--
-- Before this, a gifted project was indistinguishable from a genuinely paid
-- one: both were just hasPaid = true. These columns record who granted it and
-- when, so revenue reporting can exclude comped sites and a gift can be
-- audited later.
--
-- Both nullable with no default: NULL/NULL means "not a gift", which is the
-- correct reading for every row that already exists. No index — the admin
-- panel scans the whole Project table anyway, and adding one Prisma cannot
-- express in schema.prisma would show up as migration drift forever.

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "grantedBy" TEXT;
ALTER TABLE "Project" ADD COLUMN     "grantedAt" TIMESTAMP(3);
