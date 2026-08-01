-- CreateTable
CREATE TABLE "ProgramEnrollmentEvent" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ProgramEnrollmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramEnrollmentEvent_memberId_idx" ON "ProgramEnrollmentEvent"("memberId");

-- AddForeignKey
ALTER TABLE "ProgramEnrollmentEvent" ADD CONSTRAINT "ProgramEnrollmentEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEnrollmentEvent" ADD CONSTRAINT "ProgramEnrollmentEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
