-- CreateTable
CREATE TABLE "SiteLead" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteLead_projectId_createdAt_idx" ON "SiteLead"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "SiteLead" ADD CONSTRAINT "SiteLead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
