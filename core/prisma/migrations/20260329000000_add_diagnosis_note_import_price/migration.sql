-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN "diagnosisNote" TEXT;

-- AlterTable
ALTER TABLE "PrescriptionDetail" ADD COLUMN "appliedImportPrice" DECIMAL(18,0);

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "diagnosisNote" TEXT;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN "importPrice" DECIMAL(18,0);
