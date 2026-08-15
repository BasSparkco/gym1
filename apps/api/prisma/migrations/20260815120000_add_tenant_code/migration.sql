-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");
