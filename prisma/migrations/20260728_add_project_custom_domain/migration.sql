-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "customDomain" TEXT;
ALTER TABLE "Project" ADD COLUMN     "customDomainStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Project" ADD COLUMN     "customDomainVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Project_customDomain_key" ON "Project"("customDomain");
