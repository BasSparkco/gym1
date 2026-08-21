-- CreateEnum
CREATE TYPE "GateAccessScope" AS ENUM ('branch', 'organization', 'selected');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "gateAccessScope" "GateAccessScope" NOT NULL DEFAULT 'branch';

-- Backfill: AccessService's gate check never actually filtered by branch
-- when allowAllGates was true (a latent bug — the code let those employees
-- through at any gate in the tenant, not just their own branch, despite the
-- old column's doc comment claiming branch-only). Map existing `true` rows
-- to 'organization' rather than the new 'branch' default so live employee
-- access doesn't silently narrow the moment this migration runs; admins can
-- deliberately tighten individual employees to 'branch' afterwards.
UPDATE "Employee" SET "gateAccessScope" = CASE WHEN "allowAllGates" THEN 'organization' ELSE 'selected' END::"GateAccessScope";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "allowAllGates";
