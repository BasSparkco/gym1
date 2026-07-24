-- CreateEnum
CREATE TYPE "LockerSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('available', 'occupied', 'maintenance');

-- CreateEnum
CREATE TYPE "LockerRentalStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "lockerNumber" TEXT NOT NULL,
    "size" "LockerSize",
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "status" "LockerStatus" NOT NULL DEFAULT 'available',

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockerRental" (
    "id" TEXT NOT NULL,
    "lockerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "LockerRentalStatus" NOT NULL DEFAULT 'active',
    "finalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LockerRental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Locker_tenantId_idx" ON "Locker"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Locker_branchId_lockerNumber_key" ON "Locker"("branchId", "lockerNumber");

-- CreateIndex
CREATE INDEX "LockerRental_memberId_idx" ON "LockerRental"("memberId");

-- CreateIndex
CREATE INDEX "LockerRental_lockerId_idx" ON "LockerRental"("lockerId");

-- CreateIndex
CREATE INDEX "LockerRental_status_endDate_idx" ON "LockerRental"("status", "endDate");

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockerRental" ADD CONSTRAINT "LockerRental_lockerId_fkey" FOREIGN KEY ("lockerId") REFERENCES "Locker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockerRental" ADD CONSTRAINT "LockerRental_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
