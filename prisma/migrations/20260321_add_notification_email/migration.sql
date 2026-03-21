-- Add notificationEmail column (default to payerEmail for existing rows)
ALTER TABLE "MonitoringSubscription" ADD COLUMN "notificationEmail" TEXT;
UPDATE "MonitoringSubscription" SET "notificationEmail" = "payerEmail" WHERE "notificationEmail" IS NULL;
ALTER TABLE "MonitoringSubscription" ALTER COLUMN "notificationEmail" SET NOT NULL;
