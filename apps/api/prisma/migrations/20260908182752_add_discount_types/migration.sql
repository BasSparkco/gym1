-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountTypeId" TEXT,
ADD COLUMN     "regularPrice" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "DiscountType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountType_tenantId_idx" ON "DiscountType"("tenantId");

-- CreateIndex
CREATE INDEX "Membership_discountTypeId_idx" ON "Membership"("discountTypeId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_discountTypeId_fkey" FOREIGN KEY ("discountTypeId") REFERENCES "DiscountType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountType" ADD CONSTRAINT "DiscountType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
