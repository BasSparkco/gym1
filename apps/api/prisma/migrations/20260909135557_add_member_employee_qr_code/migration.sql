-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "qrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_qrCode_key" ON "Employee"("tenantId", "qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "Member_tenantId_qrCode_key" ON "Member"("tenantId", "qrCode");
