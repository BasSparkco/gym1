-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "restrictToHomeBranch" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MembershipPlanBranch" (
    "planId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "MembershipPlanBranch_pkey" PRIMARY KEY ("planId","branchId")
);

-- AddForeignKey
ALTER TABLE "MembershipPlanBranch" ADD CONSTRAINT "MembershipPlanBranch_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPlanBranch" ADD CONSTRAINT "MembershipPlanBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
