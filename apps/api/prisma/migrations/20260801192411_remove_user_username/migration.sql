-- DropIndex
DROP INDEX "User_tenantId_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username";
