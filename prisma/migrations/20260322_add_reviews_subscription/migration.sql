-- CreateTable
CREATE TABLE "ReviewsSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "searchUrl" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "responseTone" TEXT NOT NULL DEFAULT 'profesional',
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "provisionedAt" TIMESTAMP(3),
    "n8nTenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewsSubscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReviewsSubscription" ADD CONSTRAINT "ReviewsSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewsSubscription" ADD CONSTRAINT "ReviewsSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
