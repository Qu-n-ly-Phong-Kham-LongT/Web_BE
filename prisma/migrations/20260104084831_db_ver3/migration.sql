/*
  Warnings:

  - The values [Return] on the enum `InventoryLogType` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `templateName` on table `PrescriptionTemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `templateId` on table `PrescriptionTemplateDetail` required. This step will fail if there are existing NULL values in that column.
  - Made the column `medicineId` on table `PrescriptionTemplateDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InventoryLogType_new" AS ENUM ('Import', 'Export', 'Adjustment');
ALTER TABLE "InventoryLog" ALTER COLUMN "type" TYPE "InventoryLogType_new" USING ("type"::text::"InventoryLogType_new");
ALTER TYPE "InventoryLogType" RENAME TO "InventoryLogType_old";
ALTER TYPE "InventoryLogType_new" RENAME TO "InventoryLogType";
DROP TYPE "public"."InventoryLogType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PrescriptionTemplateDetail" DROP CONSTRAINT "PrescriptionTemplateDetail_medicineId_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionTemplateDetail" DROP CONSTRAINT "PrescriptionTemplateDetail_templateId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceResult" DROP CONSTRAINT "ServiceResult_detailId_fkey";

-- AlterTable
ALTER TABLE "ClinicalExamination" ADD COLUMN     "userUserId" UUID;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "clinicClinicId" UUID;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "clinicClinicId" UUID;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "clinicClinicId" UUID;

-- AlterTable
ALTER TABLE "PrescriptionTemplate" ALTER COLUMN "templateName" SET NOT NULL;

-- AlterTable
ALTER TABLE "PrescriptionTemplateDetail" ALTER COLUMN "templateId" SET NOT NULL,
ALTER COLUMN "medicineId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "serviceResultResultId" UUID;

-- CreateTable
CREATE TABLE "PatientAllergy" (
    "allergyId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patientId" UUID NOT NULL,
    "reaction" TEXT,
    "note" TEXT,

    CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY ("allergyId")
);

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicClinicId_fkey" FOREIGN KEY ("clinicClinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_clinicClinicId_fkey" FOREIGN KEY ("clinicClinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_examinedBy_fkey" FOREIGN KEY ("examinedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_userUserId_fkey" FOREIGN KEY ("userUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceResultResultId_fkey" FOREIGN KEY ("serviceResultResultId") REFERENCES "ServiceResult"("resultId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_clinicClinicId_fkey" FOREIGN KEY ("clinicClinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("templateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateDetail" ADD CONSTRAINT "PrescriptionTemplateDetail_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("medicineId") ON DELETE RESTRICT ON UPDATE CASCADE;
