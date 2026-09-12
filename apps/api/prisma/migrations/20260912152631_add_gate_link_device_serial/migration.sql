-- AlterTable
ALTER TABLE "Gate" ADD COLUMN "linkDeviceSerial" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Gate_linkDeviceSerial_key" ON "Gate"("linkDeviceSerial");
