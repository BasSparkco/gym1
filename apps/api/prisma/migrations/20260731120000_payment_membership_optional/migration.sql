-- Payments now cover locker rentals and course enrollments too, not just
-- memberships (member debt is already computed as one aggregate balance —
-- see DebtService — so a payment was never really earmarked to one specific
-- membership). Drop the NOT NULL so staff can record a payment for a member
-- who only has a locker rental or course enrollment, with no membership at all.
ALTER TABLE "Payment" ALTER COLUMN "membershipId" DROP NOT NULL;
