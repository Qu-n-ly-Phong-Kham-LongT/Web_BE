/*
  Warnings:

  - The primary key for the `MedicalRecordSequence` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `patientId` on the `MedicalRecordSequence` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MedicalRecordSequence" DROP CONSTRAINT IF EXISTS "MedicalRecordSequence_patientId_fkey";

-- AlterTable
ALTER TABLE "MedicalRecordSequence"
  DROP CONSTRAINT IF EXISTS "MedicalRecordSequence_pkey",
  DROP COLUMN IF EXISTS "patientId",
  ADD CONSTRAINT "MedicalRecordSequence_pkey" PRIMARY KEY ("monthKey");
