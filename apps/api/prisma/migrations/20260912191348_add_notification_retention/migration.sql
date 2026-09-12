-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "notificationRetention" TEXT NOT NULL DEFAULT 'never';
