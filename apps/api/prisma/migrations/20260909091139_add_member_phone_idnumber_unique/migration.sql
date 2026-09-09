-- CreateIndex
CREATE UNIQUE INDEX "Member_tenantId_phone_key" ON "Member"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Member_tenantId_idNumber_key" ON "Member"("tenantId", "idNumber");

