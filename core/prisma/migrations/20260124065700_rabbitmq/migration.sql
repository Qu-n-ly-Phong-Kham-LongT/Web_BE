-- CreateEnum
CREATE TYPE "PrintJobType" AS ENUM ('MEDICAL_RECORD', 'PRESCRIPTION', 'SERVICE_REQUEST');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "PrintJob" (
    "jobId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "PrintJobType" NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'PENDING',
    "entityId" UUID,
    "clinicId" UUID,
    "userId" UUID,
    "payload" JSONB DEFAULT '{}',
    "errorMsg" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "startedAt" TIMESTAMPTZ,
    "finishedAt" TIMESTAMPTZ,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("jobId")
);

-- CreateIndex
CREATE INDEX "PrintJob_status_idx" ON "PrintJob"("status");

-- CreateIndex
CREATE INDEX "PrintJob_type_idx" ON "PrintJob"("type");

-- CreateIndex
CREATE INDEX "PrintJob_entityId_idx" ON "PrintJob"("entityId");

-- CreateIndex
CREATE INDEX "PrintJob_clinicId_idx" ON "PrintJob"("clinicId");

-- CreateIndex
CREATE INDEX "PrintJob_userId_idx" ON "PrintJob"("userId");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "PrintJob"("createdAt");

-- AddForeignKey
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("fileID") ON DELETE SET NULL ON UPDATE CASCADE;
