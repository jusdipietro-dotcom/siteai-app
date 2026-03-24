-- CreateIndex
CREATE INDEX "EmailMarketingSubscription_userId_status_idx" ON "EmailMarketingSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "EmailMarketingSubscription_userId_businessName_idx" ON "EmailMarketingSubscription"("userId", "businessName");
