/*
  Warnings:

  - A unique constraint covering the columns `[patientId]` on the table `PatientAllergy` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PatientAllergy" ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "PatientAllergy_patientId_key" ON "PatientAllergy"("patientId");
