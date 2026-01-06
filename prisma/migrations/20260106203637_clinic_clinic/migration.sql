/*
  Warnings:

  - You are about to drop the column `clinicClinicId` on the `Medicine` table. All the data in the column will be lost.
  - You are about to drop the column `clinicClinicId` on the `Patient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Medicine" DROP CONSTRAINT "Medicine_clinicClinicId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_clinicClinicId_fkey";

-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN "clinicClinicId",
ADD COLUMN     "clinicId" UUID;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "clinicClinicId",
ADD COLUMN     "clinicId" UUID;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("clinicId") ON DELETE SET NULL ON UPDATE CASCADE;
