-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'paused');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedReason" TEXT,
ADD COLUMN     "status" "TenantStatus" NOT NULL DEFAULT 'active';
