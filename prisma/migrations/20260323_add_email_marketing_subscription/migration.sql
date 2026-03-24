-- CreateTable
CREATE TABLE "EmailMarketingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "plan" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactCount" INTEGER NOT NULL DEFAULT 0,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "notificationEmail" TEXT NOT NULL,
    "payerEmail" TEXT NOT NULL,
    "preapprovalId" TEXT,
    "couponId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "provisionedAt" TIMESTAMP(3),
    "n8nWorkflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingSubscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailMarketingSubscription" ADD CONSTRAINT "EmailMarketingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingSubscription" ADD CONSTRAINT "EmailMarketingSubscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
