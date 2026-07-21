-- Coupon redemption provenance for the website generator.
--
-- Until now `Coupon` had a relation to each of the 12 subscription products but
-- none to `Project`, so the generator could not accept a code at all. These two
-- columns are what makes a redemption traceable: `couponId` says which coupon
-- paid for the site and `couponRedeemedAt` when, which together separate a
-- coupon-redeemed site from an admin gift (grantedBy/grantedAt) and from a real
-- MercadoPago sale (preapprovalId).
--
-- Both nullable with no default: NULL means "no coupon was redeemed", the
-- correct reading for every existing row.
--
-- ON DELETE SET NULL matches the optional relation: deactivating a coupon is
-- done with active=false, but if a row were ever hard-deleted the project must
-- survive it — losing a site because its coupon was purged would be far worse
-- than losing the provenance.
--
-- No index: the same reasoning as the gift columns. The admin panel scans the
-- Project table anyway, and none of the other 12 coupon relations index their
-- couponId either.

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "couponRedeemedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
