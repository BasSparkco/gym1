-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "isMain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useMainBranchWhatsapp" BOOLEAN NOT NULL DEFAULT false;

-- One tenant can never have two main branches.
CREATE UNIQUE INDEX "Branch_tenantId_isMain_key" ON "Branch" ("tenantId") WHERE "isMain" = true;

-- Backfill: Branch has no createdAt, so creation order can't be reconstructed
-- generically. These two ids were identified manually (lowest employeeNumber /
-- Owner-job employee per tenant, confirmed against both dev and prod data) as
-- the branch created at tenant signup for the only two tenants that exist
-- today. Every tenant created from here on gets isMain set at creation time
-- in PlatformAdminTenantsService.createTenant — this UPDATE never needs to
-- run again.
UPDATE "Branch" SET "isMain" = true WHERE id IN ('Platinum Fitness', 'branch-38e36b2c-39dc-4598-9a6f-b68106a3eae2');
