-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "operatingCurrencyCode" TEXT NOT NULL DEFAULT 'ILS';

-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "reportingCurrencyCode" TEXT NOT NULL DEFAULT 'ILS';
