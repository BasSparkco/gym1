-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('active', 'cancelled');

-- AlterTable: TrainingProgram gains its own price + course term dates
ALTER TABLE "TrainingProgram"
    ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "startDate" DATE,
    ADD COLUMN "endDate" DATE;

-- AlterTable: ProgramEnrollment gains a price snapshot + status
ALTER TABLE "ProgramEnrollment"
    ADD COLUMN "finalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "status" "ProgramEnrollmentStatus" NOT NULL DEFAULT 'active';

ALTER TABLE "ProgramEnrollment" ALTER COLUMN "finalPrice" DROP DEFAULT;

-- AlterTable: ClassBooking is no longer authorized via an active membership
ALTER TABLE "ClassBooking" DROP CONSTRAINT "ClassBooking_membershipId_fkey";
ALTER TABLE "ClassBooking" ALTER COLUMN "membershipId" DROP NOT NULL;
ALTER TABLE "ClassBooking" ADD CONSTRAINT "ClassBooking_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ProgramScheduleSlot" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,

    CONSTRAINT "ProgramScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramScheduleSlot_programId_idx" ON "ProgramScheduleSlot"("programId");

-- AddForeignKey
ALTER TABLE "ProgramScheduleSlot" ADD CONSTRAINT "ProgramScheduleSlot_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
