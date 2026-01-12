/*
  Warnings:

  - A unique constraint covering the columns `[medicalRecordId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prescriptionId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClinicalExamination" ADD COLUMN     "bmi" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "medicalRecordId" UUID,
ADD COLUMN     "prescriptionId" UUID,
ADD COLUMN     "serviceRequestId" UUID,
ADD COLUMN     "serviceResultId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "File_medicalRecordId_key" ON "File"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "File_prescriptionId_key" ON "File"("prescriptionId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("recordId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("prescriptionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("requestId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_serviceResultId_fkey" FOREIGN KEY ("serviceResultId") REFERENCES "ServiceResult"("resultId") ON DELETE SET NULL ON UPDATE CASCADE;
