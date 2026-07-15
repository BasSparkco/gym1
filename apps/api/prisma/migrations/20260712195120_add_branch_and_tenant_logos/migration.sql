-- CreateEnum
CREATE TYPE "LogoMode" AS ENUM ('shared', 'perBranch');

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "logoMode" "LogoMode" NOT NULL DEFAULT 'shared',
ADD COLUMN     "logoUrl" TEXT;
