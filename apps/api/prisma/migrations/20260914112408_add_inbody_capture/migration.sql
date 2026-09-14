-- CreateTable
CREATE TABLE "InbodyCapture" (
    "tenantId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "totalBytes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InbodyCapture_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "InbodyCaptureRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" JSONB,
    "headers" JSONB NOT NULL,
    "contentType" TEXT,
    "bodyLength" INTEGER NOT NULL,
    "objectKey" TEXT,
    "storageError" TEXT,

    CONSTRAINT "InbodyCaptureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InbodyCapture_secret_key" ON "InbodyCapture"("secret");

-- CreateIndex
CREATE INDEX "InbodyCaptureRequest_tenantId_receivedAt_idx" ON "InbodyCaptureRequest"("tenantId", "receivedAt");

-- AddForeignKey
ALTER TABLE "InbodyCapture" ADD CONSTRAINT "InbodyCapture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InbodyCaptureRequest" ADD CONSTRAINT "InbodyCaptureRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
