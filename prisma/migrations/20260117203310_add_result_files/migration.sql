-- CreateTable
CREATE TABLE "ResultFile" (
    "fileID" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "relativePath" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceRequestId" UUID,

    CONSTRAINT "ResultFile_pkey" PRIMARY KEY ("fileID")
);

-- AddForeignKey
ALTER TABLE "ResultFile" ADD CONSTRAINT "ResultFile_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;
