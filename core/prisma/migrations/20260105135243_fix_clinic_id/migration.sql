/*
  Warnings:

  - You are about to drop the column `clinicClinicId` on the `MedicalRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MedicalRecord" DROP CONSTRAINT "MedicalRecord_clinicClinicId_fkey";

-- AlterTable
ALTER TABLE "MedicalRecord" DROP COLUMN "clinicClinicId",
ADD COLUMN     "clinicId" UUID;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;
