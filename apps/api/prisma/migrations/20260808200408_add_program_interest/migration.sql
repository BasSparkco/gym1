-- CreateTable
CREATE TABLE "ProgramInterest" (
    "programId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "expressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramInterest_pkey" PRIMARY KEY ("programId","memberId")
);

-- CreateIndex
CREATE INDEX "ProgramInterest_memberId_idx" ON "ProgramInterest"("memberId");

-- AddForeignKey
ALTER TABLE "ProgramInterest" ADD CONSTRAINT "ProgramInterest_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramInterest" ADD CONSTRAINT "ProgramInterest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
