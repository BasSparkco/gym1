-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "allowAllGates" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EmployeeVisit" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "accessMethod" "AccessMethod" NOT NULL,
    "gateId" TEXT,

    CONSTRAINT "EmployeeVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeeVisit_employeeId_idx" ON "EmployeeVisit"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeVisit_branchId_checkInTime_idx" ON "EmployeeVisit"("branchId", "checkInTime");

-- CreateIndex
CREATE INDEX "EmployeeVisit_employeeId_branchId_checkOutTime_idx" ON "EmployeeVisit"("employeeId", "branchId", "checkOutTime");

-- AddForeignKey
ALTER TABLE "EmployeeVisit" ADD CONSTRAINT "EmployeeVisit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeVisit" ADD CONSTRAINT "EmployeeVisit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeVisit" ADD CONSTRAINT "EmployeeVisit_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
