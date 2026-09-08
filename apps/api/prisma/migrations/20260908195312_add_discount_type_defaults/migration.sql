-- AlterTable
ALTER TABLE "DiscountType" ADD COLUMN     "defaultPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "nameHe" TEXT;
