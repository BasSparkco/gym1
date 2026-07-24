-- AlterTable: cached total-owed figure, recomputed by DebtService on every
-- membership/locker-rental/course-enrollment/payment change.
ALTER TABLE "Member" ADD COLUMN "debt" DECIMAL(10,2) NOT NULL DEFAULT 0;
